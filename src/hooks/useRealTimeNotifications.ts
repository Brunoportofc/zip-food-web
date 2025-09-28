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

  // Carregar notificações reais do Firebase
  useEffect(() => {
    loadNotifications();
    
    // Configurar Server-Sent Events para atualizações em tempo real
    const eventSource = new EventSource('/api/notifications/stream', {
      withCredentials: true
    });

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'notification') {
          const newNotification = {
            ...data.data,
            timestamp: new Date(data.data.timestamp),
            action: data.data.action ? {
              label: data.data.action.label,
              onClick: () => {
                if (data.data.action.url) {
                  window.location.href = data.data.action.url;
                }
              }
            } : undefined
          };

          // Adicionar nova notificação ao topo da lista
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);

          // Mostrar toast para notificações importantes
          if (newNotification.type === 'order' || newNotification.type === 'error' || newNotification.type === 'warning') {
            toast(newNotification.message, {
              icon: getNotificationEmoji(newNotification.type),
              duration: 4000
            });
          }
        }
      } catch (error) {
        console.error('❌ [SSE] Erro ao processar evento:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('❌ [SSE] Erro na conexão:', error);
      // Fallback para polling se SSE falhar
      setTimeout(() => {
        loadNotifications();
      }, 5000);
    };

    // Cleanup
    return () => {
      eventSource.close();
    };
  }, []);

  const loadNotifications = async () => {
    try {
      const response = await fetch('/api/notifications?limit=50', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.success && data.data) {
          const { notifications: newNotifications, unreadCount: newUnreadCount } = data.data;
          
          // Converter timestamps para Date objects
          const processedNotifications = newNotifications.map((notif: any) => ({
            ...notif,
            timestamp: new Date(notif.timestamp),
            action: notif.action ? {
              label: notif.action.label,
              onClick: () => {
                if (notif.action.url) {
                  window.location.href = notif.action.url;
                }
              }
            } : undefined
          }));

          // Verificar se há novas notificações para mostrar toast
          const currentIds = new Set(notifications.map(n => n.id));
          const newNotifs = processedNotifications.filter((n: Notification) => !currentIds.has(n.id));
          
          // Mostrar toast para novas notificações importantes
          newNotifs.forEach((notif: Notification) => {
            if (notif.type === 'order' || notif.type === 'error' || notif.type === 'warning') {
              toast(notif.message, {
                icon: getNotificationEmoji(notif.type),
                duration: 4000
              });
            }
          });

          // Verificar consistência dos dados
          const actualUnreadCount = processedNotifications.filter(n => !n.read).length;
          const finalUnreadCount = Math.max(0, Math.min(newUnreadCount, actualUnreadCount));

          console.log('🔄 [Notifications] Dados recebidos:', {
            notifications: processedNotifications.length,
            unreadCountAPI: newUnreadCount,
            unreadCountArray: actualUnreadCount,
            finalUnreadCount
          });

          setNotifications(processedNotifications);
          setUnreadCount(finalUnreadCount);
        } else {
          console.warn('⚠️ [Notifications] Resposta da API sem dados válidos:', data);
          // Resetar estado se não há dados válidos
          setNotifications([]);
          setUnreadCount(0);
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        console.error('❌ [Notifications] Erro na API:', response.status, errorData);
        
        // Se for erro de autenticação, não mostrar erro para o usuário
        if (response.status !== 401) {
          toast.error('Erro ao carregar notificações');
        }
        
        // Resetar estado em caso de erro
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('❌ [Notifications] Erro ao carregar notificações:', error);
      // Resetar estado em caso de erro
      setNotifications([]);
      setUnreadCount(0);
    }
  };

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

  const markAsRead = useCallback(async (id: string) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          notificationId: id,
          read: true
        })
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => {
            if (notif.id === id && !notif.read) {
              setUnreadCount(count => count - 1);
              return { ...notif, read: true };
            }
            return notif;
          })
        );
      }
    } catch (error) {
      console.error('❌ [Notifications] Erro ao marcar como lida:', error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          notificationId: 'dummy', // Será ignorado
          action: 'markAllAsRead'
        })
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => ({ ...notif, read: true }))
        );
        setUnreadCount(0);
        toast.success('Todas as notificações foram marcadas como lidas');
      }
    } catch (error) {
      console.error('❌ [Notifications] Erro ao marcar todas como lidas:', error);
      toast.error('Erro ao marcar notificações como lidas');
    }
  }, []);

  const deleteNotification = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/notifications?id=${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        setNotifications(prev => {
          const notification = prev.find(n => n.id === id);
          if (notification && !notification.read) {
            setUnreadCount(count => count - 1);
          }
          return prev.filter(notif => notif.id !== id);
        });
        toast.success('Notificação removida');
      }
    } catch (error) {
      console.error('❌ [Notifications] Erro ao deletar notificação:', error);
      toast.error('Erro ao remover notificação');
    }
  }, []);

  const clearAllNotifications = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications?action=clearAll', {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        setNotifications([]);
        setUnreadCount(0);
        toast.success('Todas as notificações foram removidas');
      }
    } catch (error) {
      console.error('❌ [Notifications] Erro ao limpar notificações:', error);
      toast.error('Erro ao limpar notificações');
    }
  }, []);

  // Notificações específicas para diferentes eventos
  const notifyNewOrder = useCallback(async (orderData: { id: string; customer: string; items: string; total?: number }) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          title: '🛒 Novo Pedido Recebido',
          message: `Pedido #${orderData.id} - ${orderData.items} para ${orderData.customer}${orderData.total ? ` (R$ ${orderData.total.toFixed(2)})` : ''}`,
          type: 'order',
          priority: 'high',
          orderId: orderData.id,
          action: {
            label: 'Ver Pedido',
            url: `/restaurant/pedidos?id=${orderData.id}`
          },
          metadata: {
            customerName: orderData.customer,
            total: orderData.total,
            items: orderData.items
          }
        })
      });

      if (response.ok) {
        // Recarregar notificações para mostrar a nova
        loadNotifications();
      }
    } catch (error) {
      console.error('❌ [Notifications] Erro ao criar notificação de pedido:', error);
    }
  }, []);

  const notifyOrderStatusChange = useCallback((orderId: string, status: string, customerName?: string) => {
    const statusMessages = {
      'pending': { text: 'Pedido pendente de confirmação', type: 'warning' as const },
      'confirmed': { text: 'Pedido confirmado pelo restaurante', type: 'info' as const },
      'preparing': { text: 'Pedido em preparo na cozinha', type: 'info' as const },
      'ready': { text: 'Pedido pronto para entrega', type: 'success' as const },
      'delivering': { text: 'Pedido saiu para entrega', type: 'info' as const },
      'delivered': { text: 'Pedido entregue com sucesso', type: 'success' as const },
      'cancelled': { text: 'Pedido foi cancelado', type: 'error' as const }
    };

    const statusInfo = statusMessages[status as keyof typeof statusMessages] || { text: status, type: 'info' as const };

    addNotification({
      title: '📦 Status do Pedido Atualizado',
      message: `Pedido #${orderId}${customerName ? ` (${customerName})` : ''} - ${statusInfo.text}`,
      type: statusInfo.type,
      action: {
        label: 'Ver Detalhes',
        onClick: () => window.location.href = `/restaurant/pedidos?id=${orderId}`
      }
    });
  }, [addNotification]);

  const notifyPaymentReceived = useCallback((orderId: string, amount: number, method: string) => {
    addNotification({
      title: '💰 Pagamento Recebido',
      message: `Pedido #${orderId} - Pagamento de R$ ${amount.toFixed(2)} via ${method}`,
      type: 'success'
    });
  }, [addNotification]);

  const notifyCustomerRating = useCallback((orderId: string, rating: number, comment?: string) => {
    addNotification({
      title: `⭐ Nova Avaliação (${rating}/5)`,
      message: `Pedido #${orderId} - ${comment || 'Cliente avaliou seu pedido'}`,
      type: rating >= 4 ? 'success' : rating >= 3 ? 'info' : 'warning'
    });
  }, [addNotification]);

  const notifyDeliveryUpdate = useCallback((orderId: string, driverName: string, status: string) => {
    const statusMessages = {
      'assigned': `Entregador ${driverName} foi designado`,
      'picked_up': `${driverName} coletou o pedido`,
      'on_way': `${driverName} está a caminho do cliente`,
      'delivered': `${driverName} entregou o pedido`
    };

    addNotification({
      title: '🚚 Atualização de Entrega',
      message: `Pedido #${orderId} - ${statusMessages[status as keyof typeof statusMessages] || status}`,
      type: 'info'
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
      title: '⚙️ Atualização do Sistema',
      message,
      type: 'system'
    });
  }, [addNotification]);

  const notifyRestaurantStatusChange = useCallback(async (isOpen: boolean) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          title: isOpen ? '🟢 Restaurante Aberto' : '🔴 Restaurante Fechado',
          message: isOpen 
            ? 'Seu restaurante está agora recebendo pedidos' 
            : 'Seu restaurante parou de receber pedidos',
          type: isOpen ? 'success' : 'warning',
          priority: 'normal',
          metadata: {
            restaurantStatus: isOpen ? 'open' : 'closed',
            timestamp: new Date().toISOString()
          }
        })
      });

      if (response.ok) {
        // Recarregar notificações para mostrar a nova
        loadNotifications();
      }
    } catch (error) {
      console.error('❌ [Notifications] Erro ao criar notificação de status:', error);
    }
  }, []);

  const notifyMenuItemUpdate = useCallback((itemName: string, action: 'added' | 'updated' | 'removed') => {
    const actions = {
      'added': { text: 'adicionado ao', emoji: '➕' },
      'updated': { text: 'atualizado no', emoji: '✏️' },
      'removed': { text: 'removido do', emoji: '🗑️' }
    };
    
    const actionInfo = actions[action];
    
    addNotification({
      title: `${actionInfo.emoji} Menu Atualizado`,
      message: `${itemName} foi ${actionInfo.text} cardápio`,
      type: action === 'removed' ? 'warning' : 'info'
    });
  }, [addNotification]);

  const notifyPromotion = useCallback((title: string, description: string) => {
    addNotification({
      title: `🎉 ${title}`,
      message: description,
      type: 'info'
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
    // Métodos específicos para diferentes eventos
    notifyNewOrder,
    notifyOrderStatusChange,
    notifyPaymentReceived,
    notifyCustomerRating,
    notifyDeliveryUpdate,
    notifyLowStock,
    notifySystemUpdate,
    notifyRestaurantStatusChange,
    notifyMenuItemUpdate,
    notifyPromotion
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