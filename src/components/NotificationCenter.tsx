'use client';

import React, { useState } from 'react';
import AnimatedContainer from './AnimatedContainer';
import useRealTimeNotifications from '@/hooks/useRealTimeNotifications';
import '@/styles/notifications.css';
import { 
  MdNotifications, 
  MdClose, 
  MdCheck, 
  MdError, 
  MdWarning, 
  MdInfo,
  MdRestaurant,
  MdShoppingCart,
  MdDeliveryDining,
  MdSettings,
  MdTrendingUp,
  MdAccessTime,
  MdClear
} from 'react-icons/md';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ 
  isOpen, 
  onClose, 
  className 
}) => {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications
  } = useRealTimeNotifications();

  const [filter, setFilter] = useState<'all' | 'unread' | 'order' | 'system'>('all');

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <MdCheck size={20} className="text-green-600" />;
      case 'error':
        return <MdError size={20} className="text-red-600" />;
      case 'warning':
        return <MdWarning size={20} className="text-yellow-600" />;
      case 'info':
        return <MdInfo size={20} className="text-blue-600" />;
      case 'order':
        return <MdShoppingCart size={20} className="text-red-600" />;
      case 'system':
        return <MdSettings size={20} className="text-gray-600" />;
      default:
        return <MdNotifications size={20} className="text-gray-600" />;
    }
  };

  const getNotificationBg = (type: string, read: boolean) => {
    const opacity = read ? 'bg-opacity-50' : 'bg-opacity-100';
    switch (type) {
      case 'success':
        return `bg-green-50 border-green-200 ${opacity}`;
      case 'error':
        return `bg-red-50 border-red-200 ${opacity}`;
      case 'warning':
        return `bg-yellow-50 border-yellow-200 ${opacity}`;
      case 'info':
        return `bg-blue-50 border-blue-200 ${opacity}`;
      case 'order':
        return `bg-red-50 border-red-200 ${opacity}`;
      case 'system':
        return `bg-gray-50 border-gray-200 ${opacity}`;
      default:
        return `bg-gray-50 border-gray-200 ${opacity}`;
    }
  };



  const filteredNotifications = notifications.filter(notif => {
    switch (filter) {
      case 'unread':
        return !notif.read;
      case 'order':
        return notif.type === 'order';
      case 'system':
        return notif.type === 'system';
      default:
        return true;
    }
  });



  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Agora';
    if (minutes < 60) return `${minutes}m atrás`;
    if (hours < 24) return `${hours}h atrás`;
    return `${days}d atrás`;
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay com blur e animação suave */}
      <div 
        className={`notification-overlay fixed inset-0 z-40 ${
          isOpen 
            ? 'backdrop-blur-sm bg-black/30 opacity-100' 
            : 'backdrop-blur-0 bg-black/0 opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />
      
      {/* Notification Panel com animação lateral suave */}
      <div className={`notification-panel fixed top-0 right-0 h-full w-96 bg-white shadow-2xl z-50 flex flex-col transform ${
        isOpen 
          ? 'translate-x-0 opacity-100' 
          : 'translate-x-full opacity-0'
      } ${className}`}>
          {/* Header */}
          <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <MdNotifications size={24} />
                <h2 className="text-xl font-bold">Notificações</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <MdClose size={20} />
              </button>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-red-100 text-sm">
                {unreadCount > 0 ? (
                  `${unreadCount} não lida${unreadCount !== 1 ? 's' : ''}`
                ) : (
                  `${notifications.length} notificação${notifications.length !== 1 ? 'ões' : ''}`
                )}
              </span>
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-red-100 hover:text-white text-xs underline"
                  >
                    Marcar todas como lidas
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    onClick={clearAllNotifications}
                    className="text-red-100 hover:text-white text-xs underline flex items-center space-x-1"
                  >
                    <MdClear size={14} />
                    <span>Limpar todas</span>
                  </button>
                )}
                {/* Botão temporário para debug */}
                <button
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/notifications/cleanup', {
                        method: 'POST',
                        credentials: 'include'
                      });
                      if (response.ok) {
                        const data = await response.json();
                        console.log('🔧 [Debug] Limpeza realizada:', data);
                        window.location.reload();
                      }
                    } catch (error) {
                      console.error('Erro na limpeza:', error);
                    }
                  }}
                  className="text-red-100 hover:text-white text-xs underline"
                >
                  🔧 Debug
                </button>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex space-x-2">
              {[
                { key: 'all', label: 'Todas', icon: MdNotifications },
                { key: 'unread', label: 'Não lidas', icon: MdTrendingUp },
                { key: 'order', label: 'Pedidos', icon: MdShoppingCart },
                { key: 'system', label: 'Sistema', icon: MdSettings }
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setFilter(key as any)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center space-x-1 ${
                    filter === key
                      ? 'bg-red-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Icon size={14} />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto">
            {filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <MdNotifications size={48} className="mb-4 opacity-50" />
                <p className="text-center">
                  {filter === 'unread' ? 'Nenhuma notificação não lida' : 'Nenhuma notificação'}
                </p>
              </div>
            ) : (
              <div className="p-4 space-y-3">
                {filteredNotifications.map((notification, index) => (
                  <div
                    key={notification.id}
                    className={`notification-item p-4 rounded-xl border-2 cursor-pointer transform ${
                      getNotificationBg(notification.type, notification.read)
                    } ${!notification.read ? 'ring-2 ring-red-200 notification-unread' : 'notification-read'}`}
                    style={{
                      animationDelay: `${index * 50}ms`
                    }}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className={`font-semibold text-sm ${
                              notification.read ? 'text-gray-600' : 'text-gray-900'
                            }`}>
                              {notification.title}
                            </h4>
                            <span className="text-xs text-gray-500 ml-2">
                              {formatTimestamp(notification.timestamp)}
                            </span>
                          </div>
                          <p className={`text-sm mt-1 ${
                            notification.read ? 'text-gray-500' : 'text-gray-700'
                          }`}>
                            {notification.message}
                          </p>
                          
                          {notification.action && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                notification.action!.onClick();
                              }}
                              className="mt-2 text-red-600 hover:text-red-700 text-sm font-medium"
                            >
                              {notification.action.label}
                            </button>
                          )}
                        </div>
                      </div>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification.id);
                        }}
                        className="ml-2 p-1 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <MdClose size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
    </>
  );
};

export default NotificationCenter;