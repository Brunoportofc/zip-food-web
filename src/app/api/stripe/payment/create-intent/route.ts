import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/config';
import { stripeConnectService } from '@/lib/stripe/connect';
import { adminDb } from '@/lib/firebase/admin';
import { verifySessionCookie } from '@/lib/firebase/admin';
import { calculatePlatformFee, calculateRestaurantAmount } from '@/lib/stripe/config';

interface CreatePaymentIntentRequest {
  orderId: string;
  amount: number; // Amount in cents (BRL)
  restaurantId: string;
  paymentMethodTypes?: string[];
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const sessionCookie = request.cookies.get('session')?.value;
    
    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const decodedToken = await verifySessionCookie(sessionCookie);
    const customerId = decodedToken.uid;

    const body: CreatePaymentIntentRequest = await request.json();
    const { orderId, amount, restaurantId, paymentMethodTypes = ['card'] } = body;

    // Validate required fields
    if (!orderId || !amount || !restaurantId) {
      return NextResponse.json(
        { error: 'Missing required fields: orderId, amount, restaurantId' },
        { status: 400 }
      );
    }

    // Validate amount (minimum R$ 0.50)
    if (amount < 50) {
      return NextResponse.json(
        { error: 'Amount must be at least R$ 0.50' },
        { status: 400 }
      );
    }

    // Verify order exists and belongs to customer
    const orderDoc = await adminDb.collection('orders').doc(orderId).get();
    
    if (!orderDoc.exists) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    const orderData = orderDoc.data();
    
    if (orderData?.customer_id !== customerId) {
      return NextResponse.json(
        { error: 'Unauthorized access to order' },
        { status: 403 }
      );
    }

    // Check if order already has a payment intent
    if (orderData?.payment_intent_id) {
      return NextResponse.json(
        { error: 'Payment intent already exists for this order' },
        { status: 400 }
      );
    }

    // Verify restaurant can receive payments
    const canReceivePayments = await stripeConnectService.canReceivePayments(restaurantId);
    
    if (!canReceivePayments) {
      return NextResponse.json(
        { error: 'Restaurant cannot receive payments. Stripe setup incomplete.' },
        { status: 400 }
      );
    }

    // Get restaurant Stripe account
    const restaurantAccount = await stripeConnectService.getRestaurantAccount(restaurantId);
    
    if (!restaurantAccount) {
      return NextResponse.json(
        { error: 'Restaurant Stripe account not found' },
        { status: 404 }
      );
    }

    // Calculate platform fee and restaurant amount
    const platformFee = calculatePlatformFee(amount);
    const restaurantAmount = calculateRestaurantAmount(amount);

    // Create Payment Intent with application fee
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'brl',
      payment_method_types: paymentMethodTypes,
      application_fee_amount: platformFee,
      transfer_data: {
        destination: restaurantAccount.stripeAccountId,
      },
      metadata: {
        orderId,
        customerId,
        restaurantId,
        platformFee: platformFee.toString(),
        restaurantAmount: restaurantAmount.toString(),
      },
      description: `Pedido #${orderId} - ZipFood`,
      receipt_email: decodedToken.email || undefined,
    });

    // Update order with payment intent information
    await adminDb.collection('orders').doc(orderId).update({
      payment_intent_id: paymentIntent.id,
      payment_status: 'pending',
      payment_amount: amount,
      platform_fee: platformFee,
      restaurant_amount: restaurantAmount,
      updated_at: new Date(),
    });

    return NextResponse.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount,
      platformFee,
      restaurantAmount,
    });

  } catch (error) {
    console.error('Error creating payment intent:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to create payment intent',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}