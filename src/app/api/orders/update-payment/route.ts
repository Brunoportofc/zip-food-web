import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, paymentIntentId, status } = body;

    // Validate required fields
    if (!orderId || !paymentIntentId || !status) {
      return NextResponse.json(
        { success: false, message: 'Campos obrigatórios: orderId, paymentIntentId, status' },
        { status: 400 }
      );
    }

    // Check if order exists
    const orderDoc = await adminDb.collection('orders').doc(orderId).get();
    if (!orderDoc.exists) {
      return NextResponse.json(
        { success: false, message: 'Pedido não encontrado' },
        { status: 404 }
      );
    }

    const orderData = orderDoc.data();

    // Update order with payment information
    const updateData: any = {
      paymentIntentId,
      paymentStatus: status,
      status: status === 'paid' ? 'confirmed' : 'payment_failed',
      updatedAt: new Date().toISOString()
    };

    // If payment is successful, also set confirmed timestamp
    if (status === 'paid') {
      updateData.confirmedAt = new Date().toISOString();
    }

    await adminDb.collection('orders').doc(orderId).update(updateData);

    // Update payment log
    const paymentLogsQuery = await adminDb
      .collection('paymentLogs')
      .where('paymentIntentId', '==', paymentIntentId)
      .limit(1)
      .get();

    if (!paymentLogsQuery.empty) {
      const paymentLogDoc = paymentLogsQuery.docs[0];
      await paymentLogDoc.ref.update({
        status: status === 'paid' ? 'succeeded' : 'failed',
        updatedAt: new Date().toISOString()
      });
    }

    // Create notification for restaurant
    if (status === 'paid') {
      await adminDb.collection('notifications').add({
        type: 'new_order',
        title: 'Novo Pedido Confirmado',
        message: `Pedido #${orderId.slice(-6)} foi confirmado e pago`,
        recipientId: orderData?.restaurantId,
        recipientType: 'restaurant',
        orderId,
        read: false,
        createdAt: new Date().toISOString()
      });

      // Create notification for customer
      await adminDb.collection('notifications').add({
        type: 'order_confirmed',
        title: 'Pedido Confirmado',
        message: `Seu pedido foi confirmado e está sendo preparado`,
        recipientId: orderData?.customerId,
        recipientType: 'customer',
        orderId,
        read: false,
        createdAt: new Date().toISOString()
      });
    }

    return NextResponse.json({
      success: true,
      message: status === 'paid' ? 'Pedido confirmado com sucesso' : 'Status do pagamento atualizado',
      data: {
        orderId,
        paymentIntentId,
        status: updateData.status
      }
    });

  } catch (error) {
    console.error('Error updating order payment:', error);
    return NextResponse.json(
      { success: false, message: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
