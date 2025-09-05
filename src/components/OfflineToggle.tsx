import React from 'react';
import { useTranslation } from 'react-i18next';
import { useConnectivity } from '@/hooks/useConnectivity';

interface OfflineToggleProps {
  className?: string;
}

const OfflineToggle: React.FC<OfflineToggleProps> = ({ className }) => {
  const { t } = useTranslation();
  const { isOfflineMode, isFirebaseConnected, enableOfflineMode, disableOfflineMode } = useConnectivity();

  // Funcionalidade de alternância removida - componente apenas para exibição de status

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
    <div
      className={`flex items-center px-4 py-2 rounded-md ${getButtonStyle()} text-white ${className}`}
      title={isOfflineMode ? t('common.offlineMode') : t('common.onlineMode')}
    >
      {isOfflineMode ? (
        <>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          {t('common.offline')}
        </>
      ) : (
        <>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {t('common.online')}
        </>
      )}
      
      {/* Indicador de status do Firebase */}
      {!isOfflineMode && !isFirebaseConnected && (
        <span className="ml-2 h-2 w-2 rounded-full bg-red-500 animate-pulse" title={t('common.firebaseDisconnected')}></span>
      )}
    </div>
  );
};

export default OfflineToggle;