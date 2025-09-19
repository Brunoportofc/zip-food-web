'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import dynamic from 'next/dynamic';

// Importação dinâmica do AlertSystem
const AlertSystem = dynamic(() => import('@/components/AlertSystem'), {
  ssr: false
});

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  // Comentado o redirecionamento automático para permitir logout/troca de conta
  // useEffect(() => {
  //   if (isAuthenticated) {
  //     const { userType } = useAuthStore.getState();
  //     switch (userType) {
  //       case 'restaurant':
  //         router.push('/restaurant');
  //         break;
  //       case 'delivery':
  //         router.push('/delivery');
  //         break;
  //       default:
  //         router.push('/customer');
  //         break;
  //     }
  //   }
  // }, [isAuthenticated, router]);

  // Permite acesso às páginas de auth mesmo se autenticado (para logout/troca de conta)
  // if (isAuthenticated) return null;

  return (
    <div className="flex-1">
      <div className="bg-black min-h-screen overflow-auto">
        {children}
      </div>
      {/* Sistema de Alertas */}
      <AlertSystem />
    </div>
  );
}