import { orderService, Order } from './order.service';
import { menuService, MenuItem } from './menu.service';
import { notificationService } from './notification.service';
import { restaurantConfigService } from './restaurant-config.service';

export interface SyncEvent {
  id: string;
  type: 'order_update' | 'menu_update' | 'restaurant_update' | 'delivery_update';
  entityId: string;
  data: any;
  timestamp: Date;
  source: 'restaurant' | 'client' | 'delivery' | 'system';
}

export interface SyncListener {
  id: string;
  type: SyncEvent['type'];
  callback: (event: SyncEvent) => void;
}

class SyncService {
  private listeners: SyncListener[] = [];
  private eventHistory: SyncEvent[] = [];
  private maxHistorySize = 1000;

  constructor() {
    this.initializeServiceListeners();
  }

  private initializeServiceListeners() {
    // Os listeners serão configurados quando necessário
    // através dos métodos específicos de sincronização

    // Escutar mudanças no serviço de menu
    menuService.addListener((menuItems) => {
      this.broadcastEvent({
        id: `menu-sync-${Date.now()}-${Math.random()}`,
        type: 'menu_update',
        entityId: 'menu',
        data: { menuItems },
        timestamp: new Date(),
        source: 'system'
      });
    });
  }

  // Registrar listener para eventos de sincronização
  addListener(type: SyncEvent['type'], callback: (event: SyncEvent) => void): () => void {
    const listener: SyncListener = {
      id: `listener-${Date.now()}-${Math.random()}`,
      type,
      callback
    };

    this.listeners.push(listener);

    // Retorna função para remover o listener
    return () => {
      const index = this.listeners.findIndex(l => l.id === listener.id);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // Broadcast de evento para todos os listeners interessados
  private broadcastEvent(event: SyncEvent) {
    // Adicionar ao histórico
    this.eventHistory.push(event);
    
    // Manter tamanho do histórico
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory = this.eventHistory.slice(-this.maxHistorySize);
    }

    // Notificar listeners
    this.listeners
      .filter(listener => listener.type === event.type)
      .forEach(listener => {
        try {
          listener.callback(event);
        } catch (error) {
          console.error('Erro ao executar listener de sincronização:', error);
        }
      });
  }

  // Métodos para sincronização específica de pedidos
  async syncOrderUpdate(orderId: string, updates: Partial<Order>, source: SyncEvent['source'] = 'system') {
    try {
      const updatedOrder = await orderService.updateOrderStatus(orderId, updates.status!);
      
      if (updatedOrder) {
        this.broadcastEvent({
          id: `order-update-${Date.now()}`,
          type: 'order_update',
          entityId: orderId,
          data: updatedOrder,
          timestamp: new Date(),
          source
        });

        // Notificações específicas baseadas no status
        await this.handleOrderStatusNotifications(updatedOrder, source);
      }

      return updatedOrder;
    } catch (error) {
      console.error('Erro ao sincronizar atualização de pedido:', error);
      throw error;
    }
  }

  private async handleOrderStatusNotifications(order: Order, source: SyncEvent['source']) {
    switch (order.status) {
      case 'confirmed':
        // Notificar restaurante sobre novo pedido
        notificationService.notifyCustomer(order.customer.id, order);
        break;

      case 'preparing':
        // Notificar cliente que pedido está sendo preparado
        notificationService.notifyCustomer(order.customer.id, order, 'confirmed');
        break;

      case 'ready':
        // Notificar entregadores disponíveis
        notificationService.notifyDeliveryDrivers(order);
        break;

      case 'delivering':
        // Notificar cliente que pedido saiu para entrega
        notificationService.notifyCustomer(order.customer.id, order, 'ready');
        break;

      case 'delivered':
        // Notificar todas as partes sobre entrega concluída
        notificationService.notifyCustomer(order.customer.id, order, 'delivering');
        break;
    }
  }

  // Sincronização de menu
  async syncMenuUpdate(restaurantId: string, source: SyncEvent['source'] = 'restaurant') {
    try {
      // Buscar os itens do menu atualizados
      const menuItems = await menuService.getMenuItems(restaurantId);
      
      this.broadcastEvent({
        id: `menu-sync-${Date.now()}`,
        type: 'menu_update',
        entityId: restaurantId,
        data: { restaurantId, menuItems },
        timestamp: new Date(),
        source
      });

      return menuItems;
    } catch (error) {
      console.error('Erro ao sincronizar menu:', error);
      throw error;
    }
  }

  // Sincronização de dados do restaurante
  async syncRestaurantUpdate(restaurantId: string, updates: any, source: SyncEvent['source'] = 'restaurant') {
    try {
      // Atualizar configuração do restaurante
      const config = await restaurantConfigService.getRestaurantConfig(restaurantId);
      
      if (config) {
        // Aplicar atualizações
        Object.assign(config, updates);
        
        this.broadcastEvent({
          id: `restaurant-update-${Date.now()}`,
          type: 'restaurant_update',
          entityId: restaurantId,
          data: config,
          timestamp: new Date(),
          source
        });

        // Sincronizar menu se necessário
        if (updates.businessType || updates.categories) {
          await this.syncMenuUpdate(restaurantId, source);
        }
      }

      return config;
    } catch (error) {
      console.error('Erro ao sincronizar dados do restaurante:', error);
      throw error;
    }
  }

  // Sincronização de entrega
  async syncDeliveryUpdate(orderId: string, driverId: string, updates: any, source: SyncEvent['source'] = 'delivery') {
    try {
      const order = await orderService.getOrderById(orderId);
      
      if (order) {
        // Broadcast do evento de atualização de entrega

        this.broadcastEvent({
          id: `delivery-update-${Date.now()}`,
          type: 'delivery_update',
          entityId: orderId,
          data: { orderId, driverId, ...updates },
          timestamp: new Date(),
          source
        });

        // Notificar cliente sobre atualizações de entrega
        if (updates.location || updates.estimatedArrival) {
          notificationService.notifyCustomer(order.customer.id, order);
        }
      }

      return order;
    } catch (error) {
      console.error('Erro ao sincronizar atualização de entrega:', error);
      throw error;
    }
  }

  // Obter histórico de eventos
  getEventHistory(type?: SyncEvent['type'], entityId?: string): SyncEvent[] {
    let events = this.eventHistory;
    
    if (type) {
      events = events.filter(event => event.type === type);
    }
    
    if (entityId) {
      events = events.filter(event => event.entityId === entityId);
    }
    
    return events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  // Verificar status de sincronização
  getSyncStatus() {
    const now = new Date();
    const recentEvents = this.eventHistory.filter(
      event => now.getTime() - event.timestamp.getTime() < 60000 // últimos 60 segundos
    );

    return {
      totalEvents: this.eventHistory.length,
      recentEvents: recentEvents.length,
      activeListeners: this.listeners.length,
      lastEventTime: this.eventHistory.length > 0 
        ? this.eventHistory[this.eventHistory.length - 1].timestamp 
        : null
    };
  }

  // Forçar sincronização completa
  async forceSyncAll(restaurantId: string) {
    try {
      console.log('Iniciando sincronização completa...');
      
      // Sincronizar dados do restaurante
      await this.syncRestaurantUpdate(restaurantId, {}, 'system');
      
      // Sincronizar menu
      await this.syncMenuUpdate(restaurantId, 'system');
      
      // Sincronizar pedidos ativos
      const orders = await orderService.getOrdersByRestaurant(restaurantId);
      const activeOrders = orders.filter(order => 
        ['confirmed', 'preparing', 'ready', 'delivering'].includes(order.status)
      );
      
      for (const order of activeOrders) {
        this.broadcastEvent({
          id: `force-sync-${Date.now()}-${order.id}`,
          type: 'order_update',
          entityId: order.id,
          data: order,
          timestamp: new Date(),
          source: 'system'
        });
      }
      
      console.log('Sincronização completa finalizada');
      return true;
    } catch (error) {
      console.error('Erro na sincronização completa:', error);
      throw error;
    }
  }
}

export const syncService = new SyncService();
