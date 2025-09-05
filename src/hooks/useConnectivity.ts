import { useEffect, useState, useCallback } from 'react';
import { connectivityService } from '@/services/connectivity.service';
import useAuthStore from '@/store/auth.store';
import { useNotification } from './useNotification';
import { useTranslation } from 'react-i18next';

/**
 * Hook personalizado para gerenciar o estado de conectividade
 * Fornece informações sobre o estado online/offline e métodos para gerenciar a conectividade
 */
export function useConnectivity() {
  const { t } = useTranslation();
  const [isOnline, setIsOnline] = useState<boolean>(connectivityService.isOnline());
  const [isFirebaseConnected, setIsFirebaseConnected] = useState<boolean>(connectivityService.isFirebaseConnected());
  const { isAuthenticated, syncUserData, setOfflineMode, isOfflineMode } = useAuthStore();
  const { showNotification } = useNotification();

  useEffect(() => {
    // Registra callbacks para mudanças no estado de conectividade da rede
    const unregisterNetwork = connectivityService.registerConnectivityListeners(
      // Callback quando ficar online
      () => {
        setIsOnline(true);
        setOfflineMode(false);
        
        // Se estiver autenticado, sincroniza os dados do usuário
        if (isAuthenticated) {
          syncUserData().catch(console.error);
        }
      },
      // Callback quando ficar offline
      () => {
        setIsOnline(false);
        setOfflineMode(true);
      }
    );

    // Registra callback para mudanças na conexão do Firebase
    const unregisterFirebase = connectivityService.registerFirebaseConnectionListener(
      (isConnected) => {
        setIsFirebaseConnected(isConnected);
        
        if (isConnected) {
          showNotification(t('common.firebaseConnected'), 'success');
          
          // Se estiver autenticado, sincroniza os dados do usuário
          if (isAuthenticated) {
            syncUserData().catch(console.error);
          }
        } else {
          showNotification(t('common.firebaseDisconnected'), 'warning');
        }
      }
    );

    // Cleanup dos event listeners
    return () => {
      unregisterNetwork();
      unregisterFirebase();
    };
  }, [isAuthenticated]);

  /**
   * Força o modo offline
   */
  const enableOfflineMode = async () => {
    try {
      await connectivityService.enableOfflineMode();
      setIsOnline(false);
      setIsFirebaseConnected(false);
      setOfflineMode(true);
      showNotification(t('common.offlineModeEnabled'), 'info');
    } catch (error) {
      console.error('Erro ao ativar modo offline:', error);
      showNotification(t('common.offlineModeError'), 'error');
    }
  };

  /**
   * Força o modo online (se o dispositivo estiver online)
   */
  const disableOfflineMode = async () => {
    if (navigator.onLine) {
      try {
        await connectivityService.disableOfflineMode();
        setIsOnline(true);
        setOfflineMode(false);
        
        // A conexão com o Firebase será atualizada pelo listener
        showNotification(t('common.reconnecting'), 'info');
        
        // Sincroniza os dados do usuário se estiver autenticado
        if (isAuthenticated) {
          await syncUserData();
        }
      } catch (error) {
        console.error('Erro ao desativar modo offline:', error);
        showNotification(t('common.reconnectError'), 'error');
      }
    } else {
      showNotification(t('common.cannotReconnectOffline'), 'warning');
      console.warn('Não é possível desabilitar o modo offline quando o dispositivo está offline');
    }
  };

  return {
    isOnline,
    isFirebaseConnected,
    isOfflineMode,
    enableOfflineMode,
    disableOfflineMode
  };
}