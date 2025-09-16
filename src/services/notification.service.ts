import { Order, OrderStatus } from './order.service';

export interface NotificationPayload {
  type: 'order_update' | 'delivery_assignment' | 'delivery_confirmation' | 'promotion' | 'system';
  orderId?: string;
  message: string;
  title: string;
  data?: any;
  timestamp: number;
  priority: 'low' | 'normal' | 'high';
}

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface NotificationPermission {
  granted: boolean;
  denied: boolean;
  default: boolean;
}

export interface DeliveryNotification {
  orderId: string;
  restaurantName: string;
  pickupAddress: string;
  deliveryAddress: string;
  estimatedDistance: number;
  deliveryFee: number;
  items: Array<{
    name: string;
    quantity: number;
  }>;
}

class NotificationService {
  private listeners: Map<string, ((notification: NotificationPayload) => void)[]> = new Map();
  private deliveryDrivers: string[] = []; // IDs dos entregadores ativos
  private pushSubscriptions: Map<string, PushSubscription> = new Map();
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null;
  private vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';

  constructor() {
    this.initializeServiceWorker();
  }

  // Inicializar Service Worker para push notifications
  private async initializeServiceWorker() {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        this.serviceWorkerRegistration = registration;
        console.log('Service Worker registrado com sucesso');
      } catch (error) {
        console.error('Erro ao registrar Service Worker:', error);
      }
    }
  }

  // Verificar permissões de notificação
  async checkNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      return { granted: false, denied: true, default: false };
    }

    const permission = Notification.permission;
    return {
      granted: permission === 'granted',
      denied: permission === 'denied',
      default: permission === 'default'
    };
  }

  // Solicitar permissão para notificações
  async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('Este navegador não suporta notificações');
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  // Subscrever para push notifications
  async subscribeToPushNotifications(userId: string): Promise<PushSubscription | null> {
    if (!this.serviceWorkerRegistration) {
      console.error('Service Worker não está registrado');
      return null;
    }

    try {
      const subscription = await this.serviceWorkerRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey)
      });

      const pushSubscription: PushSubscription = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh')!),
          auth: this.arrayBufferToBase64(subscription.getKey('auth')!)
        }
      };

      this.pushSubscriptions.set(userId, pushSubscription);
      
      // Aqui você enviaria a subscription para o servidor
      await this.sendSubscriptionToServer(userId, pushSubscription);
      
      return pushSubscription;
    } catch (error) {
      console.error('Erro ao subscrever para push notifications:', error);
      return null;
    }
  }

  // Converter VAPID key
  private urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Converter ArrayBuffer para Base64
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  // Enviar subscription para o servidor
  private async sendSubscriptionToServer(userId: string, subscription: PushSubscription) {
    try {
      await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          subscription
        })
      });
    } catch (error) {
      console.error('Erro ao enviar subscription para o servidor:', error);
    }
  }

  // Exibir notificação local
  async showNotification(notification: NotificationPayload) {
    const permission = await this.checkNotificationPermission();
    
    if (!permission.granted) {
      console.warn('Permissão de notificação não concedida');
      return;
    }

    const options: NotificationOptions = {
      body: notification.message,
      icon: '/icons/notification-icon.png',
      badge: '/icons/badge-icon.png',
      tag: notification.orderId || 'general',
      data: notification.data,
      requireInteraction: notification.priority === 'high'
    };

    if (this.serviceWorkerRegistration) {
      await this.serviceWorkerRegistration.showNotification(notification.title, options);
    } else {
      new Notification(notification.title, options);
    }
  }

  // Obter ações da notificação baseadas no tipo
  private getNotificationActions(type: string): any[] {
    switch (type) {
      case 'order_update':
        return [
          { action: 'view', title: 'Ver Pedido' },
          { action: 'dismiss', title: 'Dispensar' }
        ];
      case 'delivery_assignment':
        return [
          { action: 'accept', title: 'Aceitar' },
          { action: 'decline', title: 'Recusar' }
        ];
      default:
        return [];
    }
  }

  // Notificação específica para pedidos
  async notifyOrderUpdate(userId: string, order: Order, message: string, priority: 'low' | 'normal' | 'high' = 'normal') {
    const notification: NotificationPayload = {
      type: 'order_update',
      orderId: order.id,
      title: `Pedido #${order.id.slice(-6)}`,
      message,
      data: { order },
      timestamp: Date.now(),
      priority
    };

    await this.showNotification(notification);
    this.sendToUser(userId, notification);
  }

  // Notificação para promoções
  async notifyPromotion(userId: string, title: string, message: string, promotionData?: any) {
    const notification: NotificationPayload = {
      type: 'promotion',
      title,
      message,
      data: promotionData,
      timestamp: Date.now(),
      priority: 'normal'
    };

    await this.showNotification(notification);
    this.sendToUser(userId, notification);
  }

  // Registrar entregador como ativo
  registerDeliveryDriver(driverId: string) {
    if (!this.deliveryDrivers.includes(driverId)) {
      this.deliveryDrivers.push(driverId);
    }
  }

  // Remover entregador da lista ativa
  unregisterDeliveryDriver(driverId: string) {
    this.deliveryDrivers = this.deliveryDrivers.filter(id => id !== driverId);
  }

  // Adicionar listener para notificações
  addListener(userId: string, callback: (notification: NotificationPayload) => void) {
    if (!this.listeners.has(userId)) {
      this.listeners.set(userId, []);
    }
    this.listeners.get(userId)!.push(callback);

    // Retornar função para remover o listener
    return () => {
      const userListeners = this.listeners.get(userId);
      if (userListeners) {
        const index = userListeners.indexOf(callback);
        if (index > -1) {
          userListeners.splice(index, 1);
        }
      }
    };
  }

  // Enviar notificação para usuário específico
  private sendToUser(userId: string, notification: NotificationPayload) {
    const userListeners = this.listeners.get(userId);
    if (userListeners) {
      userListeners.forEach(callback => callback(notification));
    }
  }

  // Enviar notificação para todos os entregadores ativos
  private sendToAllDrivers(notification: NotificationPayload) {
    this.deliveryDrivers.forEach(driverId => {
      this.sendToUser(driverId, notification);
    });
  }

  // Notificar cliente sobre atualização do pedido
  notifyCustomer(customerId: string, order: Order, previousStatus?: OrderStatus) {
    const statusMessages: Record<OrderStatus, string> = {
      pending: 'Seu pedido foi recebido e está sendo processado',
      confirmed: 'Seu pedido foi confirmado pelo restaurante',
      preparing: 'Seu pedido está sendo preparado',
      ready: 'Seu pedido está pronto e aguardando entregador',
      delivering: 'Seu pedido saiu para entrega',
      delivered: 'Seu pedido foi entregue com sucesso',
      cancelled: 'Seu pedido foi cancelado'
    };

    this.sendToUser(customerId, {
      type: 'order_update',
      orderId: order.id,
      title: 'Atualização do Pedido',
      message: statusMessages[order.status],
      timestamp: Date.now(),
      priority: 'normal',
      data: {
        order,
        previousStatus,
        confirmationCode: order.confirmationCode
      }
    });
  }

  // Notificar entregadores sobre novo pedido disponível
  notifyDeliveryDrivers(order: Order) {
    if (order.status !== 'ready') return;

    const deliveryNotification: DeliveryNotification = {
      orderId: order.id,
      restaurantName: 'Nome do Restaurante', // Vem do serviço de restaurante
      pickupAddress: 'Endereço do Restaurante', // Vem do serviço de restaurante
      deliveryAddress: order.customer.address,
      estimatedDistance: this.calculateDistance(
        { street: order.customer.address, number: '' },
        { lat: -23.5505, lng: -46.6333 } // Coordenadas do restaurante
      ),
      deliveryFee: order.deliveryFee,
      items: order.items.map(item => ({
        name: item.name,
        quantity: item.quantity
      }))
    };

    this.sendToAllDrivers({
      type: 'delivery_assignment',
      orderId: order.id,
      title: 'Nova Entrega Disponível',
      message: `Nova entrega disponível - R$ ${order.deliveryFee.toFixed(2)}`,
      timestamp: Date.now(),
      priority: 'high',
      data: deliveryNotification
    });
  }

  // Notificar sobre confirmação de entrega
  notifyDeliveryConfirmation(order: Order, driverId: string) {
    // Notificar cliente
    this.sendToUser(order.customer.id, {
      type: 'delivery_confirmation',
      orderId: order.id,
      title: 'Pedido Entregue',
      message: 'Seu pedido foi entregue com sucesso!',
      timestamp: Date.now(),
      priority: 'normal',
      data: {
        order,
        deliveredAt: new Date(),
        driverId
      }
    });

    // Notificar restaurante
    this.sendToUser(order.restaurantId, {
      type: 'delivery_confirmation',
      orderId: order.id,
      title: 'Entrega Confirmada',
      message: `Pedido ${order.id} foi entregue com sucesso`,
      timestamp: Date.now(),
      priority: 'normal',
      data: {
        order,
        deliveredAt: new Date(),
        driverId
      }
    });
  }

  // Calcular distância estimada (implementação simplificada)
  private calculateDistance(
    address: { street: string; number: string },
    restaurantCoords: { lat: number; lng: number }
  ): number {
    // Em uma implementação real, usaria a API do Google Maps
    // Por enquanto, retorna uma distância aleatória entre 1-10km
    return Math.floor(Math.random() * 10) + 1;
  }

  // Gerar código de confirmação único
  generateConfirmationCode(): string {
    return Math.floor(1000 + Math.random() * 9000).toString();
  }

  // Validar código de confirmação
  validateConfirmationCode(orderId: string, providedCode: string, actualCode: string): boolean {
    return providedCode === actualCode;
  }

  // Simular notificação push (em produção, integraria com Firebase, OneSignal, etc.)
  async sendPushNotification(userId: string, title: string, body: string, data?: any) {
    console.log(`[PUSH NOTIFICATION] Para ${userId}:`, { title, body, data });
    
    // Em produção, aqui seria a integração com o serviço de push notifications
    // Exemplo com Firebase:
    // await admin.messaging().send({
    //   token: userDeviceToken,
    //   notification: { title, body },
    //   data
    // });
  }

  // Simular notificação SMS (em produção, integraria com Twilio, etc.)
  async sendSMSNotification(phoneNumber: string, message: string) {
    console.log(`[SMS] Para ${phoneNumber}: ${message}`);
    
    // Em produção, aqui seria a integração com o serviço de SMS
    // Exemplo com Twilio:
    // await twilioClient.messages.create({
    //   body: message,
    //   from: '+1234567890',
    //   to: phoneNumber
    // });
  }

  // Notificação completa quando pedido sai para entrega
  async handleOrderOutForDelivery(order: Order) {
    // 1. Gerar código de confirmação
    const confirmationCode = this.generateConfirmationCode();
    
    // 2. Notificar entregadores disponíveis
    this.notifyDeliveryDrivers(order);
    
    // 3. Enviar push notification para cliente
    await this.sendPushNotification(
      order.customer.id,
      'Pedido saiu para entrega!',
      `Seu pedido ${order.id} está a caminho. Código de confirmação: ${confirmationCode}`,
      { orderId: order.id, confirmationCode }
    );
    
    // 4. Enviar SMS com código de confirmação
    await this.sendSMSNotification(
      order.customer.phone,
      `Seu pedido ${order.id} saiu para entrega! Código de confirmação: ${confirmationCode}. Tenha-o em mãos para o entregador.`
    );
    
    return confirmationCode;
  }
}

export const notificationService = new NotificationService();
export default notificationService;