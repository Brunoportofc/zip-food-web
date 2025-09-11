import { Order, OrderStatus } from './order.service';

export interface NotificationPayload {
  type: 'order_update' | 'delivery_assignment' | 'delivery_confirmation';
  orderId: string;
  message: string;
  data?: any;
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
      message: statusMessages[order.status],
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
      message: `Nova entrega disponível - R$ ${order.deliveryFee.toFixed(2)}`,
      data: deliveryNotification
    });
  }

  // Notificar sobre confirmação de entrega
  notifyDeliveryConfirmation(order: Order, driverId: string) {
    // Notificar cliente
    this.sendToUser(order.customer.id, {
      type: 'delivery_confirmation',
      orderId: order.id,
      message: 'Seu pedido foi entregue com sucesso!',
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
      message: `Pedido ${order.id} foi entregue com sucesso`,
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