import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/config';
import { adminDb } from '@/lib/firebase/admin';
import { verifySessionCookie } from '@/lib/firebase/admin';

interface ConfirmPaymentRequest {
  paymentIntentId: string;
  orderId: string;
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

    const body: ConfirmPaymentRequest = await request.json();
    const { paymentIntentId, orderId } = body;

    // Validate required fields
    if (!paymentIntentId || !orderId) {
      return NextResponse.json(
        { error: 'Missing required fields: paymentIntentId, orderId' },
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

    // Verify payment intent belongs to this order
    if (orderData?.payment_intent_id !== paymentIntentId) {
      return NextResponse.json(
        { error: 'Payment intent does not match order' },
        { status: 400 }
      );
    }

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    // Check payment status
    if (paymentIntent.status === 'succeeded') {
      // Update order status to confirmed and paid
      await adminDb.collection('orders').doc(orderId).update({
        status: 'confirmed',
        payment_status: 'paid',
        payment_confirmed_at: new Date(),
        updated_at: new Date(),
      });

      // Create notification for restaurant
      await adminDb.collection('notifications').add({
        type: 'new_order',
        restaurant_id: orderData.restaurant_id,
        order_id: orderId,
        title: 'Novo Pedido Recebido',
        message: `Pedido #${orderId} foi confirmado e pago. Valor: R$ ${(orderData.payment_amount / 100).toFixed(2)}`,
        read: false,
        created_at: new Date(),
      });

      return NextResponse.json({
        success: true,
        status: paymentIntent.status,
        message: 'Payment confirmed successfully',
        order: {
          id: orderId,
          status: 'confirmed',
          paymentStatus: 'paid',
        },
      });
    } else if (paymentIntent.status === 'requires_payment_method') {
      // Payment failed, update order status
      await adminDb.collection('orders').doc(orderId).update({
        payment_status: 'failed',
        updated_at: new Date(),
      });

      return NextResponse.json({
        success: false,
        status: paymentIntent.status,
        message: 'Payment failed. Please try again with a different payment method.',
      });
    } else {
      // Payment is still processing
      return NextResponse.json({
        success: false,
        status: paymentIntent.status,
        message: 'Payment is still processing. Please wait.',
      });
    }

  } catch (error) {
    console.error('Error confirming payment:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to confirm payment',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}