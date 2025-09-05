'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '@/store/auth.store';
import { UserType } from '@/store/auth.store';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredUserType?: UserType | UserType[];
}

// Componente simplificado sem cache complexo

/**
 * Componente que protege rotas que requerem autenticação
 * e opcionalmente verifica se o usuário tem o tipo correto
 */
const ProtectedRoute = ({ children, requiredUserType }: ProtectedRouteProps) => {
  const router = useRouter();
  const { isAuthenticated, user, userType } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const hasRedirected = useRef(false);
  
  // Simplificação: removido cache complexo

  useEffect(() => {
    // Simplificação: apenas verifica se precisa redirecionar para login
    if (!isAuthenticated) {
      // Evita múltiplos redirecionamentos
      if (!hasRedirected.current) {
        hasRedirected.current = true;
        router.replace('/auth/sign-in');
      }
      return;
    }

    // Se está autenticado, para o loading
    setIsLoading(false);
    hasRedirected.current = false;
  }, [isAuthenticated, router]);

  // Mostra loading apenas quando necessário
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          <p className="text-white text-lg">Carregando...</p>
        </div>
      </div>
    );
  }

  // Se não estiver autenticado, não renderiza nada (será redirecionado)
  if (!isAuthenticated) {
    return null;
  }

  // Verificação simples de tipo de usuário se necessário
  if (requiredUserType) {
    const requiredTypes = Array.isArray(requiredUserType) 
      ? requiredUserType 
      : [requiredUserType];
    
    // Se não tiver o tipo correto, mostra mensagem de acesso negado
    if (!userType || !requiredTypes.includes(userType)) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-black">
          <div className="flex flex-col items-center space-y-4">
            <p className="text-white text-lg">Acesso não autorizado</p>
            <p className="text-gray-400 text-sm">Você não tem permissão para acessar esta página</p>
          </div>
        </div>
      );
    }
  }

  // Renderiza o conteúdo se tudo estiver correto
  return <>{children}</>;
};

export default ProtectedRoute;