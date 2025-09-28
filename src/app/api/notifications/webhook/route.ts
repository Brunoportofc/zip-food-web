// src/app/api/notifications/webhook/route.ts
// Webhook para receber eventos e criar notificações automaticamente

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function POST(request: NextRequest) {
  try {
    const {
      event,
      restaurantId,
      orderId,
      data
    } = await request.json();

    if (!event || !restaurantId) {
      return NextResponse.json(
        { error: 'Evento e restaurantId são obrigatórios' },
        { status: 400 }
      );
    }

    console.log('🔔 [Webhook] Evento recebido:', { event, restaurantId, orderId });

    let notification = null;

    switch (event) {
      case 'order.created':
        notification = {
          title: '🛒 Novo Pedido Recebido',
          message: `Pedido #${orderId} - ${data.items?.map((item: any) => `${item.quantity}x ${item.name}`).join(', ')} para ${data.customerName} (R$ ${data.total?.toFixed(2)})`,
          type: 'order',
          priority: 'high',
          orderId,
          action: {
            label: 'Ver Pedido',
            url: `/restaurant/pedidos?id=${orderId}`
          },
          metadata: {
            customerName: data.customerName,
            customerPhone: data.customerPhone,
            total: data.total,
            itemCount: data.items?.length || 0
          }
        };
        break;

      case 'order.status_changed':
        const statusMessages = {
          'pending': { text: 'aguardando confirmação', emoji: '⏳', type: 'warning' },
          'confirmed': { text: 'confirmado pelo restaurante', emoji: '✅', type: 'success' },
          'preparing': { text: 'sendo preparado na cozinha', emoji: '👨‍🍳', type: 'info' },
          'ready': { text: 'pronto para entrega', emoji: '📦', type: 'success' },
          'delivering': { text: 'saiu para entrega', emoji: '🚚', type: 'info' },
          'delivered': { text: 'entregue com sucesso', emoji: '🎉', type: 'success' },
          'cancelled': { text: 'cancelado', emoji: '❌', type: 'error' }
        };

        const statusInfo = statusMessages[data.status as keyof typeof statusMessages] || 
          { text: data.status, emoji: '📋', type: 'info' };

        notification = {
          title: `${statusInfo.emoji} Status Atualizado`,
          message: `Pedido #${orderId}${data.customerName ? ` (${data.customerName})` : ''} está ${statusInfo.text}`,
          type: statusInfo.type,
          priority: data.status === 'cancelled' ? 'high' : 'normal',
          orderId,
          action: {
            label: 'Ver Detalhes',
            url: `/restaurant/pedidos?id=${orderId}`
          },
          metadata: {
            previousStatus: data.previousStatus,
            newStatus: data.status,
            customerName: data.customerName
          }
        };
        break;

      case 'payment.received':
        notification = {
          title: '💰 Pagamento Confirmado',
          message: `Pedido #${orderId} - Pagamento de R$ ${data.amount?.toFixed(2)} via ${data.method} foi confirmado`,
          type: 'success',
          priority: 'normal',
          orderId,
          metadata: {
            amount: data.amount,
            paymentMethod: data.method,
            transactionId: data.transactionId
          }
        };
        break;

      case 'rating.received':
        const ratingEmojis = {
          5: '⭐⭐⭐⭐⭐',
          4: '⭐⭐⭐⭐',
          3: '⭐⭐⭐',
          2: '⭐⭐',
          1: '⭐'
        };

        notification = {
          title: `${ratingEmojis[data.rating as keyof typeof ratingEmojis]} Nova Avaliação`,
          message: `${data.customerName} avaliou o pedido #${orderId} com ${data.rating} estrelas${data.comment ? `: "${data.comment}"` : ''}`,
          type: data.rating >= 4 ? 'success' : data.rating >= 3 ? 'info' : 'warning',
          priority: data.rating <= 2 ? 'high' : 'normal',
          orderId,
          metadata: {
            rating: data.rating,
            comment: data.comment,
            customerName: data.customerName
          }
        };
        break;

      case 'delivery.update':
        const deliveryMessages = {
          'assigned': `🚚 Entregador designado: ${data.driverName}`,
          'picked_up': `📦 ${data.driverName} coletou o pedido`,
          'on_way': `🛣️ ${data.driverName} está a caminho do cliente`,
          'delivered': `✅ ${data.driverName} entregou o pedido`
        };

        notification = {
          title: 'Atualização de Entrega',
          message: `Pedido #${orderId} - ${deliveryMessages[data.status as keyof typeof deliveryMessages]}`,
          type: 'info',
          priority: 'normal',
          orderId,
          metadata: {
            driverName: data.driverName,
            driverPhone: data.driverPhone,
            deliveryStatus: data.status,
            estimatedArrival: data.estimatedArrival,
            location: data.location
          }
        };
        break;

      case 'stock.low':
        notification = {
          title: '⚠️ Estoque Baixo',
          message: `${data.itemName} está com apenas ${data.quantity} unidades restantes`,
          type: 'warning',
          priority: data.quantity <= 1 ? 'high' : 'normal',
          metadata: {
            itemName: data.itemName,
            quantity: data.quantity,
            minimumStock: data.minimumStock
          }
        };
        break;

      case 'menu.item_updated':
        const actions = {
          'added': { text: 'adicionado ao', emoji: '➕' },
          'updated': { text: 'atualizado no', emoji: '✏️' },
          'removed': { text: 'removido do', emoji: '🗑️' }
        };
        
        const actionInfo = actions[data.action as keyof typeof actions];
        
        notification = {
          title: `${actionInfo.emoji} Menu Atualizado`,
          message: `${data.itemName} foi ${actionInfo.text} cardápio`,
          type: data.action === 'removed' ? 'warning' : 'info',
          priority: 'normal',
          metadata: {
            itemName: data.itemName,
            action: data.action,
            category: data.category
          }
        };
        break;

      default:
        return NextResponse.json(
          { error: `Evento não suportado: ${event}` },
          { status: 400 }
        );
    }

    if (notification) {
      // Salvar notificação no Firestore
      const notificationData = {
        ...notification,
        timestamp: new Date(),
        read: false,
        restaurantId
      };

      await adminDb.collection('notifications').add(notificationData);

      console.log('✅ [Webhook] Notificação criada:', { event, orderId, title: notification.title });

      return NextResponse.json({
        success: true,
        message: 'Notificação criada com sucesso',
        data: {
          event,
          orderId,
          notificationTitle: notification.title
        }
      });
    }

    return NextResponse.json(
      { error: 'Nenhuma notificação foi criada' },
      { status: 400 }
    );

  } catch (error) {
    console.error('❌ [Webhook] Erro ao processar evento:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
