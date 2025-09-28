import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse, serverErrorResponse } from '@/lib/api/response';

interface UpdateStatusRequest {
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'cancelled';
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const orderId = resolvedParams.id;
    
    // Obter informações do usuário do middleware
    const userId = request.headers.get('x-user-id');
    const userType = request.headers.get('x-user-type');

    if (!userId) {
      return unauthorizedResponse('Usuário não autenticado');
    }

    if (userType !== 'restaurant' && userType !== 'delivery') {
      return unauthorizedResponse('Apenas restaurantes e entregadores podem atualizar status de pedidos');
    }

    const body: UpdateStatusRequest = await request.json();

    if (!body.status) {
      return errorResponse('Status é obrigatório');
    }

    try {
      // Verificar se o pedido existe
      const orderRef = adminDb.collection('orders').doc(orderId);
      const orderDoc = await orderRef.get();

      if (!orderDoc.exists) {
        return notFoundResponse('Pedido não encontrado');
      }

      const orderData = orderDoc.data();

      // Verificar permissões
      if (userType === 'restaurant') {
        // Para restaurantes, verificar se o pedido é do seu restaurante
        const restaurantQuery = await adminDb.collection('restaurants')
          .where('owner_id', '==', userId)
          .get();
        
        if (restaurantQuery.empty) {
          return unauthorizedResponse('Restaurante não encontrado');
        }

        const restaurantId = restaurantQuery.docs[0].id;
        if (orderData?.restaurant_id !== restaurantId) {
          return unauthorizedResponse('Acesso negado a este pedido');
        }

        // Restaurantes só podem atualizar para certos status
        const allowedStatuses = ['confirmed', 'preparing', 'ready', 'cancelled'];
        if (!allowedStatuses.includes(body.status)) {
          return errorResponse('Status não permitido para restaurantes');
        }
      }

      if (userType === 'delivery') {
        // Para entregadores, verificar se o pedido está atribuído a eles
        if (orderData?.delivery_driver_id !== userId) {
          return unauthorizedResponse('Acesso negado a este pedido');
        }

        // Entregadores só podem atualizar para certos status
        const allowedStatuses = ['out_for_delivery', 'delivered'];
        if (!allowedStatuses.includes(body.status)) {
          return errorResponse('Status não permitido para entregadores');
        }
      }

      // Atualizar status
      await orderRef.update({
        status: body.status,
        updated_at: new Date()
      });

      // Buscar dados atualizados
      const updatedDoc = await orderRef.get();
      const updatedOrder = { id: updatedDoc.id, ...updatedDoc.data() };

      // Criar notificação de mudança de status
      try {
        const statusMessages = {
          'pending': { text: 'aguardando confirmação', emoji: '⏳', type: 'warning' },
          'confirmed': { text: 'confirmado pelo restaurante', emoji: '✅', type: 'success' },
          'preparing': { text: 'sendo preparado na cozinha', emoji: '👨‍🍳', type: 'info' },
          'ready': { text: 'pronto para entrega', emoji: '📦', type: 'success' },
          'out_for_delivery': { text: 'saiu para entrega', emoji: '🚚', type: 'info' },
          'delivered': { text: 'entregue com sucesso', emoji: '🎉', type: 'success' },
          'cancelled': { text: 'cancelado', emoji: '❌', type: 'error' }
        };

        const statusInfo = statusMessages[body.status as keyof typeof statusMessages] || 
          { text: body.status, emoji: '📋', type: 'info' };

        await adminDb.collection('notifications').add({
          title: `${statusInfo.emoji} Status Atualizado`,
          message: `Pedido #${orderId} está ${statusInfo.text}`,
          type: statusInfo.type,
          priority: body.status === 'cancelled' ? 'high' : 'normal',
          timestamp: new Date(),
          read: false,
          restaurantId: orderData?.restaurant_id,
          orderId,
          action: {
            label: 'Ver Detalhes',
            url: `/restaurant/pedidos?id=${orderId}`
          },
          metadata: {
            previousStatus: orderData?.status,
            newStatus: body.status,
            updatedBy: userType
          }
        });
        
        console.log('✅ [Orders Status API] Notificação de status criada:', { orderId, status: body.status });
      } catch (notificationError) {
        console.error('❌ [Orders Status API] Erro ao criar notificação:', notificationError);
        // Não falhar a atualização se a notificação falhar
      }

      return successResponse(updatedOrder, 'Status do pedido atualizado com sucesso');
    } catch (firestoreError) {
      console.error('Erro ao atualizar status no Firestore:', firestoreError);
      return serverErrorResponse('Erro ao atualizar status do pedido');
    }
  } catch (error) {
    console.error('Erro interno ao atualizar status:', error);
    return serverErrorResponse('Erro interno do servidor');
  }
}
