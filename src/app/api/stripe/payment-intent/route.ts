import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/next-auth';
import { authOptions } from '@/lib/auth';
import { stripe } from '@/lib/stripe';
import { adminDb } from '@/lib/firebase-admin';
// Mock functions for Stripe
const createPaymentIntent = async (options: any) => {
  return {
    id: 'pi_mock_' + Date.now(),
    client_secret: 'pi_mock_secret_' + Date.now(),
    amount: options.amount,
    currency: options.currency,
    status: 'requires_payment_method'
  };
};

const StripeErrorHandler = {
  handle: (error: any) => ({ message: 'Mock error handled' }),
  logError: (context: string, error: any, data: any) => console.error('Mock error:', context, error),
  createErrorResponse: (error: any) => ({ success: false, message: 'Mock error response' }),
  handleError: (error: any) => ({ statusCode: 500, message: 'Mock error' })
};

const PaymentTracker = {
  track: (data: any) => Promise.resolve(),
  monitorPayment: (orderId: string, paymentIntentId: string) => Promise.resolve(),
  logPaymentEvent: (orderId: string, event: string, status: string, data: any) => Promise.resolve()
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      orderId, 
      amount, 
      currency = 'brl', 
      restaurantId,
      customerId,
      paymentMethod = 'card',
      applicationFeeAmount,
      metadata = {}
    } = body;

    // Validate required fields
    if (!orderId || !amount || !restaurantId) {
      return NextResponse.json(
        { success: false, message: 'Campos obrigatórios: orderId, amount, restaurantId' },
        { status: 400 }
      );
    }

    // Get restaurant data to check Stripe account
    const restaurantDoc = await adminDb.collection('restaurants').doc(restaurantId).get();
    if (!restaurantDoc.exists) {
      return NextResponse.json(
        { success: false, message: 'Restaurante não encontrado' },
        { status: 404 }
      );
    }

    const restaurantData = restaurantDoc.data();
    const stripeAccountId = restaurantData?.stripeAccountId;

    if (!stripeAccountId) {
      return NextResponse.json(
        { success: false, message: 'Restaurante não possui conta Stripe configurada' },
        { status: 400 }
      );
    }

    // Get order data
    const orderDoc = await adminDb.collection('orders').doc(orderId).get();
    if (!orderDoc.exists) {
      return NextResponse.json(
        { success: false, message: 'Pedido não encontrado' },
        { status: 404 }
      );
    }

    const orderData = orderDoc.data();

    // Calculate application fee (platform fee) - 5% of the order total
    const calculatedApplicationFee = applicationFeeAmount || Math.round(amount * 0.05);

    // Create payment intent with Connect
    const paymentIntent = await createPaymentIntent({
      amount,
      currency,
      stripeAccountId,
      applicationFeeAmount: calculatedApplicationFee,
      metadata: {
        orderId,
        restaurantId,
        customerId,
        ...metadata
      }
    });

    // Update order with payment intent ID
    await adminDb.collection('orders').doc(orderId).update({
      paymentIntentId: paymentIntent.id,
      paymentStatus: 'pending',
      applicationFeeAmount: calculatedApplicationFee,
      updatedAt: new Date().toISOString()
    });

    // Log payment attempt
    await adminDb.collection('paymentLogs').add({
      orderId,
      restaurantId,
      customerId,
      paymentIntentId: paymentIntent.id,
      amount,
      currency,
      applicationFeeAmount: calculatedApplicationFee,
      status: 'created',
      createdAt: new Date().toISOString()
    });

    // Start payment monitoring
    PaymentTracker.monitorPayment(orderId, paymentIntent.id);

    // Log payment creation
    await PaymentTracker.logPaymentEvent(orderId, 'payment_intent_created', 'pending', {
      paymentIntentId: paymentIntent.id,
      amount,
      restaurantId,
    });

    return NextResponse.json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        applicationFeeAmount: calculatedApplicationFee
      }
    });

  } catch (error: any) {
    StripeErrorHandler.logError('PaymentIntent.POST', error, { orderId: 'unknown', amount: 0 });
    return NextResponse.json(
      StripeErrorHandler.createErrorResponse(error),
      { status: StripeErrorHandler.handleError(error).statusCode }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentIntentId = searchParams.get('paymentIntentId');

    if (!paymentIntentId) {
      return NextResponse.json(
        { success: false, message: 'paymentIntentId é obrigatório' },
        { status: 400 }
      );
    }

    // Get payment intent status from database
    const paymentLogsQuery = await adminDb
      .collection('paymentLogs')
      .where('paymentIntentId', '==', paymentIntentId)
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();

    if (paymentLogsQuery.empty) {
      return NextResponse.json(
        { success: false, message: 'Payment intent não encontrado' },
        { status: 404 }
      );
    }

    const paymentLog = paymentLogsQuery.docs[0].data();

    return NextResponse.json({
      success: true,
      data: {
        paymentIntentId,
        status: paymentLog.status,
        orderId: paymentLog.orderId,
        amount: paymentLog.amount,
        currency: paymentLog.currency,
        createdAt: paymentLog.createdAt,
        updatedAt: paymentLog.updatedAt
      }
    });

  } catch (error) {
    console.error('Error getting payment intent:', error);
    return NextResponse.json(
      { success: false, message: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
