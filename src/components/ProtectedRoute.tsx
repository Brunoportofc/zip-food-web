'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '@/store/auth.store';
import { useAuthData } from '@/store/auth.store';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredUserType?: 'customer' | 'restaurant' | 'delivery' | ('customer' | 'restaurant' | 'delivery')[];
}

// Componente simplificado sem cache complexo

/**
 * Componente que protege rotas que requerem autenticação
 * e opcionalmente verifica se o usuário tem o tipo correto
 */
const ProtectedRoute = ({ children, requiredUserType }: ProtectedRouteProps) => {
  const router = useRouter();
  const { isAuthenticated, user, userType, isInitialized } = useAuthData();
  const [isLoading, setIsLoading] = useState(true);
  const hasRedirected = useRef(false);
  
  // Simplificação: removido cache complexo

  useEffect(() => {
    // Aguarda a inicialização do AuthCheck antes de tomar qualquer decisão
    if (!isInitialized) {
      console.log('ProtectedRoute - Aguardando inicialização do AuthCheck...');
      return;
    }

    // Debug logs para rastrear o problema
    console.log('ProtectedRoute - Estado atual:', {
      isAuthenticated,
      userType,
      requiredUserType,
      user: user?.name || 'N/A',
      isInitialized
    });

    // Simplificação: apenas verifica se precisa redirecionar para login
    if (!isAuthenticated) {
      console.log('ProtectedRoute - Usuário não autenticado, redirecionando para login');
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
  }, [isAuthenticated, userType, requiredUserType, router, user, isInitialized]);

  // Mostra loading enquanto aguarda inicialização ou durante redirecionamento
  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  // Se não estiver autenticado, não renderiza nada (será redirecionado)
  if (!isAuthenticated) {
    return null;
  }

  // Verificação de tipo de usuário se necessário
  if (requiredUserType) {
    const requiredTypes = Array.isArray(requiredUserType) 
      ? requiredUserType 
      : [requiredUserType];
    
    console.log('ProtectedRoute - Verificando tipo de usuário:', {
      userType,
      requiredTypes,
      isValid: userType && requiredTypes.includes(userType)
    });
    
    // Se não tiver o tipo correto, mostra mensagem de acesso negado
    if (!userType || !requiredTypes.includes(userType)) {
      console.log('ProtectedRoute - Acesso negado por tipo de usuário inválido');
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Acesso não autorizado</h1>
            <p className="text-gray-600">Você não tem permissão para acessar esta página</p>
            <div className="mt-4 text-sm text-gray-500">
              <p>Tipo atual: {userType || 'Não definido'}</p>
              <p>Tipo necessário: {requiredTypes.join(', ')}</p>
            </div>
          </div>
        </div>
      );
    }
  }

  // Renderiza o conteúdo se tudo estiver correto
  return <>{children}</>;
};

export default ProtectedRoute;