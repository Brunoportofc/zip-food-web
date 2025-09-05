'use client';

import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { initializeFirestoreConfig } from '@/lib/firestore-config';
import I18nClientProvider from '@/components/I18nClientProvider';

// Lazy loading para ClientComponents
const ClientComponents = dynamic(
  () => import('@/components/ClientComponents'),
  {
    ssr: false, // ClientComponents não precisa de SSR
    loading: () => null // Sem loading spinner para não afetar a experiência
  }
);

// Lazy loading para AuthModeToggle (apenas em desenvolvimento)
const AuthModeToggle = dynamic(
  () => import('@/components/dev/AuthModeToggle'),
  {
    ssr: false,
    loading: () => null
  }
);





interface ClientLayoutProps {
  children: React.ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  useEffect(() => {
    // Inicializar configurações do Firestore para desenvolvimento
    const initializeFirestore = async () => {
      try {
        await initializeFirestoreConfig();
      } catch (error) {
        console.warn('Erro ao inicializar configurações do Firestore:', error);
      }
    };
    
    // Preload de rotas críticas após montagem do componente
    const preloadRoutesAsync = async () => {
      const criticalRoutes = [
        '/auth/sign-in',
        '/customer',
        '/restaurant', 
        '/delivery'
      ];
      
      // Usar fetch com HEAD para preload no App Router
      const preloadPromises = criticalRoutes.map(async (route) => {
        try {
          await fetch(route, { method: 'HEAD' });
        } catch (error) {
          // Ignorar erros de preload
          console.debug(`Preload falhou para ${route}:`, error);
        }
      });
      
      await Promise.allSettled(preloadPromises);
    };
    
    // Executar inicialização do Firestore imediatamente
    initializeFirestore();
    
    // Executar preload após um pequeno delay
    const timeoutId = setTimeout(preloadRoutesAsync, 1000);
    
    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <I18nClientProvider>
      {children}
      <ClientComponents />
      <AuthModeToggle />
    </I18nClientProvider>
  );
}