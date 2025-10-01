// src/services/notification.service.ts
// Serviço para integração de notificações com eventos do sistema

import { adminDb } from '@/lib/firebase/admin';
import { Notification } from '@/hooks/useRealTimeNotifications';

export interface OrderNotificationData {
  orderId: string;
  customerName: string;
  customerPhone?: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  status: string;
  restaurantId: string;
  estimatedDeliveryTime?: Date;
}

class NotificationService {
  
  /**
   * Criar notificação para novo pedido
   */
  async createOrderNotification(orderData: OrderNotificationData): Promise<void> {
    try {
      const notification = {
        id: `order_${orderData.orderId}_${Date.now()}`,
        title: '🛒 Novo Pedido Recebido',
        message: `Pedido #${orderData.orderId} - ${orderData.items.map(item => `${item.quantity}x ${item.name}`).join(', ')} para ${orderData.customerName} (R$ ${orderData.total.toFixed(2)})`,
        type: 'order',
        timestamp: new Date(),
        read: false,
        restaurantId: orderData.restaurantId,
        orderId: orderData.orderId,
        priority: 'high',
        action: {
          label: 'Ver Pedido',
          url: `/restaurant/pedidos?id=${orderData.orderId}`
        }
      };

      // Salvar no Firestore
      await adminDb.collection('notifications').add(notification);
      
      console.log('✅ [NotificationService] Notificação de pedido criada:', orderData.orderId);
    } catch (error) {
      console.error('❌ [NotificationService] Erro ao criar notificação de pedido:', error);
    }
  }

  /**
   * Buscar notificações de um restaurante
   */
  async getRestaurantNotifications(restaurantId: string, limit: number = 50): Promise<Notification[]> {
    try {
      const snapshot = await adminDb
        .collection('notifications')
        .where('restaurantId', '==', restaurantId)
        .orderBy('timestamp', 'desc')
        .limit(limit)
        .get();

      const notifications: Notification[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title,
          message: data.message,
          type: data.type,
          timestamp: data.timestamp.toDate(),
          read: data.read,
          action: data.action ? {
            label: data.action.label,
            onClick: () => window.location.href = data.action.url
          } : undefined
        };
      });

      return notifications;
    } catch (error) {
      console.error('❌ [NotificationService] Erro ao buscar notificações:', error);
      return [];
    }
  }
}

export const notificationService = new NotificationService();
export default notificationService;
