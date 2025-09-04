'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthData, useAuthActions } from '@/store/auth.store';
import { preloadCriticalComponents } from './LazyComponents';

interface AuthCheckProps {
  children: React.ReactNode;
}

/**
 * Componente que verifica o estado de autenticação do usuário
 * e inicializa o estado de autenticação a partir do Firebase
 */
const AuthCheck = ({ children }: AuthCheckProps) => {
  const { isAuthenticated, isLoading } = useAuthData();
  const { checkAuth } = useAuthActions();
  const [hasChecked, setHasChecked] = useState(false);
  const checkAuthRef = useRef(checkAuth);
  
  // Atualiza a referência quando checkAuth muda
  useEffect(() => {
    checkAuthRef.current = checkAuth;
  }, [checkAuth]);
  
  useEffect(() => {
    // Preload componentes críticos
    preloadCriticalComponents();
    
    // Só verifica uma vez ao montar o componente
    if (!hasChecked) {
      checkAuthRef.current().finally(() => setHasChecked(true));
    }
  }, [hasChecked]);

  return <>{children}</>;
};

export default AuthCheck;