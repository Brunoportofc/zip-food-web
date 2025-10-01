import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature } from '@/lib/stripe';
import { adminDb } from '@/lib/firebase/admin';
import { headers } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      console.error('Missing Stripe signature');
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.error('Missing STRIPE_WEBHOOK_SECRET');
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }

    // Verify webhook signature
    const event = verifyWebhookSignature(body, signature, process.env.STRIPE_WEBHOOK_SECRET);

    console.log('Received Stripe webhook:', event.type);

    // Handle different event types
    switch (event.type) {
      case 'account.updated':
        await handleAccountUpdated(event);
        break;

      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event);
        break;

      case 'transfer.created':
        await handleTransferCreated(event);
        break;

      case 'payout.paid':
        await handlePayoutPaid(event);
        break;

      case 'account.application.deauthorized':
        await handleAccountDeauthorized(event);
        break;

      case 'payment_intent.canceled':
        await handlePaymentCanceled(event);
        break;

      case 'charge.dispute.created':
        await handleChargeDispute(event);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 400 }
    );
  }
}

async function handleAccountUpdated(event: any) {
  try {
    const account = event.data.object;
    const accountId = account.id;

    // Find restaurant with this Stripe account
    const restaurantsQuery = await adminDb
      .collection('restaurants')
      .where('stripeAccountId', '==', accountId)
      .limit(1)
      .get();

    if (restaurantsQuery.empty) {
      console.log(`No restaurant found for Stripe account: ${accountId}`);
      return;
    }

    const restaurantDoc = restaurantsQuery.docs[0];
    const restaurantId = restaurantDoc.id;

    // Update restaurant with account status
    await adminDb.collection('restaurants').doc(restaurantId).update({
      stripeAccountStatus: {
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled,
        details_submitted: account.details_submitted,
        requirements: account.requirements,
      },
      updatedAt: new Date(),
    });

    console.log(`Updated restaurant ${restaurantId} Stripe account status`);

  } catch (error) {
    console.error('Error handling account.updated:', error);
  }
}

async function handlePaymentSucceeded(event: any) {
  try {
    const paymentIntent = event.data.object;
    const orderId = paymentIntent.metadata?.orderId;

    if (!orderId) {
      console.log('No orderId in payment intent metadata');
      return;
    }

    // Update order status
    await adminDb.collection('orders').doc(orderId).update({
      paymentStatus: 'paid',
      paymentIntentId: paymentIntent.id,
      paidAt: new Date(),
      updatedAt: new Date(),
    });

    // Send notification to restaurant
    const orderDoc = await adminDb.collection('orders').doc(orderId).get();
    if (orderDoc.exists) {
      const orderData = orderDoc.data();
      
      // Send notification to restaurant
      await adminDb.collection('notifications').add({
        type: 'payment.received',
        recipientId: orderData?.restaurantId,
        recipientType: 'restaurant',
        title: 'Pagamento Confirmado',
        message: `Pedido #${orderId} - Pagamento confirmado`,
        data: {
          orderId,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
        },
        read: false,
        createdAt: new Date(),
      });
    }

    console.log(`Payment succeeded for order: ${orderId}`);

  } catch (error) {
    console.error('Error handling payment_intent.succeeded:', error);
  }
}

async function handlePaymentFailed(event: any) {
  try {
    const paymentIntent = event.data.object;
    const orderId = paymentIntent.metadata?.orderId;

    if (!orderId) {
      console.log('No orderId in payment intent metadata');
      return;
    }

    // Update order status
    await adminDb.collection('orders').doc(orderId).update({
      paymentStatus: 'failed',
      paymentIntentId: paymentIntent.id,
      paymentError: paymentIntent.last_payment_error?.message,
      updatedAt: new Date(),
    });

    // Send notification to restaurant
    const orderDoc = await adminDb.collection('orders').doc(orderId).get();
    if (orderDoc.exists) {
      const orderData = orderDoc.data();
      
      await adminDb.collection('notifications').add({
        type: 'payment.failed',
        recipientId: orderData?.restaurantId,
        recipientType: 'restaurant',
        title: 'Falha no Pagamento',
        message: `Pedido #${orderId} - Falha no pagamento`,
        data: {
          orderId,
          error: paymentIntent.last_payment_error?.message,
        },
        read: false,
        createdAt: new Date(),
      });
    }

    console.log(`Payment failed for order: ${orderId}`);

  } catch (error) {
    console.error('Error handling payment_intent.payment_failed:', error);
  }
}

async function handleTransferCreated(event: any) {
  try {
    const transfer = event.data.object;
    const orderId = transfer.metadata?.orderId;

    if (orderId) {
      // Update order with transfer information
      await adminDb.collection('orders').doc(orderId).update({
        transferId: transfer.id,
        transferAmount: transfer.amount,
        transferredAt: new Date(),
        updatedAt: new Date(),
      });

      console.log(`Transfer created for order: ${orderId}`);
    }

  } catch (error) {
    console.error('Error handling transfer.created:', error);
  }
}

async function handlePayoutPaid(event: any) {
  try {
    const payout = event.data.object;
    const accountId = event.account;

    // Find restaurant with this Stripe account
    const restaurantsQuery = await adminDb
      .collection('restaurants')
      .where('stripeAccountId', '==', accountId)
      .limit(1)
      .get();

    if (restaurantsQuery.empty) {
      console.log(`No restaurant found for Stripe account: ${accountId}`);
      return;
    }

    const restaurantDoc = restaurantsQuery.docs[0];
    const restaurantId = restaurantDoc.id;

    // Send notification to restaurant
    await adminDb.collection('notifications').add({
      type: 'payout.paid',
      recipientId: restaurantId,
      recipientType: 'restaurant',
      title: 'Pagamento Recebido',
      message: `Você recebeu um pagamento de ${payout.amount / 100} ${payout.currency.toUpperCase()}`,
      data: {
        payoutId: payout.id,
        amount: payout.amount,
        currency: payout.currency,
        arrivalDate: payout.arrival_date,
      },
      read: false,
      createdAt: new Date(),
    });

    console.log(`Payout paid for restaurant: ${restaurantId}`);

  } catch (error) {
    console.error('Error handling payout.paid:', error);
  }
}

async function handleAccountDeauthorized(event: any) {
  try {
    const account = event.data.object;
    const accountId = account.id;

    // Find restaurant with this Stripe account
    const restaurantsQuery = await adminDb
      .collection('restaurants')
      .where('stripeAccountId', '==', accountId)
      .limit(1)
      .get();

    if (restaurantsQuery.empty) {
      console.log(`No restaurant found for Stripe account: ${accountId}`);
      return;
    }

    const restaurantDoc = restaurantsQuery.docs[0];
    const restaurantId = restaurantDoc.id;

    // Remove Stripe account from restaurant
    await adminDb.collection('restaurants').doc(restaurantId).update({
      stripeAccountId: null,
      stripeAccountStatus: null,
      updatedAt: new Date(),
    });

    console.log(`Account deauthorized for restaurant: ${restaurantId}`);

  } catch (error) {
    console.error('Error handling account.application.deauthorized:', error);
  }
}

async function handlePaymentCanceled(event: any) {
  try {
    const paymentIntent = event.data.object;
    const orderId = paymentIntent.metadata?.orderId;

    if (!orderId) {
      console.log('No orderId in payment intent metadata');
      return;
    }

    // Update order status
    await adminDb.collection('orders').doc(orderId).update({
      paymentStatus: 'canceled',
      status: 'cancelled',
      updatedAt: new Date(),
    });

    // Get order data for notifications
    const orderDoc = await adminDb.collection('orders').doc(orderId).get();
    if (orderDoc.exists) {
      const orderData = orderDoc.data();
      
      // Notify customer
      await adminDb.collection('notifications').add({
        type: 'payment.canceled',
        recipientId: orderData?.customerId,
        recipientType: 'customer',
        title: 'Pagamento Cancelado',
        message: `O pagamento do pedido #${orderId} foi cancelado`,
        data: { orderId },
        read: false,
        createdAt: new Date(),
      });

      // Notify restaurant
      await adminDb.collection('notifications').add({
        type: 'payment.canceled',
        recipientId: orderData?.restaurantId,
        recipientType: 'restaurant',
        title: 'Pagamento Cancelado',
        message: `Pagamento do pedido #${orderId} foi cancelado`,
        data: { orderId },
        read: false,
        createdAt: new Date(),
      });
    }

    console.log(`Payment canceled for order: ${orderId}`);

  } catch (error) {
    console.error('Error handling payment_intent.canceled:', error);
  }
}

async function handleChargeDispute(event: any) {
  try {
    const dispute = event.data.object;
    const chargeId = dispute.charge;
    const amount = dispute.amount;
    const reason = dispute.reason;

    // Log dispute for monitoring
    console.log(`Dispute created for charge ${chargeId}: ${reason} - Amount: ${amount / 100} BRL`);

    // Find order by charge ID (if stored)
    // This would require storing charge IDs in orders
    // For now, we'll create a general notification

    // Create dispute notification for admin/support
    await adminDb.collection('notifications').add({
      type: 'charge.dispute',
      recipientId: 'admin', // Admin user ID
      recipientType: 'admin',
      title: 'Disputa de Cobrança',
      message: `Nova disputa criada para cobrança ${chargeId}. Motivo: ${reason}`,
      data: {
        chargeId,
        disputeId: dispute.id,
        amount,
        reason,
        status: dispute.status,
      },
      read: false,
      createdAt: new Date(),
    });

  } catch (error) {
    console.error('Error handling charge.dispute.created:', error);
  }
}
