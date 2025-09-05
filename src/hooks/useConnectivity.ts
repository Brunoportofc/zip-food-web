import { useEffect, useState, useCallback } from 'react';
import useAuthStore from '@/store/auth.store';
import { useNotification } from './useNotification';
import { useTranslation } from 'react-i18next';

/**
 * Hook personalizado para gerenciar o estado de conectividade
 * Fornece informações sobre o estado online/offline básico
 */
export function useConnectivity() {
  const { t } = useTranslation();
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [isForceOffline, setIsForceOffline] = useState<boolean>(false);
  const { isAuthenticated, setOfflineMode, isOfflineMode } = useAuthStore();
  const { showNotification } = useNotification();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      setIsOnline(true);
      if (!isForceOffline) {
        setOfflineMode(false);
        showNotification(t('common.backOnline') || 'Conectado', 'success');
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setOfflineMode(true);
      showNotification(t('common.offline') || 'Desconectado', 'warning');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isForceOffline, setOfflineMode, showNotification, t]);

  const toggleOfflineMode = useCallback(async () => {
    const newOfflineState = !isForceOffline;
    setIsForceOffline(newOfflineState);
    setOfflineMode(newOfflineState);
    
    if (newOfflineState) {
      showNotification(t('common.offlineModeEnabled') || 'Modo offline ativado', 'info');
    } else {
      showNotification(t('common.offlineModeDisabled') || 'Modo offline desativado', 'info');
    }
  }, [isForceOffline, setOfflineMode, showNotification, t]);

  return {
    isOnline: isOnline && !isForceOffline,
    isOffline: !isOnline || isForceOffline,
    isFirebaseConnected: true, // Sempre true para compatibilidade
    isOfflineMode,
    toggleOfflineMode,
    enableOfflineMode: () => toggleOfflineMode(),
    disableOfflineMode: () => toggleOfflineMode()
  };
}