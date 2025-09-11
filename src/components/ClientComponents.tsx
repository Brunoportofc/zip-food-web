'use client';

import dynamic from 'next/dynamic';

// Componentes dinâmicos essenciais
const ConnectivityStatus = dynamic(() => import('@/components/ConnectivityStatus'), {
  ssr: false,
  loading: () => null
});

const NotificationSystem = dynamic(() => import('@/components/NotificationSystem'), {
  ssr: false,
  loading: () => null
});

interface ClientComponentsProps {
  className?: string;
}

const ClientComponents: React.FC<ClientComponentsProps> = ({ className }) => {
  return (
    <>
      <ConnectivityStatus className={className} />
      <NotificationSystem />
    </>
  );
};

export default ClientComponents;