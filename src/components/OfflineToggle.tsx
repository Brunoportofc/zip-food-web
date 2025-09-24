import React from 'react';
import useConnectivity from '@/hooks/useConnectivity';

interface OfflineToggleProps {
  className?: string;
}

const OfflineToggle: React.FC<OfflineToggleProps> = ({ className }) => {

  const { isOnline } = useConnectivity();

  // Determina o estado do botão com base na conectividade
  const getButtonStyle = () => {
    if (!isOnline) {
      return 'bg-yellow-500';
    } else {
      return 'bg-green-500';
    }
  };

  return (
    <div
      className={`flex items-center px-4 py-2 rounded-md ${getButtonStyle()} text-white transition-colors ${className}`}
      title={!isOnline ? 'Modo Offline' : 'Modo Online'}
    >
      {!isOnline ? (
        <>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          Offline
        </>
      ) : (
        <>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Online
        </>
      )}
    </div>
  );
};

export default OfflineToggle;