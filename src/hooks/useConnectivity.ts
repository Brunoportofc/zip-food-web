import { useEffect, useState, useCallback } from 'react';
import useAuthStore from '@/store/auth.store';
import { useNotification } from './useNotification';


/**
 * Hook personalizado para gerenciar o estado de conectividade
 * Fornece informações sobre o estado online/offline básico
 */
export function useConnectivity() {

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
        showNotification('Conectado', 'success');
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setOfflineMode(true);
      showNotification('Desconectado', 'warning');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isForceOffline, setOfflineMode, showNotification]);

  const toggleOfflineMode = useCallback(async () => {
    const newOfflineState = !isForceOffline;
    setIsForceOffline(newOfflineState);
    setOfflineMode(newOfflineState);
    
    if (newOfflineState) {
      showNotification('Modo offline ativado', 'info');
    } else {
      showNotification('Modo offline desativado', 'info');
    }
  }, [isForceOffline, setOfflineMode, showNotification]);

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