// src/hooks/useConnectivity.ts
import { useEffect, useState, useCallback } from 'react';
// CORREÇÃO: A importação agora é nomeada (com chaves)
import { useAuthStore } from '@/store/auth.store';
import { useNotification } from './useNotification';

const useConnectivity = () => {
  // ... (o restante do arquivo permanece exatamente o mesmo)
  const [isOnline, setIsOnline] = useState(true);
  const { user } = useAuthStore(); // O uso do hook já estava correto
  const { showNotification } = useNotification();

  const updateOnlineStatus = useCallback(() => {
    const online = navigator.onLine;
    if (online !== isOnline) {
      setIsOnline(online);
      
      if (user) {
        const message = online 
          ? 'Sua conexão com a internet foi reestabelecida.'
          : 'Parece que você perdeu a conexão. Algumas funcionalidades podem não estar disponíveis.';
        
        showNotification(message, online ? 'success' : 'warning');
      }
    }
  }, [isOnline, showNotification, user]);

  useEffect(() => {
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, [updateOnlineStatus]);

  return { isOnline };
};

export default useConnectivity;