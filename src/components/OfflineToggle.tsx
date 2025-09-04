import React from 'react';
import { useTranslation } from 'react-i18next';
import { useConnectivity } from '../hooks/useConnectivity';

interface OfflineToggleProps {
  className?: string;
}

const OfflineToggle: React.FC<OfflineToggleProps> = ({ className }) => {
  const { t } = useTranslation();
  const { isOfflineMode, isFirebaseConnected, enableOfflineMode, disableOfflineMode } = useConnectivity();

  const handleToggle = async () => {
    try {
      if (isOfflineMode) {
        await disableOfflineMode();
      } else {
        await enableOfflineMode();
      }
    } catch (error) {
      console.error('Erro ao alternar modo offline:', error);
    }
  };

  // Determina o estado do botão com base na conectividade
  const getButtonStyle = () => {
    if (isOfflineMode) {
      return 'bg-yellow-500 hover:bg-yellow-600';
    } else if (!isFirebaseConnected) {
      return 'bg-orange-500 hover:bg-orange-600';
    } else {
      return 'bg-red-400 hover:bg-red-500';
    }
  };

  return (
    <button
      onClick={handleToggle}
      className={`flex items-center px-4 py-2 rounded-md ${getButtonStyle()} text-white transition-colors ${className}`}
      disabled={!navigator.onLine && !isOfflineMode}
      title={!navigator.onLine && !isOfflineMode ? t('common.cannotReconnectOffline') : ''}
    >
      {isOfflineMode ? (
        <>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
          </svg>
          {t('common.goOnline')}
        </>
      ) : (
        <>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
          {t('common.goOffline')}
        </>
      )}
      
      {/* Indicador de status do Firebase */}
      {!isOfflineMode && !isFirebaseConnected && (
        <span className="ml-2 h-2 w-2 rounded-full bg-red-500 animate-pulse" title={t('common.firebaseDisconnected')}></span>
      )}
    </button>
  );
};

export default OfflineToggle;