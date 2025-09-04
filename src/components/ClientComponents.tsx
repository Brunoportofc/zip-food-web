'use client';

import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { preloadSecondaryComponents } from './LazyComponents';

// Importar componentes com carregamento dinâmico otimizado
const ConnectivityStatus = dynamic(
  () => import('@/components/ConnectivityStatus'),
  { 
    ssr: false,
    loading: () => null // Sem loading para não afetar UX
  }
);

const NotificationSystem = dynamic(
  () => import('@/components/NotificationSystem'),
  { 
    ssr: false,
    loading: () => null
  }
);

interface ClientComponentsProps {
  className?: string;
}

const ClientComponents: React.FC<ClientComponentsProps> = ({ className }) => {
  useEffect(() => {
    // Preload componentes secundários após o componente montar
    preloadSecondaryComponents();
  }, []);
  
  return (
    <>
      <ConnectivityStatus className={`sticky top-0 z-50 ${className}`} />
      <NotificationSystem />
    </>
  );
};

export default ClientComponents;