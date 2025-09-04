'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { WebSafeKeyboardAvoidingView } from '@/components/WebSafeComponents';
import useAuthStore from '@/store/auth.store';

// Importar i18n para garantir que está inicializado
import '@/i18n';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  // Redireciona para a página apropriada se estiver autenticado
  useEffect(() => {
    if (isAuthenticated) {
      const { userType } = useAuthStore.getState();
      switch (userType) {
        case 'restaurant':
          router.push('/restaurant');
          break;
        case 'delivery':
          router.push('/delivery');
          break;
        default:
          router.push('/customer');
          break;
      }
    }
  }, [isAuthenticated, router]);

  // Se estiver autenticado, não renderiza nada enquanto redireciona
  if (isAuthenticated) return null;

  return (
    <WebSafeKeyboardAvoidingView className="flex-1">
      <div className="bg-black min-h-screen overflow-auto">
        {children}
      </div>
    </WebSafeKeyboardAvoidingView>
  );
}