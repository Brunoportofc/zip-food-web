// src/components/ConnectivityStatus.tsx
import React from 'react';
// CORREÇÃO: A importação agora é default (sem chaves)
import useConnectivity from '@/hooks/useConnectivity';

interface ConnectivityStatusProps {
  className?: string;
}

const ConnectivityStatus: React.FC<ConnectivityStatusProps> = ({ className }) => {
  const { isOnline } = useConnectivity();

  if (isOnline) {
    return null; // Não renderiza nada se estiver online
  }

  return (
    <div className={`fixed bottom-0 left-0 right-0 bg-yellow-500 text-black text-center p-2 z-50 ${className}`}>
      Você está offline. Algumas funcionalidades podem não estar disponíveis.
    </div>
  );
};

export default ConnectivityStatus;