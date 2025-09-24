import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import jwt from 'jsonwebtoken';

// Função para verificar token JWT
function verifyToken(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value || 
                request.headers.get('authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return null;
  }

  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
  } catch {
    return null;
  }
}

// PATCH - Atualizar status do pedido
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const { status, deliveryDriverId, estimatedDeliveryTime } = await request.json();
    const resolvedParams = await params;
    const orderId = resolvedParams.id;

    // Validar status
    const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Status inválido' },
        { status: 400 }
      );
    }

    try {
      // Buscar pedido atual
      const orderRef = adminDb.collection('orders').doc(orderId);
      const orderDoc = await orderRef.get();

      if (!orderDoc.exists) {
        return NextResponse.json(
          { error: 'Pedido não encontrado' },
          { status: 404 }
        );
      }

      const currentOrder = { id: orderDoc.id, ...orderDoc.data() } as any;

      // Buscar dados do restaurante
      const restaurantRef = adminDb.collection('restaurants').doc(currentOrder.restaurant_id);
      const restaurantDoc = await restaurantRef.get();
      const restaurant = restaurantDoc.exists ? restaurantDoc.data() : null;

      // Buscar dados do cliente
      const customerRef = adminDb.collection('users').doc(currentOrder.customer_id);
      const customerDoc = await customerRef.get();
      const customer = customerDoc.exists ? customerDoc.data() : null;

      // Verificar permissões
      let canUpdate = false;
      
      if (user.userType === 'restaurant') {
        // Restaurante pode atualizar seus próprios pedidos
        canUpdate = restaurant?.user_id === user.userId;
      } else if (user.userType === 'delivery') {
        // Entregador pode atualizar pedidos atribuídos a ele
        const driverSnapshot = await adminDb.collection('delivery_drivers')
          .where('user_id', '==', user.userId)
          .limit(1)
          .get();
        
        const driver = driverSnapshot.docs[0]?.data();
        
        canUpdate = Boolean(driver && (
          currentOrder.delivery_driver_id === driverSnapshot.docs[0]?.id ||
          (status === 'out_for_delivery' && deliveryDriverId === driverSnapshot.docs[0]?.id)
        ));
      }

      if (!canUpdate) {
        return NextResponse.json(
          { error: 'Sem permissão para atualizar este pedido' },
          { status: 403 }
        );
      }

    // Preparar dados para atualização
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    };

    // Se estiver saindo para entrega, definir entregador e tempo estimado
    if (status === 'out_for_delivery') {
      if (deliveryDriverId) {
        updateData.delivery_driver_id = deliveryDriverId;
      }
      if (estimatedDeliveryTime) {
        updateData.estimated_delivery_time = estimatedDeliveryTime;
      }
    }

    // Se foi entregue, definir timestamp
    if (status === 'delivered') {
      updateData.delivered_at = new Date().toISOString();
    }

      // Atualizar pedido
      await orderRef.update(updateData);
      
      // Buscar pedido atualizado
      const updatedOrderDoc = await orderRef.get();
      const updatedOrder = { id: updatedOrderDoc.id, ...updatedOrderDoc.data() };

    // Criar notificações baseadas no status
    const notifications = [];
    
    switch (status) {
      case 'confirmed':
        notifications.push({
          user_id: currentOrder.customer_id,
          title: 'Pedido Confirmado',
          message: `Seu pedido #${orderId} foi confirmado pelo restaurante`,
          type: 'order_update',
          data: JSON.stringify({ orderId, status })
        });
        break;
        
      case 'preparing':
        notifications.push({
          user_id: currentOrder.customer_id,
          title: 'Preparando Pedido',
          message: `Seu pedido #${orderId} está sendo preparado`,
          type: 'order_update',
          data: JSON.stringify({ orderId, status })
        });
        break;
        
      case 'ready':
        notifications.push({
          user_id: currentOrder.customer_id,
          title: 'Pedido Pronto',
          message: `Seu pedido #${orderId} está pronto para entrega`,
          type: 'order_update',
          data: JSON.stringify({ orderId, status })
        });
        break;
        
      case 'out_for_delivery':
        notifications.push({
          user_id: currentOrder.customer_id,
          title: 'Saiu para Entrega',
          message: `Seu pedido #${orderId} saiu para entrega`,
          type: 'order_update',
          data: JSON.stringify({ orderId, status, estimatedDeliveryTime })
        });
        break;
        
      case 'delivered':
        notifications.push({
          user_id: currentOrder.customer_id,
          title: 'Pedido Entregue',
          message: `Seu pedido #${orderId} foi entregue com sucesso`,
          type: 'order_update',
          data: JSON.stringify({ orderId, status })
        });
        break;
        
      case 'cancelled':
        notifications.push({
          user_id: currentOrder.customer_id,
          title: 'Pedido Cancelado',
          message: `Seu pedido #${orderId} foi cancelado`,
          type: 'order_update',
          data: JSON.stringify({ orderId, status })
        });
        break;
    }

      // Inserir notificações
      if (notifications.length > 0) {
        const batch = adminDb.batch();
        notifications.forEach(notification => {
          const notificationRef = adminDb.collection('notifications').doc();
          batch.set(notificationRef, {
            ...notification,
            created_at: new Date().toISOString(),
            is_read: false
          });
        });
        await batch.commit();
      }

      return NextResponse.json({
        message: 'Status do pedido atualizado com sucesso',
        order: updatedOrder
      });

    } catch (firestoreError) {
      console.error('Erro ao atualizar status do pedido no Firestore:', firestoreError);
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Erro ao atualizar status do pedido:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}