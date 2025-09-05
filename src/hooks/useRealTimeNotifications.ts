'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'order' | 'system';
  timestamp: Date;
  read: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const useRealTimeNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Simular notificações em tempo real
  useEffect(() => {
    // Carregar notificações iniciais
    const initialNotifications: Notification[] = [
      {
        id: '1',
        title: 'Novo Pedido Recebido',
        message: 'Pedido #1234 - Pizza Margherita para João Silva',
        type: 'order',
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        read: false,
        action: {
          label: 'Ver Pedido',
          onClick: () => console.log('Navegando para pedido #1234')
        }
      },
      {
        id: '2',
        title: 'Pedido Entregue',
        message: 'Pedido #1230 foi entregue com sucesso',
        type: 'success',
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
        read: false
      },
      {
        id: '3',
        title: 'Estoque Baixo',
        message: 'Ingrediente "Mussarela" está com estoque baixo',
        type: 'warning',
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        read: true
      },
      {
        id: '4',
        title: 'Sistema Atualizado',
        message: 'Nova versão do sistema foi instalada com sucesso',
        type: 'system',
        timestamp: new Date(Date.now() - 60 * 60 * 1000),
        read: true
      }
    ];

    setNotifications(initialNotifications);
    setUnreadCount(initialNotifications.filter(n => !n.read).length);

    // Simular chegada de novas notificações
    const interval = setInterval(() => {
      const randomNotifications = [
        {
          title: 'Novo Pedido',
          message: `Pedido #${Math.floor(Math.random() * 9999)} recebido`,
          type: 'order' as const
        },
        {
          title: 'Pedido Confirmado',
          message: 'Pedido foi confirmado pelo cliente',
          type: 'success' as const
        },
        {
          title: 'Avaliação Recebida',
          message: 'Nova avaliação de 5 estrelas recebida',
          type: 'info' as const
        },
        {
          title: 'Produto Esgotado',
          message: 'Pizza Calabresa está esgotada',
          type: 'warning' as const
        }
      ];

      // 30% de chance de receber uma nova notificação a cada 30 segundos
      if (Math.random() < 0.3) {
        const randomNotif = randomNotifications[Math.floor(Math.random() * randomNotifications.length)];
        const newNotification: Notification = {
          id: Date.now().toString(),
          title: randomNotif.title,
          message: randomNotif.message,
          type: randomNotif.type,
          timestamp: new Date(),
          read: false
        };

        setNotifications(prev => [newNotification, ...prev]);
        setUnreadCount(prev => prev + 1);

        // Mostrar toast para notificações importantes
        if (randomNotif.type === 'order' || randomNotif.type === 'warning') {
          toast(randomNotif.message, {
            icon: randomNotif.type === 'order' ? '🛒' : '⚠️',
            duration: 4000
          });
        }
      }
    }, 30000); // A cada 30 segundos

    return () => clearInterval(interval);
  }, []);

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date(),
      read: false
    };

    setNotifications(prev => [newNotification, ...prev]);
    setUnreadCount(prev => prev + 1);

    // Mostrar toast automático
    toast(notification.message, {
      icon: getNotificationEmoji(notification.type),
      duration: 4000
    });
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(notif => {
        if (notif.id === id && !notif.read) {
          setUnreadCount(count => count - 1);
          return { ...notif, read: true };
        }
        return notif;
      })
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    );
    setUnreadCount(0);
  }, []);

  const deleteNotification = useCallback((id: string) => {
    setNotifications(prev => {
      const notification = prev.find(n => n.id === id);
      if (notification && !notification.read) {
        setUnreadCount(count => count - 1);
      }
      return prev.filter(notif => notif.id !== id);
    });
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  // Notificações específicas para diferentes eventos
  const notifyNewOrder = useCallback((orderData: { id: string; customer: string; items: string }) => {
    addNotification({
      title: 'Novo Pedido Recebido',
      message: `Pedido #${orderData.id} - ${orderData.items} para ${orderData.customer}`,
      type: 'order',
      action: {
        label: 'Ver Pedido',
        onClick: () => window.location.href = `/restaurant/orders?id=${orderData.id}`
      }
    });
  }, [addNotification]);

  const notifyOrderStatusChange = useCallback((orderId: string, status: string) => {
    const statusMessages = {
      'confirmed': 'Pedido confirmado',
      'preparing': 'Pedido em preparo',
      'ready': 'Pedido pronto para entrega',
      'delivered': 'Pedido entregue com sucesso',
      'cancelled': 'Pedido cancelado'
    };

    addNotification({
      title: 'Status do Pedido Atualizado',
      message: `Pedido #${orderId} - ${statusMessages[status as keyof typeof statusMessages] || status}`,
      type: status === 'delivered' ? 'success' : status === 'cancelled' ? 'error' : 'info'
    });
  }, [addNotification]);

  const notifyLowStock = useCallback((item: string, quantity: number) => {
    addNotification({
      title: 'Estoque Baixo',
      message: `${item} está com apenas ${quantity} unidades restantes`,
      type: 'warning'
    });
  }, [addNotification]);

  const notifySystemUpdate = useCallback((message: string) => {
    addNotification({
      title: 'Atualização do Sistema',
      message,
      type: 'system'
    });
  }, [addNotification]);

  return {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    // Métodos específicos
    notifyNewOrder,
    notifyOrderStatusChange,
    notifyLowStock,
    notifySystemUpdate
  };
};

function getNotificationEmoji(type: string): string {
  switch (type) {
    case 'success':
      return '✅';
    case 'error':
      return '❌';
    case 'warning':
      return '⚠️';
    case 'info':
      return 'ℹ️';
    case 'order':
      return '🛒';
    case 'system':
      return '⚙️';
    default:
      return '🔔';
  }
}

export default useRealTimeNotifications;