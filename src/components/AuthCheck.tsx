'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthData, useAuthActions } from '@/store/auth.store';
import { preloadCriticalComponents } from './LazyComponents';

interface AuthCheckProps {
  children: React.ReactNode;
}

/**
 * Componente que verifica o estado de autenticação do usuário
 * e inicializa o estado de autenticação
 */
const AuthCheck = ({ children }: AuthCheckProps) => {
  const { isAuthenticated, isLoading } = useAuthData();
  const { checkAuth } = useAuthActions();
  const [hasChecked, setHasChecked] = useState(false);
  const checkAuthRef = useRef(checkAuth);
  const pathname = usePathname();
  
  // Atualiza a referência quando checkAuth muda
  useEffect(() => {
    checkAuthRef.current = checkAuth;
  }, [checkAuth]);
  
  useEffect(() => {
    // Preload componentes críticos
    preloadCriticalComponents();
    
    // Só verifica autenticação se não estiver nas páginas de auth ou na home
    const isAuthPage = pathname?.startsWith('/auth') || pathname === '/';
    
    if (!hasChecked && !isAuthPage) {
      checkAuthRef.current().finally(() => setHasChecked(true));
    } else if (isAuthPage) {
      setHasChecked(true);
    }
  }, [hasChecked, pathname]);

  return <>{children}</>;
};

export default AuthCheck;