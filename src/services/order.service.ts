import { RestaurantConfiguration } from '../types/restaurant-config';
import { Restaurant } from '../types/restaurant';
import { notificationService } from './notification.service';
import { authService } from './auth.service';

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

/**
 * Serviço de pedidos integrado com o backend Supabase
 */
class OrderService {
  private readonly API_BASE_URL = '/api/orders';
  private orderListeners: ((order: Order) => void)[] = [];
  private statusUpdateListeners: ((orderId: string, status: OrderStatus, updatedBy: string) => void)[] = [];

  /**
   * Obtém pedidos por restaurante usando a API do backend
   */
  async getOrdersByRestaurant(restaurantId: string): Promise<Order[]> {
    try {
      const token = authService.getCurrentToken();
      if (!token) {
        throw new Error('Token de autenticação não encontrado');
      }

      const response = await fetch(`${this.API_BASE_URL}?restaurantId=${restaurantId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao buscar pedidos do restaurante');
      }

      if (!data.success) {
        throw new Error(data.message || 'Erro na busca');
      }

      return data.data.map(this.transformOrderFromAPI);
    } catch (error) {
      console.error('Erro ao buscar pedidos do restaurante:', error);
      throw error;
    }
  }

  /**
   * Obtém pedido por ID usando a API do backend
   */
  async getOrderById(orderId: string): Promise<Order | null> {
    try {
      const token = authService.getCurrentToken();
      if (!token) {
        throw new Error('Token de autenticação não encontrado');
      }

      const response = await fetch(`${this.API_BASE_URL}/${orderId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(data.message || 'Erro ao buscar pedido');
      }

      if (!data.success) {
        return null;
      }

      return this.transformOrderFromAPI(data.data);
    } catch (error) {
      console.error('Erro ao buscar pedido:', error);
      throw error;
    }
  }

  /**
   * Obtém todos os pedidos usando a API do backend
   */
  async getAllOrders(): Promise<Order[]> {
    try {
      const token = authService.getCurrentToken();
      if (!token) {
        throw new Error('Token de autenticação não encontrado');
      }

      const response = await fetch(this.API_BASE_URL, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao buscar pedidos');
      }

      if (!data.success) {
        throw new Error(data.message || 'Erro na busca');
      }

      return data.data.map(this.transformOrderFromAPI);
    } catch (error) {
      console.error('Erro ao buscar todos os pedidos:', error);
      throw error;
    }
  }

  /**
   * Obtém pedidos por cliente usando a API do backend
   */
  async getOrdersByCustomer(customerId: string): Promise<Order[]> {
    try {
      const token = authService.getCurrentToken();
      if (!token) {
        throw new Error('Token de autenticação não encontrado');
      }

      const response = await fetch(`${this.API_BASE_URL}?customerId=${customerId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao buscar pedidos do cliente');
      }

      if (!data.success) {
        throw new Error(data.message || 'Erro na busca');
      }

      return data.data.map(this.transformOrderFromAPI);
    } catch (error) {
      console.error('Erro ao buscar pedidos do cliente:', error);
      throw error;
    }
  }

  /**
   * Cria novo pedido usando a API do backend
   */
  async createOrder(orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'statusHistory' | 'confirmationCode'>): Promise<Order> {
    try {
      const token = authService.getCurrentToken();
      if (!token) {
        throw new Error('Token de autenticação não encontrado');
      }

      const response = await fetch(this.API_BASE_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao criar pedido');
      }

      if (!data.success) {
        throw new Error(data.message || 'Erro na criação do pedido');
      }

      const newOrder = this.transformOrderFromAPI(data.data);
      
      // Notificar listeners sobre novo pedido
      this.orderListeners.forEach(callback => callback(newOrder));
      
      // Enviar notificação
      await this.handleStatusChange(newOrder, 'pending', 'pending');
      
      return newOrder;
    } catch (error) {
      console.error('Erro ao criar pedido:', error);
      throw error;
    }
  }

  /**
   * Atualiza status do pedido usando a API do backend
   */
  async updateOrderStatus(
    orderId: string, 
    newStatus: OrderStatus, 
    updatedBy: 'customer' | 'restaurant' | 'driver' | 'system' = 'system'
  ): Promise<Order | null> {
    try {
      const token = authService.getCurrentToken();
      if (!token) {
        throw new Error('Token de autenticação não encontrado');
      }

      const response = await fetch(`${this.API_BASE_URL}/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus, updatedBy }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao atualizar status do pedido');
      }

      if (!data.success) {
        throw new Error(data.message || 'Erro na atualização');
      }

      const updatedOrder = this.transformOrderFromAPI(data.data);
      
      // Notificar listeners sobre mudança de status
      this.statusUpdateListeners.forEach(callback => 
        callback(orderId, newStatus, updatedBy)
      );
      
      // Lidar com mudança de status
      const previousStatus = updatedOrder.statusHistory.length > 1 
        ? updatedOrder.statusHistory[updatedOrder.statusHistory.length - 2].status 
        : 'pending';
      
      await this.handleStatusChange(updatedOrder, previousStatus, newStatus);
      
      return updatedOrder;
    } catch (error) {
      console.error('Erro ao atualizar status do pedido:', error);
      throw error;
    }
  }

  /**
   * Lida com mudanças de status e envia notificações apropriadas
   */
  private async handleStatusChange(order: Order, previousStatus: OrderStatus, newStatus: OrderStatus) {
    try {
      const statusMessages = {
        confirmed: 'Seu pedido foi confirmado pelo restaurante!',
        preparing: 'Seu pedido está sendo preparado.',
        ready: 'Seu pedido está pronto para retirada/entrega!',
        delivering: 'Seu pedido saiu para entrega!',
        delivered: 'Seu pedido foi entregue com sucesso!',
        cancelled: 'Seu pedido foi cancelado.'
      };

      if (newStatus in statusMessages) {
        await notificationService.sendPushNotification(
          order.customerId,
          'Atualização do Pedido',
          statusMessages[newStatus as keyof typeof statusMessages],
          { orderId: order.id, status: newStatus }
        );
      }

      // Lógica específica para cada status
      if (newStatus === 'confirmed') {
        await this.notifyAvailableDrivers(order);
      }
    } catch (error) {
      console.error('Erro ao lidar com mudança de status:', error);
    }
  }

  /**
   * Notifica entregadores disponíveis sobre novo pedido
   */
  private async notifyAvailableDrivers(order: Order) {
    try {
      // Esta funcionalidade seria implementada com WebSockets ou push notifications
      console.log(`Notificando entregadores sobre pedido ${order.id}`);
    } catch (error) {
      console.error('Erro ao notificar entregadores:', error);
    }
  }

  /**
   * Atribui entregador ao pedido
   */
  async assignDriverToOrder(orderId: string, driverId: string): Promise<Order | null> {
    try {
      const token = authService.getCurrentToken();
      if (!token) {
        throw new Error('Token de autenticação não encontrado');
      }

      const response = await fetch(`${this.API_BASE_URL}/${orderId}/driver`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ driverId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao atribuir entregador');
      }

      if (!data.success) {
        throw new Error(data.message || 'Erro na atribuição');
      }

      return this.transformOrderFromAPI(data.data);
    } catch (error) {
      console.error('Erro ao atribuir entregador:', error);
      throw error;
    }
  }

  /**
   * Completa a entrega do pedido
   */
  async completeDelivery(orderId: string, confirmationCode: string, driverId?: string): Promise<boolean> {
    try {
      const token = authService.getCurrentToken();
      if (!token) {
        throw new Error('Token de autenticação não encontrado');
      }

      const response = await fetch(`${this.API_BASE_URL}/${orderId}/complete`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ confirmationCode, driverId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao completar entrega');
      }

      return data.success;
    } catch (error) {
      console.error('Erro ao completar entrega:', error);
      throw error;
    }
  }

  /**
   * Transforma dados da API para o formato esperado pelo frontend
   */
  private transformOrderFromAPI(apiOrder: any): Order {
    return {
      id: apiOrder.id,
      restaurantId: apiOrder.restaurant_id,
      customerId: apiOrder.customer_id,
      customer: {
        id: apiOrder.customer_id,
        name: apiOrder.customer_name || 'Cliente',
        phone: apiOrder.customer_phone || '',
        address: apiOrder.delivery_address || '',
        coordinates: apiOrder.customer_coordinates ? {
          lat: apiOrder.customer_coordinates.lat,
          lng: apiOrder.customer_coordinates.lng
        } : undefined
      },
      items: Array.isArray(apiOrder.items) ? apiOrder.items : [],
      subtotal: parseFloat(apiOrder.subtotal) || 0,
      deliveryFee: parseFloat(apiOrder.delivery_fee) || 0,
      total: parseFloat(apiOrder.total) || 0,
      status: apiOrder.status || 'pending',
      estimatedDeliveryTime: apiOrder.estimated_delivery_time || '',
      confirmationCode: apiOrder.confirmation_code,
      deliveryDriverId: apiOrder.delivery_driver_id,
      createdAt: new Date(apiOrder.created_at),
      updatedAt: new Date(apiOrder.updated_at),
      statusHistory: Array.isArray(apiOrder.status_history) ? apiOrder.status_history.map((h: any) => ({
        status: h.status,
        timestamp: new Date(h.timestamp),
        updatedBy: h.updated_by
      })) : []
    };
  }

  /**
   * Gera código de confirmação
   */
  private generateConfirmationCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  /**
   * Adiciona listener para novos pedidos
   */
  onNewOrder(callback: (order: Order) => void) {
    this.orderListeners.push(callback);
  }

  /**
   * Adiciona listener para atualizações de status
   */
  onStatusUpdate(callback: (orderId: string, status: OrderStatus, updatedBy: string) => void) {
    this.statusUpdateListeners.push(callback);
  }

  /**
   * Remove listener de pedidos
   */
  removeOrderListener(callback: (order: Order) => void) {
    const index = this.orderListeners.indexOf(callback);
    if (index > -1) {
      this.orderListeners.splice(index, 1);
    }
  }

  /**
   * Remove listener de status
   */
  removeStatusListener(callback: (orderId: string, status: OrderStatus, updatedBy: string) => void) {
    const index = this.statusUpdateListeners.indexOf(callback);
    if (index > -1) {
      this.statusUpdateListeners.splice(index, 1);
    }
  }

  /**
   * Obtém métricas do restaurante
   */
  async getRestaurantMetrics(restaurantId: string) {
    try {
      const token = authService.getCurrentToken();
      if (!token) {
        throw new Error('Token de autenticação não encontrado');
      }

      const response = await fetch(`${this.API_BASE_URL}/metrics/${restaurantId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao buscar métricas');
      }

      return data.success ? data.data : null;
    } catch (error) {
      console.error('Erro ao buscar métricas do restaurante:', error);
      throw error;
    }
  }

  /**
   * Método para desenvolvimento - obtém dados de teste
   */
  getDevOrderData(): Partial<Order> {
    return {
      restaurantId: 'rest-1',
      customerId: 'customer-1',
      customer: {
        id: 'customer-1',
        name: 'João Silva',
        phone: '(11) 98765-4321',
        address: 'Rua das Flores, 123 - Jardim Primavera'
      },
      items: [
        {
          id: 'item-1',
          name: 'Pizza Margherita',
          quantity: 1,
          price: 35.90
        }
      ],
      subtotal: 35.90,
      deliveryFee: 5.00,
      total: 40.90,
      status: 'pending',
      estimatedDeliveryTime: '45 minutos'
    };
  }
}

export const orderService = new OrderService();
export default orderService;