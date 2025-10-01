import { useState, useCallback } from 'react';

type NotificationType = 'success' | 'error' | 'warning' | 'info';

interface Notification {
  id: string;
  message: string;
  type: NotificationType;
  duration?: number;
}

/**
 * Hook personalizado para gerenciar notificações na aplicação
 */
export function useNotification() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Removida a dependência circular com useConnectivity

  /**
   * Remove uma notificação pelo ID
   * @param id ID da notificação
   */
  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  /**
   * Exibe uma nova notificação
   * @param message Mensagem da notificação
   * @param type Tipo da notificação
   * @param duration Duração em milissegundos (0 = permanente)
   */
  const showNotification = useCallback((message: string, type: NotificationType = 'info', duration: number = 3000) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newNotification: Notification = { id, message, type, duration };
    
    setNotifications(prev => [...prev, newNotification]);
    
    // Remove a notificação após o tempo especificado
    if (duration > 0) {
      setTimeout(() => {
        dismissNotification(id);
      }, duration);
    }
    
    return id;
  }, [dismissNotification]);

  /**
   * Remove todas as notificações
   */
  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    notifications,
    showNotification,
    dismissNotification,
    clearAllNotifications
  };
}
