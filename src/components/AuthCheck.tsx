// src/components/AuthCheck.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';

interface AuthCheckProps {
  children: React.ReactNode;
}

export default function AuthCheck({ children }: AuthCheckProps) {
  const { isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  // Rotas públicas que não precisam de autenticação
  const publicRoutes = ['/', '/auth/sign-in', '/auth/sign-up'];
  const isPublicRoute = publicRoutes.includes(pathname);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Só redireciona se estiver montado, não estiver carregando, não for rota pública e não estiver autenticado
    if (mounted && !isLoading && !isPublicRoute && !isAuthenticated) {
      router.push('/auth/sign-in');
    }
  }, [mounted, isLoading, isPublicRoute, isAuthenticated, router]);

  // Enquanto não estiver montado, renderiza uma div vazia para evitar hidratação
  if (!mounted) {
    return <div style={{ minHeight: '100vh' }}></div>;
  }

  // Se está carregando e não é rota pública, mostra loading
  if (isLoading && !isPublicRoute) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  // Sempre renderiza os children
  return <>{children}</>;
}