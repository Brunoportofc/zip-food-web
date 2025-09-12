import { NextRequest, NextResponse } from 'next/server';
import { sendNotification } from '../subscribe/route';
import { OrderStatus } from '@/services/order.service';

interface NotificationRequest {
  userId: string;
  type: 'order_update' | 'delivery_assignment' | 'delivery_confirmation' | 'promotion' | 'system';
  orderId?: string;
  title: string;
  message: string;
  data?: any;
  priority?: 'low' | 'normal' | 'high';
}

export async function POST(request: NextRequest) {
  try {
    const notificationData: NotificationRequest = await request.json();

    // Validar dados obrigatórios
    if (!notificationData.userId || !notificationData.type || !notificationData.title || !notificationData.message) {
      return NextResponse.json(
        { error: 'userId, type, title e message são obrigatórios' },
        { status: 400 }
      );
    }

    // Preparar payload da notificação
    const payload = {
      title: notificationData.title,
      body: notificationData.message,
      icon: getIconForType(notificationData.type),
      badge: '/icons/badge-icon.png',
      tag: notificationData.orderId || notificationData.type,
      data: {
        type: notificationData.type,
        orderId: notificationData.orderId,
        timestamp: Date.now(),
        priority: notificationData.priority || 'normal',
        ...notificationData.data
      },
      actions: getActionsForType(notificationData.type)
    };

    // Enviar notificação
    await sendNotification(notificationData.userId, payload);

    return NextResponse.json(
      { 
        success: true, 
        message: 'Notificação enviada com sucesso'
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Erro ao enviar notificação:', error);
    
    if (error.message?.includes('Subscription não encontrada')) {
      return NextResponse.json(
        { error: 'Usuário não está inscrito para notificações' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// Endpoint específico para notificações de pedidos
export async function sendOrderNotification(
  userId: string,
  orderId: string,
  status: OrderStatus,
  restaurantName?: string,
  estimatedTime?: number
) {
  const { title, message, priority } = getOrderNotificationContent(status, orderId, restaurantName, estimatedTime);
  
  const payload = {
    title,
    body: message,
    icon: '/icons/order-icon.png',
    badge: '/icons/badge-icon.png',
    tag: orderId,
    data: {
      type: 'order_update',
      orderId,
      status,
      timestamp: Date.now(),
      priority
    },
    actions: getOrderActions(status)
  };

  try {
    await sendNotification(userId, payload);
    return { success: true };
  } catch (error) {
    console.error('Erro ao enviar notificação de pedido:', error);
    return { success: false, error: error.message };
  }
}

// Endpoint para notificações de entregadores
export async function sendDeliveryNotification(
  driverId: string,
  orderId: string,
  type: 'new_delivery' | 'delivery_update' | 'payment_received',
  data?: any
) {
  const { title, message } = getDeliveryNotificationContent(type, orderId, data);
  
  const payload = {
    title,
    body: message,
    icon: '/icons/delivery-icon.png',
    badge: '/icons/badge-icon.png',
    tag: `delivery-${orderId}`,
    data: {
      type: 'delivery_assignment',
      orderId,
      deliveryType: type,
      timestamp: Date.now(),
      priority: 'high',
      ...data
    },
    actions: getDeliveryActions(type)
  };

  try {
    await sendNotification(driverId, payload);
    return { success: true };
  } catch (error) {
    console.error('Erro ao enviar notificação de entrega:', error);
    return { success: false, error: error.message };
  }
}

// Funções auxiliares
function getIconForType(type: string): string {
  switch (type) {
    case 'order_update':
      return '/icons/order-icon.png';
    case 'delivery_assignment':
    case 'delivery_confirmation':
      return '/icons/delivery-icon.png';
    case 'promotion':
      return '/icons/promotion-icon.png';
    case 'system':
      return '/icons/system-icon.png';
    default:
      return '/icons/notification-icon.png';
  }
}

function getActionsForType(type: string): Array<{ action: string; title: string; icon?: string }> {
  switch (type) {
    case 'order_update':
      return [
        { action: 'view', title: 'Ver Pedido', icon: '/icons/view-icon.png' },
        { action: 'dismiss', title: 'Dispensar', icon: '/icons/dismiss-icon.png' }
      ];
    case 'delivery_assignment':
      return [
        { action: 'accept', title: 'Aceitar', icon: '/icons/accept-icon.png' },
        { action: 'decline', title: 'Recusar', icon: '/icons/decline-icon.png' }
      ];
    case 'promotion':
      return [
        { action: 'view_offer', title: 'Ver Oferta', icon: '/icons/offer-icon.png' },
        { action: 'dismiss', title: 'Dispensar', icon: '/icons/dismiss-icon.png' }
      ];
    default:
      return [];
  }
}

function getOrderNotificationContent(
  status: OrderStatus,
  orderId: string,
  restaurantName?: string,
  estimatedTime?: number
): { title: string; message: string; priority: 'low' | 'normal' | 'high' } {
  const orderNumber = `#${orderId.slice(-6)}`;
  
  switch (status) {
    case 'confirmed':
      return {
        title: `Pedido ${orderNumber} Confirmado! ✅`,
        message: `Seu pedido foi confirmado${restaurantName ? ` pelo ${restaurantName}` : ''}${estimatedTime ? ` e ficará pronto em ${estimatedTime} minutos` : ''}.`,
        priority: 'normal'
      };
    case 'preparing':
      return {
        title: `Preparando seu Pedido ${orderNumber} 👨‍🍳`,
        message: `${restaurantName || 'O restaurante'} está preparando seu pedido${estimatedTime ? `. Tempo estimado: ${estimatedTime} minutos` : ''}.`,
        priority: 'normal'
      };
    case 'ready':
      return {
        title: `Pedido ${orderNumber} Pronto! 🍽️`,
        message: 'Seu pedido está pronto e aguardando o entregador.',
        priority: 'high'
      };
    case 'out_for_delivery':
      return {
        title: `Pedido ${orderNumber} Saiu para Entrega! 🚗`,
        message: 'Seu pedido está a caminho. Acompanhe a entrega em tempo real.',
        priority: 'high'
      };
    case 'delivered':
      return {
        title: `Pedido ${orderNumber} Entregue! 🎉`,
        message: 'Seu pedido foi entregue com sucesso. Obrigado por escolher o ZipFood!',
        priority: 'normal'
      };
    case 'cancelled':
      return {
        title: `Pedido ${orderNumber} Cancelado ❌`,
        message: 'Seu pedido foi cancelado. O reembolso será processado em até 5 dias úteis.',
        priority: 'high'
      };
    default:
      return {
        title: `Atualização do Pedido ${orderNumber}`,
        message: 'Seu pedido foi atualizado. Verifique os detalhes no app.',
        priority: 'normal'
      };
  }
}

function getDeliveryNotificationContent(
  type: 'new_delivery' | 'delivery_update' | 'payment_received',
  orderId: string,
  data?: any
): { title: string; message: string } {
  const orderNumber = `#${orderId.slice(-6)}`;
  
  switch (type) {
    case 'new_delivery':
      return {
        title: `Nova Entrega Disponível! 📦`,
        message: `Pedido ${orderNumber}${data?.restaurantName ? ` do ${data.restaurantName}` : ''}${data?.distance ? ` - ${data.distance}km` : ''}${data?.fee ? ` - R$ ${data.fee.toFixed(2)}` : ''}`
      };
    case 'delivery_update':
      return {
        title: `Atualização da Entrega ${orderNumber}`,
        message: data?.message || 'Status da entrega foi atualizado.'
      };
    case 'payment_received':
      return {
        title: `Pagamento Recebido! 💰`,
        message: `Você recebeu R$ ${data?.amount?.toFixed(2) || '0,00'} pela entrega ${orderNumber}.`
      };
    default:
      return {
        title: 'Notificação de Entrega',
        message: 'Nova atualização disponível.'
      };
  }
}

function getOrderActions(status: OrderStatus): Array<{ action: string; title: string; icon?: string }> {
  switch (status) {
    case 'out_for_delivery':
      return [
        { action: 'track', title: 'Acompanhar', icon: '/icons/track-icon.png' },
        { action: 'view', title: 'Ver Detalhes', icon: '/icons/view-icon.png' }
      ];
    case 'delivered':
      return [
        { action: 'rate', title: 'Avaliar', icon: '/icons/rate-icon.png' },
        { action: 'reorder', title: 'Pedir Novamente', icon: '/icons/reorder-icon.png' }
      ];
    default:
      return [
        { action: 'view', title: 'Ver Pedido', icon: '/icons/view-icon.png' }
      ];
  }
}

function getDeliveryActions(type: string): Array<{ action: string; title: string; icon?: string }> {
  switch (type) {
    case 'new_delivery':
      return [
        { action: 'accept', title: 'Aceitar', icon: '/icons/accept-icon.png' },
        { action: 'decline', title: 'Recusar', icon: '/icons/decline-icon.png' }
      ];
    default:
      return [
        { action: 'view', title: 'Ver Detalhes', icon: '/icons/view-icon.png' }
      ];
  }
}

// Exportar funções para uso em outros módulos
export { sendOrderNotification, sendDeliveryNotification };