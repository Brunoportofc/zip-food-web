import React, { useEffect, useState } from 'react';
import { useNotification } from '@/hooks/useNotification';
import { 
  MdCheck, 
  MdError, 
  MdWarning, 
  MdInfo, 
  MdClose,
  MdNotifications,
  MdRestaurant,
  MdShoppingCart,
  MdDeliveryDining
} from 'react-icons/md';

interface NotificationSystemProps {
  className?: string;
}

const NotificationSystem: React.FC<NotificationSystemProps> = ({ className }) => {
  const { notifications, dismissNotification } = useNotification();
  const [animatingOut, setAnimatingOut] = useState<string[]>([]);

  const handleDismiss = (id: string) => {
    setAnimatingOut(prev => [...prev, id]);
    setTimeout(() => {
      dismissNotification(id);
      setAnimatingOut(prev => prev.filter(animId => animId !== id));
    }, 300);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <MdCheck size={20} />;
      case 'error':
        return <MdError size={20} />;
      case 'warning':
        return <MdWarning size={20} />;
      case 'info':
        return <MdInfo size={20} />;
      default:
        return <MdNotifications size={20} />;
    }
  };

  const getNotificationStyles = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-gradient-to-r from-green-500 to-green-600 text-white border-green-400';
      case 'error':
        return 'bg-gradient-to-r from-red-500 to-red-600 text-white border-red-400';
      case 'warning':
        return 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white border-yellow-400';
      case 'info':
        return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white border-blue-400';
      default:
        return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white border-gray-400';
    }
  };

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className={`fixed top-20 right-4 z-50 flex flex-col gap-3 ${className}`}>
      {notifications.map((notification) => {
        const isAnimatingOut = animatingOut.includes(notification.id);
        
        return (
          <div 
            key={notification.id}
            className={`
              transform transition-all duration-300 ease-in-out
              ${isAnimatingOut ? 'translate-x-full opacity-0 scale-95' : 'translate-x-0 opacity-100 scale-100'}
              ${!isAnimatingOut ? 'animate-slide-in-right' : ''}
            `}
          >
            <div 
              className={`
                ${getNotificationStyles(notification.type)}
                p-4 rounded-2xl shadow-2xl min-w-[350px] max-w-md border-2
                backdrop-blur-sm hover:shadow-3xl transition-all duration-200
              `}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm leading-relaxed">
                      {notification.message}
                    </p>
                    <p className="text-xs opacity-90 mt-1">
                      {new Date().toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => handleDismiss(notification.id)}
                  className="flex-shrink-0 ml-3 p-1 rounded-full hover:bg-white/20 transition-colors"
                >
                  <MdClose size={16} />
                </button>
              </div>
              
              {/* Barra de progresso para notificações temporárias */}
              {notification.duration && notification.duration > 0 && (
                <div className="mt-3 h-1 bg-white/20 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-white/60 rounded-full animate-progress"
                    style={{
                      animationDuration: `${notification.duration}ms`,
                      animationTimingFunction: 'linear'
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default NotificationSystem;

// Adicionar estilos CSS personalizados
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slide-in-right {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    
    @keyframes progress {
      from {
        width: 100%;
      }
      to {
        width: 0%;
      }
    }
    
    .animate-slide-in-right {
      animation: slide-in-right 0.3s ease-out;
    }
    
    .animate-progress {
      animation: progress linear;
    }
    
    .shadow-3xl {
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    }
  `;
  document.head.appendChild(style);
}