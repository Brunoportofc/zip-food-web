import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/config';
import { adminDb, adminAuth } from '@/lib/firebase/admin';

interface RefundPaymentRequest {
  orderId: string;
  reason?: string;
  amount?: number; // Optional partial refund amount in cents
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

    const decodedToken = await adminAuth.verifySessionCookie(sessionCookie);
    const userId = decodedToken.uid;

    const body: RefundPaymentRequest = await request.json();
    const { orderId, reason = 'requested_by_customer', amount } = body;

    // Validate required fields
    if (!orderId) {
      return NextResponse.json(
        { error: 'Missing required field: orderId' },
        { status: 400 }
      );
    }

    // Verify order exists
    const orderDoc = await adminDb.collection('orders').doc(orderId).get();
    
    if (!orderDoc.exists) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    const orderData = orderDoc.data();

    // Check authorization - customer can refund their own orders, restaurant owners can refund orders from their restaurant
    const isCustomer = orderData?.customerId === userId;
    let isRestaurantOwner = false;

    if (!isCustomer) {
      // Check if user is the restaurant owner
      const restaurantSnapshot = await adminDb
        .collection('restaurants')
        .where('owner_id', '==', userId)
        .limit(1)
        .get();

      if (!restaurantSnapshot.empty) {
        const restaurantId = restaurantSnapshot.docs[0].id;
        isRestaurantOwner = orderData?.restaurant_id === restaurantId;
      }
    }

    if (!isCustomer && !isRestaurantOwner) {
      return NextResponse.json(
        { error: 'Unauthorized to refund this order' },
        { status: 403 }
      );
    }

    // Check if order can be refunded
    if (orderData?.paymentStatus !== 'paid' && orderData?.paymentStatus !== 'completed') {
      return NextResponse.json(
        { error: 'Order payment is not in a refundable state' },
        { status: 400 }
      );
    }

    if (!orderData?.paymentIntentId) {
      return NextResponse.json(
        { error: 'No payment intent found for this order' },
        { status: 400 }
      );
    }

    // Check if order is already refunded (check status field instead)
    if (orderData?.status === 'refunded') {
      return NextResponse.json(
        { error: 'Order is already refunded' },
        { status: 400 }
      );
    }

    // Determine refund amount
    const refundAmount = amount || orderData.total;
    
    if (refundAmount > orderData.total) {
      return NextResponse.json(
        { error: 'Refund amount cannot exceed original payment amount' },
        { status: 400 }
      );
    }

    // Create refund in Stripe
    const refund = await stripe.refunds.create({
      payment_intent: orderData.paymentIntentId,
      amount: refundAmount,
      reason: reason as any,
      metadata: {
        orderId,
        refundedBy: userId,
        refundType: isCustomer ? 'customer' : 'restaurant',
      },
    });

    // Update order status
    const isPartialRefund = refundAmount < orderData.total;
    const newPaymentStatus = isPartialRefund ? 'partially_refunded' : 'refunded';
    const newOrderStatus = isPartialRefund ? orderData.status : 'cancelled';

    await adminDb.collection('orders').doc(orderId).update({
      paymentStatus: newPaymentStatus,
      status: newOrderStatus,
      refund_id: refund.id,
      refund_amount: refundAmount,
      refund_reason: reason,
      refunded_at: new Date(),
      refunded_by: userId,
      updated_at: new Date(),
    });

    // Create notifications
    const refundAmountBRL = (refundAmount / 100).toFixed(2);
    
    // Notify customer if refund was initiated by restaurant
    if (isRestaurantOwner) {
      await adminDb.collection('notifications').add({
        type: 'refund_processed',
        user_id: orderData.customerId,
        order_id: orderId,
        title: 'Reembolso Processado',
        message: `Seu pedido #${orderId} foi reembolsado. Valor: R$ ${refundAmountBRL}`,
        read: false,
        created_at: new Date(),
      });
    }

    // Notify restaurant if refund was initiated by customer
    if (isCustomer) {
      await adminDb.collection('notifications').add({
        type: 'refund_requested',
        restaurant_id: orderData.restaurant_id,
        order_id: orderId,
        title: 'Reembolso Solicitado',
        message: `Cliente solicitou reembolso do pedido #${orderId}. Valor: R$ ${refundAmountBRL}`,
        read: false,
        created_at: new Date(),
      });
    }

    return NextResponse.json({
      success: true,
      refund: {
        id: refund.id,
        amount: refundAmount,
        status: refund.status,
        reason: refund.reason,
      },
      order: {
        id: orderId,
        status: newOrderStatus,
        paymentStatus: newPaymentStatus,
      },
      message: `Refund of R$ ${refundAmountBRL} processed successfully`,
    });

  } catch (error) {
    console.error('Error processing refund:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to process refund',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
