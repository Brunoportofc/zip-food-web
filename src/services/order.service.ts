// src/services/order.service.ts

import { RestaurantConfiguration } from '../types/restaurant-config';
import { Restaurant } from '../types/restaurant';
import { notificationService } from './notification.service';
// REMOVA a importação do authService
// import { authService } from './auth.service';

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
  email: string;
  phone: string;
  avatar?: string;
}

export interface DeliveryDriver {
  id: string;
  name: string;
  phone: string;
  vehicle: string;
  rating: number;
}

export interface Order {
  id: string;
  restaurantId: string;
  customerId: string;
  deliveryDriverId?: string;
  items: OrderItem[];
  status: OrderStatus;
  total: number;
  deliveryFee: number;
  subtotal: number;
  createdAt: Date;
  updatedAt: Date;
  estimatedDeliveryTime?: Date;
  deliveryAddress: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    zipCode: string;
  };
  paymentMethod: 'credit-card' | 'debit-card' | 'pix' | 'cash';
  notes?: string;
  confirmationCode: string;
  statusHistory: Array<{
    status: OrderStatus;
    timestamp: Date;
    updatedBy: string;
  }>;
  customer: Customer;
  restaurant?: Restaurant;
  deliveryDriver?: DeliveryDriver;
}

class OrderService {
  private readonly API_BASE_URL = '/api/orders';
  private orderListeners: ((order: Order) => void)[] = [];
  private statusUpdateListeners: ((orderId: string, status: OrderStatus, updatedBy: string) => void)[] = [];

  // Função genérica para requisições
  private async makeRequest(url: string, options: RequestInit = {}) {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `Erro ao processar a requisição`);
    }

    if (data && !data.success && response.ok) {
        // Se a API retorna 200 OK mas com success: false
        return data.data; // Retorna os dados mesmo assim, se houver
    }
    
    return data.data;
  }

  async getOrdersByRestaurant(restaurantId: string): Promise<Order[]> {
    const orders = await this.makeRequest(`${this.API_BASE_URL}?restaurantId=${restaurantId}`);
    return Array.isArray(orders) ? orders.map(this.transformOrderFromAPI) : [];
  }

  async getOrderById(orderId: string): Promise<Order | null> {
    try {
      const order = await this.makeRequest(`${this.API_BASE_URL}/${orderId}`);
      return order ? this.transformOrderFromAPI(order) : null;
    } catch (error) {
        console.error('Erro ao buscar pedido por ID:', error);
        return null;
    }
  }

  async getAllOrders(): Promise<Order[]> {
    const orders = await this.makeRequest(this.API_BASE_URL);
    return Array.isArray(orders) ? orders.map(this.transformOrderFromAPI) : [];
  }

  async getOrdersByCustomer(customerId: string): Promise<Order[]> {
    const orders = await this.makeRequest(`${this.API_BASE_URL}?customerId=${customerId}`);
    return Array.isArray(orders) ? orders.map(this.transformOrderFromAPI) : [];
  }

  async createOrder(orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'statusHistory' | 'confirmationCode'>): Promise<Order> {
    const newOrderData = await this.makeRequest(this.API_BASE_URL, {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
    
    const newOrder = this.transformOrderFromAPI(newOrderData);
    this.orderListeners.forEach(callback => callback(newOrder));
    await this.handleStatusChange(newOrder, 'pending', 'pending');
    return newOrder;
  }

  async updateOrderStatus(
    orderId: string, 
    newStatus: OrderStatus, 
    updatedBy: 'customer' | 'restaurant' | 'driver' | 'system' = 'system'
  ): Promise<Order | null> {
    const updatedOrderData = await this.makeRequest(`${this.API_BASE_URL}/${orderId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status: newStatus, updatedBy }),
    });

    if (!updatedOrderData) return null;

    const updatedOrder = this.transformOrderFromAPI(updatedOrderData);
    this.statusUpdateListeners.forEach(callback => 
      callback(orderId, newStatus, updatedBy)
    );
    
    const previousStatus = updatedOrder.statusHistory.length > 1 
      ? updatedOrder.statusHistory[updatedOrder.statusHistory.length - 2].status 
      : 'pending';
    
    await this.handleStatusChange(updatedOrder, previousStatus, newStatus);
    return updatedOrder;
  }

  async assignDriverToOrder(orderId: string, driverId: string): Promise<Order | null> {
    const updatedOrderData = await this.makeRequest(`${this.API_BASE_URL}/${orderId}/assign-driver`, {
      method: 'PUT',
      body: JSON.stringify({ driverId }),
    });

    if (!updatedOrderData) return null;

    return this.transformOrderFromAPI(updatedOrderData);
  }

  // Listeners para novos pedidos
  onNewOrder(callback: (order: Order) => void): void {
    this.orderListeners.push(callback);
  }

  removeOrderListener(callback: (order: Order) => void): void {
    const index = this.orderListeners.indexOf(callback);
    if (index > -1) {
      this.orderListeners.splice(index, 1);
    }
  }

  onStatusUpdate(callback: (orderId: string, status: OrderStatus, updatedBy: string) => void): void {
    this.statusUpdateListeners.push(callback);
  }

  removeStatusUpdateListener(callback: (orderId: string, status: OrderStatus, updatedBy: string) => void): void {
    const index = this.statusUpdateListeners.indexOf(callback);
    if (index > -1) {
      this.statusUpdateListeners.splice(index, 1);
    }
  }

  // Transformar dados da API para o formato interno
  private transformOrderFromAPI(apiData: any): Order {
    return {
      id: apiData.id,
      restaurantId: apiData.restaurant_id || apiData.restaurantId,
      customerId: apiData.customer_id || apiData.customerId,
      deliveryDriverId: apiData.delivery_driver_id || apiData.deliveryDriverId,
      items: apiData.items || [],
      status: apiData.status,
      total: apiData.total,
      deliveryFee: apiData.delivery_fee || apiData.deliveryFee || 0,
      subtotal: apiData.subtotal || (apiData.total - (apiData.delivery_fee || 0)),
      createdAt: new Date(apiData.created_at || apiData.createdAt),
      updatedAt: new Date(apiData.updated_at || apiData.updatedAt),
      estimatedDeliveryTime: apiData.estimated_delivery_time ? new Date(apiData.estimated_delivery_time) : undefined,
      deliveryAddress: apiData.delivery_address || apiData.deliveryAddress,
      paymentMethod: apiData.payment_method || apiData.paymentMethod,
      notes: apiData.notes,
      confirmationCode: apiData.confirmation_code || apiData.confirmationCode || '',
      statusHistory: apiData.status_history || apiData.statusHistory || [],
      customer: apiData.customer || { id: apiData.customer_id, name: '', email: '', phone: '' },
      restaurant: apiData.restaurant,
      deliveryDriver: apiData.delivery_driver || apiData.deliveryDriver,
    };
  }

  // Manipular mudanças de status
  private async handleStatusChange(order: Order, previousStatus: OrderStatus, newStatus: OrderStatus): Promise<void> {
    try {
      // Enviar notificações baseadas no status
      notificationService.notifyCustomer(order.customer.id, order, previousStatus);
    } catch (error) {
      console.error('Erro ao enviar notificação de status:', error);
    }
  }
}

export const orderService = new OrderService();
export default orderService;