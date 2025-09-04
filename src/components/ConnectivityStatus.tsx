import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useConnectivity } from '../hooks/useConnectivity';

interface ConnectivityStatusProps {
  className?: string;
}

const ConnectivityStatus: React.FC<ConnectivityStatusProps> = ({ className }) => {
  const { t } = useTranslation();
  const { isOnline, isOfflineMode, isFirebaseConnected } = useConnectivity();
  const [showSyncNotification, setShowSyncNotification] = useState(false);

  // Efeito para mostrar notificação de sincronização quando voltar ao modo online
  useEffect(() => {
    if (isOnline && !isOfflineMode && isFirebaseConnected) {
      setShowSyncNotification(true);
      const timer = setTimeout(() => {
        setShowSyncNotification(false);
      }, 3000); // Mostra a notificação por 3 segundos
      
      return () => clearTimeout(timer);
    }
  }, [isOnline, isOfflineMode, isFirebaseConnected]);

  return (
    <>
      {/* Notificação de sincronização */}
      {showSyncNotification && (
        <div className={`fixed top-4 right-4 bg-red-400 text-white p-3 rounded-md shadow-lg z-50 transition-opacity duration-300 ${className}`}>
          <span className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {t('common.syncComplete')}
          </span>
        </div>
      )}

      {/* Banner de modo offline */}
      {!isOnline && (
        <div className={`bg-yellow-500 text-white px-4 py-2 text-center ${className}`}>
          <span className="flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            {t('common.offlineMode')}
          </span>
        </div>
      )}
      
      {/* Banner de desconexão do Firebase */}
      {isOnline && !isFirebaseConnected && (
        <div className={`bg-orange-500 text-white px-4 py-2 text-center ${className}`}>
          <span className="flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {t('common.firebaseDisconnected')}
          </span>
        </div>
      )}
    </>
  );
};

export default ConnectivityStatus;