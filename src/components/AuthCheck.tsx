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

  // Rotas que não precisam de verificação de autenticação
  const publicRoutes = [
    '/', 
    '/auth/sign-in', 
    '/auth/sign-up',
    '/customer',
    '/restaurant', 
    '/delivery',
    '/restaurant/pending',
    '/delivery/pending',
    '/restaurant/register'
  ];
  
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

  useEffect(() => {
    setMounted(true);
  }, []);

  // Remover redirecionamento automático - deixar que cada página gerencie sua própria autenticação
  // useEffect(() => {
  //   if (mounted && !isLoading && !isPublicRoute && !isAuthenticated) {
  //     router.push('/auth/sign-in');
  //   }
  // }, [mounted, isLoading, isPublicRoute, isAuthenticated, router]);

  // Enquanto não estiver montado, renderiza uma div vazia para evitar hidratação
  if (!mounted) {
    return <div style={{ minHeight: '100vh' }}></div>;
  }

  // Sempre renderiza os children - deixar que cada página gerencie sua autenticação
  return <>{children}</>;
}