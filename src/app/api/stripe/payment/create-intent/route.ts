import { NextRequest, NextResponse } from 'next/server';
import { stripeConfig, calculatePlatformFee, calculateRestaurantAmount } from '@/lib/stripe/config';
import { restaurantStripeService } from '@/lib/stripe/restaurant-stripe';
import { adminDb } from '@/lib/firebase/admin';
import { verifySessionCookie } from '@/lib/firebase/admin';

interface CreatePaymentIntentRequest {
  orderId?: string;
  amount: number; // Amount in agurot (ILS)
  restaurantId: string;
  description?: string;
  orderData?: any; // Dados completos do pedido para criação se não existir
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

    const decodedToken = await verifySessionCookie();
    const customerId = decodedToken.uid;

    const body: CreatePaymentIntentRequest = await request.json();
    const { orderId, amount, restaurantId, description, orderData, paymentMethodTypes = ['card'] } = body;

    // Validate required fields
    if (!amount || !restaurantId) {
      return NextResponse.json(
        { error: 'Missing required fields: amount, restaurantId' },
        { status: 400 }
      );
    }

    // Validate amount (minimum ₪5.00 = 500 agurot)
    if (amount < 500) {
      return NextResponse.json(
        { error: 'Amount must be at least ₪5.00' },
        { status: 400 }
      );
    }

    // Se orderId for fornecido, verificar se o pedido existe
    let finalOrderId = orderId;
    
    if (orderId) {
      const orderDoc = await adminDb.collection('orders').doc(orderId).get();
      
      if (!orderDoc.exists) {
        return NextResponse.json(
          { error: 'Order not found' },
          { status: 404 }
        );
      }

      const existingOrderData = orderDoc.data();
      
      if (existingOrderData?.customerId !== customerId) {
        return NextResponse.json(
          { error: 'Unauthorized access to order' },
          { status: 403 }
        );
      }

      // Check if order already has a payment intent
      if (existingOrderData?.paymentIntentId) {
        return NextResponse.json(
          { error: 'Payment intent already exists for this order' },
          { status: 400 }
        );
      }
    } else if (orderData) {
      // Criar pedido se orderData for fornecido
      try {
        const newOrderData = {
          customer_id: customerId,
          restaurant_id: restaurantId,
          status: 'pending_payment',
          subtotal: orderData.subtotal || amount / 100,
          delivery_fee: orderData.deliveryFee || 0,
          total: amount / 100,
          delivery_address: orderData.deliveryAddress,
          payment_method: 'credit-card',
          notes: orderData.notes || '',
          created_at: new Date(),
          updated_at: new Date()
        };

        const orderRef = await adminDb.collection('orders').add(newOrderData);
        finalOrderId = orderRef.id;

        // Adicionar itens do pedido
        if (orderData.items) {
          const orderItems = orderData.items.map((item: any) => ({
            order_id: finalOrderId,
            product_id: item.id,
            product_name: item.name,
            quantity: item.quantity,
            unit_price: item.price,
            total_price: item.price * item.quantity,
            notes: item.notes || ''
          }));

          const itemPromises = orderItems.map((item: any) => 
            adminDb.collection('order_items').add(item)
          );

          await Promise.all(itemPromises);
        }

        console.log('✅ [Stripe Payment] Pedido criado:', finalOrderId);
      } catch (error) {
        console.error('❌ [Stripe Payment] Erro ao criar pedido:', error);
        return NextResponse.json(
          { error: 'Error creating order' },
          { status: 500 }
        );
      }
    } else {
      return NextResponse.json(
        { error: 'Either orderId or orderData must be provided' },
        { status: 400 }
      );
    }

    // Verify restaurant exists and is active
    const restaurantDoc = await adminDb.collection('restaurants').doc(restaurantId).get();
    
    if (!restaurantDoc.exists) {
      return NextResponse.json(
        { error: 'Restaurant not found' },
        { status: 404 }
      );
    }

    const restaurantData = restaurantDoc.data();
    
    if (!restaurantData?.is_active) {
      return NextResponse.json(
        { error: 'Restaurant is not active' },
        { status: 400 }
      );
    }

    // Verify restaurant has Stripe keys configured
    const canReceivePayments = await restaurantStripeService.canReceivePayments(restaurantId);
    
    if (!canReceivePayments) {
      return NextResponse.json(
        { error: 'Restaurant has not configured Stripe payments yet' },
        { status: 400 }
      );
    }

    // Get restaurant's Stripe instance
    const restaurantStripe = await restaurantStripeService.createStripeInstance(restaurantId);
    
    if (!restaurantStripe) {
      return NextResponse.json(
        { error: 'Failed to connect to restaurant Stripe account' },
        { status: 500 }
      );
    }

    // Calculate platform fee and restaurant amount
    const platformFee = calculatePlatformFee(amount);
    const restaurantAmount = calculateRestaurantAmount(amount);

    // Create Payment Intent (goes directly to restaurant's Stripe account)
    // Note: Platform fee will be collected separately via invoice/transfer
    const paymentIntent = await restaurantStripe.paymentIntents.create({
      amount,
      currency: stripeConfig.currency,
      payment_method_types: paymentMethodTypes,
      metadata: {
        orderId: finalOrderId || 'unknown',
        customerId,
        restaurantId,
        platformFee: platformFee.toString(),
        restaurantAmount: restaurantAmount.toString(),
        platformId: process.env.NEXT_PUBLIC_APP_URL || 'zipfood',
      },
      description: description || `Pedido #${finalOrderId} - ZipFood`,
      receipt_email: (decodedToken as any).email || undefined,
    });

    // Update order with payment intent information
    await adminDb.collection('orders').doc(finalOrderId).update({
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
