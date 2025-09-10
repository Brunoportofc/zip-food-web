'use client';

import React, { useState, useEffect } from 'react';

import AnimatedContainer from './AnimatedContainer';
import { 
  MdCheck, 
  MdError, 
  MdWarning, 
  MdInfo,
  MdClose,
  MdCheckCircle,
  MdCancel,
  MdHelpOutline
} from 'react-icons/md';

export interface Alert {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'confirm';
  duration?: number; // em milissegundos, 0 = permanente
  actions?: {
    primary?: {
      label: string;
      onClick: () => void;
    };
    secondary?: {
      label: string;
      onClick: () => void;
    };
  };
  onClose?: () => void;
}

interface AlertSystemProps {
  className?: string;
}

const AlertSystem: React.FC<AlertSystemProps> = ({ className }) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);

  // Função para adicionar um novo alerta
  const addAlert = (alert: Omit<Alert, 'id'>) => {
    const newAlert: Alert = {
      ...alert,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
    };

    setAlerts(prev => [...prev, newAlert]);

    // Auto-remover após o tempo especificado
    if (alert.duration && alert.duration > 0) {
      setTimeout(() => {
        removeAlert(newAlert.id);
      }, alert.duration);
    }
  };

  // Função para remover um alerta
  const removeAlert = (id: string) => {
    setAlerts(prev => {
      const alert = prev.find(a => a.id === id);
      if (alert?.onClose) {
        alert.onClose();
      }
      return prev.filter(a => a.id !== id);
    });
  };

  // Expor funções globalmente para uso em outros componentes
  useEffect(() => {
    (window as any).showAlert = addAlert;
    (window as any).hideAlert = removeAlert;
    
    return () => {
      delete (window as any).showAlert;
      delete (window as any).hideAlert;
    };
  }, []);

  const getAlertStyles = (type: string) => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-50 border-green-200',
          icon: 'text-green-600',
          title: 'text-green-800',
          message: 'text-green-700',
          button: 'bg-green-600 hover:bg-green-700 text-white'
        };
      case 'error':
        return {
          bg: 'bg-red-50 border-red-200',
          icon: 'text-red-600',
          title: 'text-red-800',
          message: 'text-red-700',
          button: 'bg-red-600 hover:bg-red-700 text-white'
        };
      case 'warning':
        return {
          bg: 'bg-yellow-50 border-yellow-200',
          icon: 'text-yellow-600',
          title: 'text-yellow-800',
          message: 'text-yellow-700',
          button: 'bg-yellow-600 hover:bg-yellow-700 text-white'
        };
      case 'info':
        return {
          bg: 'bg-blue-50 border-blue-200',
          icon: 'text-blue-600',
          title: 'text-blue-800',
          message: 'text-blue-700',
          button: 'bg-blue-600 hover:bg-blue-700 text-white'
        };
      case 'confirm':
        return {
          bg: 'bg-gray-50 border-gray-200',
          icon: 'text-gray-600',
          title: 'text-gray-800',
          message: 'text-gray-700',
          button: 'bg-gray-600 hover:bg-gray-700 text-white'
        };
      default:
        return {
          bg: 'bg-gray-50 border-gray-200',
          icon: 'text-gray-600',
          title: 'text-gray-800',
          message: 'text-gray-700',
          button: 'bg-gray-600 hover:bg-gray-700 text-white'
        };
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <MdCheckCircle size={24} />;
      case 'error':
        return <MdCancel size={24} />;
      case 'warning':
        return <MdWarning size={24} />;
      case 'info':
        return <MdInfo size={24} />;
      case 'confirm':
        return <MdHelpOutline size={24} />;
      default:
        return <MdInfo size={24} />;
    }
  };

  if (alerts.length === 0) return null;

  return (
    <div className={`fixed top-4 right-4 z-50 space-y-3 ${className}`}>
      {alerts.map((alert, index) => {
        const styles = getAlertStyles(alert.type);
        
        return (
          <AnimatedContainer 
            key={alert.id} 
            animationType="slideIn" 
            delay={index * 100}
          >
            <div className={`
              max-w-md w-full p-4 rounded-xl border-2 shadow-lg backdrop-blur-sm
              ${styles.bg}
            `}>
              <div className="flex items-start space-x-3">
                <div className={`flex-shrink-0 ${styles.icon}`}>
                  {getAlertIcon(alert.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className={`font-semibold text-sm ${styles.title}`}>
                    {alert.title}
                  </h4>
                  <p className={`text-sm mt-1 ${styles.message}`}>
                    {alert.message}
                  </p>
                  
                  {/* Botões de Ação */}
                  {alert.actions && (
                    <div className="flex items-center space-x-2 mt-3">
                      {alert.actions.primary && (
                        <button
                          onClick={() => {
                            alert.actions!.primary!.onClick();
                            removeAlert(alert.id);
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            styles.button
                          }`}
                        >
                          {alert.actions.primary.label}
                        </button>
                      )}
                      
                      {alert.actions.secondary && (
                        <button
                          onClick={() => {
                            alert.actions!.secondary!.onClick();
                            removeAlert(alert.id);
                          }}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-200 hover:bg-gray-300 text-gray-700 transition-colors"
                        >
                          {alert.actions.secondary.label}
                        </button>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Botão de Fechar */}
                <button
                  onClick={() => removeAlert(alert.id)}
                  className={`flex-shrink-0 p-1 rounded-lg hover:bg-black/10 transition-colors ${styles.icon}`}
                >
                  <MdClose size={16} />
                </button>
              </div>
              
              {/* Barra de Progresso para alertas temporários */}
              {alert.duration && alert.duration > 0 && (
                <div className="mt-3 h-1 bg-black/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-current opacity-50 animate-progress"
                    style={{
                      animationDuration: `${alert.duration}ms`
                    }}
                  />
                </div>
              )}
            </div>
          </AnimatedContainer>
        );
      })}
      
      <style jsx>{`
        @keyframes progress {
          from { width: 100%; }
          to { width: 0%; }
        }
        
        .animate-progress {
          animation: progress linear forwards;
        }
      `}</style>
    </div>
  );
};

// Funções utilitárias para mostrar alertas específicos
export const showSuccessAlert = (title: string, message: string, duration = 5000) => {
  if (typeof window !== 'undefined' && (window as any).showAlert) {
    (window as any).showAlert({
      title,
      message,
      type: 'success',
      duration
    });
  }
};

export const showErrorAlert = (title: string, message: string, duration = 0) => {
  if (typeof window !== 'undefined' && (window as any).showAlert) {
    (window as any).showAlert({
      title,
      message,
      type: 'error',
      duration
    });
  }
};

export const showWarningAlert = (title: string, message: string, duration = 8000) => {
  if (typeof window !== 'undefined' && (window as any).showAlert) {
    (window as any).showAlert({
      title,
      message,
      type: 'warning',
      duration
    });
  }
};

export const showInfoAlert = (title: string, message: string, duration = 6000) => {
  if (typeof window !== 'undefined' && (window as any).showAlert) {
    (window as any).showAlert({
      title,
      message,
      type: 'info',
      duration
    });
  }
};

export const showConfirmAlert = (
  title: string, 
  message: string, 
  onConfirm: () => void, 
  onCancel?: () => void,
  t?: (key: string) => string
) => {
  if (typeof window !== 'undefined' && (window as any).showAlert) {
    (window as any).showAlert({
      title,
      message,
      type: 'confirm',
      duration: 0,
      actions: {
        primary: {
          label: 'Confirmar',
          onClick: onConfirm
        },
        secondary: {
          label: 'Cancelar',
          onClick: onCancel || (() => {})
        }
      }
    });
  }
};

export default AlertSystem;