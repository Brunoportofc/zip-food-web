// src/services/order.service.ts

import { RestaurantConfiguration } from '../types/restaurant-config';
import { Restaurant } from '../types/restaurant';
import { notificationService } from './notification.service';
// REMOVA a importação do authService
// import { authService } from './auth.service';

export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivering' | 'delivered' | 'cancelled';
// ... (interfaces OrderItem, Customer, etc. permanecem as mesmas)

// ... (definição da interface Order permanece a mesma)

// ... (definição da interface DeliveryDriver permanece a mesma)

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
  
  // ... (O restante da classe, como handleStatusChange, transformOrderFromAPI, etc., permanece o mesmo)
  
  // ... (Cole o restante da sua classe OrderService aqui, sem alterações nos outros métodos)
}

export const orderService = new OrderService();
export default orderService;