'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';

// Removido GlobalHeader - agora cada página tem seu próprio header se necessário

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
    
    // Executar preload após um pequeno delay
    const timeoutId = setTimeout(preloadRoutesAsync, 1000);
    
    return () => clearTimeout(timeoutId);
  }, []);

  const pathname = usePathname();
  const isHomePage = pathname === '/';
  const isUserSpecificRoute = pathname.startsWith('/customer') || 
                             pathname.startsWith('/restaurant') || 
                             pathname.startsWith('/delivery');

  return (
    <>
      {/* Conteúdo principal - sem header global */}
      <div>
        {children}
      </div>
      
      <ClientComponents />
      <AuthModeToggle />
    </>
  );
}