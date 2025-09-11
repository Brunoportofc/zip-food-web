import { RestaurantConfiguration } from '../types/restaurant-config';
import { Restaurant } from '../types/restaurant';
import { notificationService } from './notification.service';

export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivering' | 'delivered' | 'cancelled';

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  notes?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface Order {
  id: string;
  restaurantId: string;
  customerId: string;
  customer: Customer;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  status: OrderStatus;
  estimatedDeliveryTime: string;
  confirmationCode?: string;
  deliveryDriverId?: string;
  createdAt: Date;
  updatedAt: Date;
  statusHistory: {
    status: OrderStatus;
    timestamp: Date;
    updatedBy: 'customer' | 'restaurant' | 'driver' | 'system';
  }[];
}

export interface DeliveryDriver {
  id: string;
  name: string;
  phone: string;
  isAvailable: boolean;
  currentLocation?: {
    lat: number;
    lng: number;
  };
}

class OrderService {
  private orders: Order[] = [];
  private drivers: DeliveryDriver[] = [];
  private orderListeners: ((order: Order) => void)[] = [];
  private statusUpdateListeners: ((orderId: string, status: OrderStatus, updatedBy: string) => void)[] = [];

  constructor() {
    this.initializeMockData();
  }

  private initializeMockData() {
    // Dados simulados de entregadores
    this.drivers = [
      {
        id: 'driver-1',
        name: 'Carlos Silva',
        phone: '(11) 99999-1111',
        isAvailable: true,
        currentLocation: { lat: -23.5505, lng: -46.6333 }
      },
      {
        id: 'driver-2', 
        name: 'Ana Santos',
        phone: '(11) 99999-2222',
        isAvailable: true,
        currentLocation: { lat: -23.5489, lng: -46.6388 }
      }
    ];

    // Pedidos simulados
    this.orders = [
      {
        id: '#12345',
        restaurantId: 'rest-1',
        customerId: 'customer-1',
        customer: {
          id: 'customer-1',
          name: 'João Silva',
          phone: '(11) 98765-4321',
          address: 'Rua das Flores, 123 - Jardim Primavera'
        },
        items: [
          { id: '1', name: 'Big Burger', quantity: 2, price: 29.90 },
          { id: '2', name: 'Batata Frita Grande', quantity: 1, price: 15.90 }
        ],
        subtotal: 75.70,
        deliveryFee: 8.90,
        total: 84.60,
        status: 'pending',
        estimatedDeliveryTime: '35-45 min',
        createdAt: new Date(),
        updatedAt: new Date(),
        statusHistory: [
          {
            status: 'pending',
            timestamp: new Date(),
            updatedBy: 'customer'
          }
        ]
      }
    ];
  }

  // === GESTÃO DE PEDIDOS ===
  
  async getOrdersByRestaurant(restaurantId: string): Promise<Order[]> {
    return this.orders.filter(order => order.restaurantId === restaurantId);
  }

  async getOrderById(orderId: string): Promise<Order | null> {
    return this.orders.find(order => order.id === orderId) || null;
  }

  async getAllOrders(): Promise<Order[]> {
    return [...this.orders];
  }

  async createOrder(orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'statusHistory' | 'confirmationCode'>): Promise<Order> {
    const newOrder: Order = {
      ...orderData,
      id: `#${Date.now()}`,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
      statusHistory: [
        {
          status: 'pending',
          timestamp: new Date(),
          updatedBy: 'customer'
        }
      ]
    };

    this.orders.push(newOrder);
    
    // Notificar listeners sobre novo pedido
    this.orderListeners.forEach(listener => listener(newOrder));
    
    return newOrder;
  }

  async updateOrderStatus(
    orderId: string, 
    newStatus: OrderStatus, 
    updatedBy: 'customer' | 'restaurant' | 'driver' | 'system' = 'system'
  ): Promise<Order | null> {
    const orderIndex = this.orders.findIndex(order => order.id === orderId);
    
    if (orderIndex === -1) {
      throw new Error(`Pedido ${orderId} não encontrado`);
    }

    const order = this.orders[orderIndex];
    const previousStatus = order.status;
    
    // Atualizar status e histórico
    order.status = newStatus;
    order.updatedAt = new Date();
    order.statusHistory.push({
      status: newStatus,
      timestamp: new Date(),
      updatedBy
    });

    // Gerar código de confirmação quando sair para entrega
    if (newStatus === 'delivering' && !order.confirmationCode) {
      order.confirmationCode = await notificationService.handleOrderOutForDelivery(order);
    }

    this.orders[orderIndex] = order;

    // Notificar cliente sobre mudança de status
    notificationService.notifyCustomer(order.customer.id, order, previousStatus);

    // Notificar entregadores se pedido estiver pronto
    if (newStatus === 'ready') {
      notificationService.notifyDeliveryDrivers(order);
    }

    // Notificar listeners sobre mudança de status
    this.statusUpdateListeners.forEach(listener => 
      listener(orderId, newStatus, updatedBy)
    );

    // Lógica específica para cada status
    await this.handleStatusChange(order, previousStatus, newStatus);
    
    return order;
  }

  private async handleStatusChange(order: Order, previousStatus: OrderStatus, newStatus: OrderStatus) {
    switch (newStatus) {
      case 'confirmed':
        console.log(`Pedido ${order.id} confirmado pelo restaurante`);
        break;
        
      case 'preparing':
        console.log(`Pedido ${order.id} em preparo`);
        break;
        
      case 'ready':
        console.log(`Pedido ${order.id} pronto para entrega`);
        break;
        
      case 'delivering':
        // Notificar entregadores disponíveis
        await this.notifyAvailableDrivers(order);
        console.log(`Pedido ${order.id} saiu para entrega - Código: ${order.confirmationCode}`);
        break;
        
      case 'delivered':
        console.log(`Pedido ${order.id} entregue com sucesso`);
        break;
        
      case 'cancelled':
        console.log(`Pedido ${order.id} cancelado`);
        break;
    }
  }

  // === SISTEMA DE ENTREGA ===
  
  private async notifyAvailableDrivers(order: Order) {
    const availableDrivers = this.drivers.filter(driver => driver.isAvailable);
    
    // Simular notificação para entregadores
    availableDrivers.forEach(driver => {
      console.log(`🚗 Notificando entregador ${driver.name} sobre pedido ${order.id}`);
      // Aqui seria integrado com sistema de notificação push
    });
  }

  async assignDriverToOrder(orderId: string, driverId: string): Promise<Order | null> {
    const order = await this.getOrderById(orderId);
    if (!order) return null;

    order.deliveryDriverId = driverId;
    order.updatedAt = new Date();
    
    // Marcar entregador como ocupado
    const driver = this.drivers.find(d => d.id === driverId);
    if (driver) {
      driver.isAvailable = false;
    }

    return order;
  }

  async completeDelivery(orderId: string, confirmationCode: string, driverId?: string): Promise<boolean> {
    const order = await this.getOrderById(orderId);
    
    if (!order || order.status !== 'delivering') {
      throw new Error('Pedido não está em status de entrega');
    }

    if (!order.confirmationCode) {
      throw new Error('Código de confirmação não encontrado para este pedido');
    }

    // Validar código de confirmação
    if (!notificationService.validateConfirmationCode(orderId, confirmationCode, order.confirmationCode)) {
      throw new Error('Código de confirmação inválido');
    }

    await this.updateOrderStatus(orderId, 'delivered', 'driver');
    
    // Notificar sobre confirmação de entrega
    if (driverId) {
      notificationService.notifyDeliveryConfirmation(order, driverId);
    }
    
    // Liberar entregador
    if (order.deliveryDriverId) {
      const driver = this.drivers.find(d => d.id === order.deliveryDriverId);
      if (driver) {
        driver.isAvailable = true;
      }
    }

    return true;
  }

  // === UTILITÁRIOS ===
  
  private generateConfirmationCode(): string {
    return Math.floor(1000 + Math.random() * 9000).toString();
  }

  // === LISTENERS PARA TEMPO REAL ===
  
  onNewOrder(callback: (order: Order) => void) {
    this.orderListeners.push(callback);
  }

  onStatusUpdate(callback: (orderId: string, status: OrderStatus, updatedBy: string) => void) {
    this.statusUpdateListeners.push(callback);
  }

  removeOrderListener(callback: (order: Order) => void) {
    const index = this.orderListeners.indexOf(callback);
    if (index > -1) {
      this.orderListeners.splice(index, 1);
    }
  }

  removeStatusListener(callback: (orderId: string, status: OrderStatus, updatedBy: string) => void) {
    const index = this.statusUpdateListeners.indexOf(callback);
    if (index > -1) {
      this.statusUpdateListeners.splice(index, 1);
    }
  }

  // === MÉTRICAS E RELATÓRIOS ===
  
  async getRestaurantMetrics(restaurantId: string) {
    const restaurantOrders = await this.getOrdersByRestaurant(restaurantId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayOrders = restaurantOrders.filter(order => 
      order.createdAt >= today
    );

    return {
      todayOrders: todayOrders.length,
      todayRevenue: todayOrders.reduce((sum, order) => sum + order.total, 0),
      activeDeliveries: restaurantOrders.filter(order => 
        ['confirmed', 'preparing', 'ready', 'delivering'].includes(order.status)
      ).length,
      averageOrderValue: todayOrders.length > 0 
        ? todayOrders.reduce((sum, order) => sum + order.total, 0) / todayOrders.length 
        : 0
    };
  }
}

export const orderService = new OrderService();
export default orderService;