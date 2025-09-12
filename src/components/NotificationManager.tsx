'use client';

import React, { useState, useEffect } from 'react';
import { MdNotifications, MdNotificationsOff, MdSettings } from 'react-icons/md';
import { notificationService } from '@/services/notification.service';

interface NotificationManagerProps {
  userId: string;
  className?: string;
}

interface NotificationSettings {
  orderUpdates: boolean;
  promotions: boolean;
  deliveryUpdates: boolean;
  systemNotifications: boolean;
}

const NotificationManager: React.FC<NotificationManagerProps> = ({ userId, className = '' }) => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [permission, setPermission] = useState<'granted' | 'denied' | 'default'>('default');
  const [settings, setSettings] = useState<NotificationSettings>({
    orderUpdates: true,
    promotions: true,
    deliveryUpdates: true,
    systemNotifications: false
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkSubscriptionStatus();
    checkPermissionStatus();
  }, [userId]);

  const checkPermissionStatus = async () => {
    const permissionStatus = await notificationService.checkNotificationPermission();
    if (permissionStatus.granted) {
      setPermission('granted');
    } else if (permissionStatus.denied) {
      setPermission('denied');
    } else {
      setPermission('default');
    }
  };

  const checkSubscriptionStatus = async () => {
    try {
      const response = await fetch(`/api/notifications/subscribe?userId=${userId}`);
      const data = await response.json();
      setIsSubscribed(data.subscribed);
    } catch (error) {
      console.error('Erro ao verificar status da subscription:', error);
    }
  };

  const handleSubscribe = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Solicitar permissão
      const hasPermission = await notificationService.requestNotificationPermission();
      
      if (!hasPermission) {
        setError('Permissão de notificação negada. Ative nas configurações do navegador.');
        setPermission('denied');
        return;
      }

      setPermission('granted');

      // Subscrever para push notifications
      const subscription = await notificationService.subscribeToPushNotifications(userId);
      
      if (subscription) {
        setIsSubscribed(true);
        
        // Mostrar notificação de sucesso
        await notificationService.showNotification({
          type: 'system',
          title: 'Notificações Ativadas! 🔔',
          message: 'Você receberá atualizações sobre seus pedidos em tempo real.',
          data: { type: 'activation_success' },
          timestamp: Date.now(),
          priority: 'normal'
        });
      } else {
        setError('Erro ao ativar notificações. Tente novamente.');
      }
    } catch (error) {
      console.error('Erro ao subscrever:', error);
      setError('Erro ao ativar notificações. Verifique sua conexão.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/notifications/subscribe', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId })
      });

      if (response.ok) {
        setIsSubscribed(false);
      } else {
        setError('Erro ao desativar notificações.');
      }
    } catch (error) {
      console.error('Erro ao desinscrever:', error);
      setError('Erro ao desativar notificações.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSettingsChange = (key: keyof NotificationSettings, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
    
    // Aqui você salvaria as configurações no backend
    saveNotificationSettings(key, value);
  };

  const saveNotificationSettings = async (key: string, value: boolean) => {
    try {
      await fetch('/api/user/notification-settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          setting: key,
          enabled: value
        })
      });
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
    }
  };

  const testNotification = async () => {
    try {
      await notificationService.showNotification({
        type: 'system',
        title: 'Notificação de Teste 🧪',
        message: 'Esta é uma notificação de teste para verificar se tudo está funcionando!',
        data: { type: 'test' },
        timestamp: Date.now(),
        priority: 'normal'
      });
    } catch (error) {
      console.error('Erro ao enviar notificação de teste:', error);
      setError('Erro ao enviar notificação de teste.');
    }
  };

  if (permission === 'denied') {
    return (
      <div className={`bg-yellow-50 border border-yellow-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center space-x-3">
          <MdNotificationsOff className="text-yellow-600 text-xl" />
          <div>
            <h3 className="text-sm font-medium text-yellow-800">
              Notificações Bloqueadas
            </h3>
            <p className="text-xs text-yellow-700 mt-1">
              Ative as notificações nas configurações do seu navegador para receber atualizações em tempo real.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {isSubscribed ? (
            <MdNotifications className="text-green-600 text-xl" />
          ) : (
            <MdNotificationsOff className="text-gray-400 text-xl" />
          )}
          <div>
            <h3 className="text-sm font-medium text-gray-900">
              {isSubscribed ? 'Notificações Ativadas' : 'Notificações Desativadas'}
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              {isSubscribed 
                ? 'Você receberá atualizações sobre seus pedidos'
                : 'Ative para receber atualizações em tempo real'
              }
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {isSubscribed && (
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              title="Configurações"
            >
              <MdSettings className="text-lg" />
            </button>
          )}
          
          <button
            onClick={isSubscribed ? handleUnsubscribe : handleSubscribe}
            disabled={isLoading}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              isSubscribed
                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <span>Processando...</span>
              </div>
            ) : (
              isSubscribed ? 'Desativar' : 'Ativar'
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
          <button
            onClick={() => setError(null)}
            className="mt-2 text-xs text-red-600 hover:text-red-800 underline"
          >
            Dispensar
          </button>
        </div>
      )}

      {showSettings && isSubscribed && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-900 mb-3">
            Configurações de Notificação
          </h4>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm text-gray-700">Atualizações de Pedidos</label>
                <p className="text-xs text-gray-500">Status do pedido, confirmações, entregas</p>
              </div>
              <input
                type="checkbox"
                checked={settings.orderUpdates}
                onChange={(e) => handleSettingsChange('orderUpdates', e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm text-gray-700">Promoções e Ofertas</label>
                <p className="text-xs text-gray-500">Descontos, cupons e ofertas especiais</p>
              </div>
              <input
                type="checkbox"
                checked={settings.promotions}
                onChange={(e) => handleSettingsChange('promotions', e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm text-gray-700">Atualizações de Entrega</label>
                <p className="text-xs text-gray-500">Localização do entregador, tempo estimado</p>
              </div>
              <input
                type="checkbox"
                checked={settings.deliveryUpdates}
                onChange={(e) => handleSettingsChange('deliveryUpdates', e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm text-gray-700">Notificações do Sistema</label>
                <p className="text-xs text-gray-500">Manutenções, atualizações do app</p>
              </div>
              <input
                type="checkbox"
                checked={settings.systemNotifications}
                onChange={(e) => handleSettingsChange('systemNotifications', e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="mt-4 pt-3 border-t border-gray-100">
            <button
              onClick={testNotification}
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              Enviar Notificação de Teste
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationManager;