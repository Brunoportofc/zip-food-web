'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '@/store/auth.store';
import { UserType } from '@/store/auth.store';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredUserType?: UserType | UserType[];
}

// Cache para evitar verificações repetidas
const routeCache = new Map<string, { isValid: boolean; timestamp: number }>();
const CACHE_DURATION = 5000; // 5 segundos

/**
 * Componente que protege rotas que requerem autenticação
 * e opcionalmente verifica se o usuário tem o tipo correto
 */
const ProtectedRoute = ({ children, requiredUserType }: ProtectedRouteProps) => {
  const router = useRouter();
  const { isAuthenticated, user, userType } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const hasRedirected = useRef(false);
  
  // Memoiza a chave do cache baseada nos parâmetros
  const cacheKey = useMemo(() => {
    const types = Array.isArray(requiredUserType) ? requiredUserType.join(',') : requiredUserType || 'none';
    return `${isAuthenticated}-${userType}-${types}`;
  }, [isAuthenticated, userType, requiredUserType]);
  
  // Verifica se a validação está em cache
  const getCachedValidation = () => {
    const cached = routeCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.isValid;
    }
    return null;
  };
  
  // Armazena resultado da validação no cache
  const setCachedValidation = (isValid: boolean) => {
    routeCache.set(cacheKey, { isValid, timestamp: Date.now() });
  };

  useEffect(() => {
    // Verifica cache primeiro
    const cachedResult = getCachedValidation();
    if (cachedResult !== null) {
      setIsLoading(!cachedResult);
      if (cachedResult) {
        hasRedirected.current = false;
      }
      return;
    }
    
    const handleAuth = async () => {
      // Evita múltiplos redirecionamentos
      if (hasRedirected.current) {
        return;
      }
      
      // Se não estiver autenticado e não for a página de perfil ou a página inicial do cliente, redireciona para login
      if (!isAuthenticated && 
          !window.location.pathname.includes('/customer/profile') && 
          window.location.pathname !== '/customer') {
        hasRedirected.current = true;
        setCachedValidation(false);
        router.replace('/auth/sign-in');
        return;
      }
      
      // Para a página de perfil ou a página inicial do cliente, permitimos acesso mesmo sem autenticação (para demonstração)
      if (window.location.pathname.includes('/customer/profile') || 
          window.location.pathname === '/customer') {
        setCachedValidation(true);
        setIsLoading(false);
        return;
      }

      // Se requerer um tipo específico de usuário
      if (requiredUserType) {
        const requiredTypes = Array.isArray(requiredUserType) 
          ? requiredUserType 
          : [requiredUserType];
        
        // Se o usuário não tiver o tipo correto OU se o userType for null/undefined
        if (!userType || !requiredTypes.includes(userType)) {

          
          hasRedirected.current = true;
          setCachedValidation(false);
          
          // Se userType é null/undefined, redireciona para login para reautenticar
          if (!userType) {
            console.log('🔴 ProtectedRoute: Redirecionando para login - userType é null');
            router.replace('/auth/sign-in');
            return;
          }
          
          // Redireciona para a página apropriada com base no tipo do usuário
          switch (userType) {
            case 'customer':
              router.replace('/customer');
              break;
            case 'restaurant':
              router.replace('/restaurant');
              break;
            case 'delivery':
              router.replace('/delivery');
              break;
            default:
              // Se não tiver tipo definido, redireciona para a página principal
              router.replace('/');
          }
          return;
        }
      }
      
      // Se chegou até aqui, pode mostrar o conteúdo
      setCachedValidation(true);
      setIsLoading(false);
      hasRedirected.current = false;
    };

    handleAuth();
  }, [isAuthenticated, router, userType, requiredUserType, cacheKey, getCachedValidation, setCachedValidation]);

  // Mostra loading enquanto verifica autenticação ou redireciona
  // Para a página de perfil ou a página inicial do cliente, permitimos acesso mesmo sem autenticação
  if (isLoading || (!isAuthenticated && 
      !window.location.pathname.includes('/customer/profile') && 
      window.location.pathname !== '/customer')) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          <p className="text-white text-lg">Carregando...</p>
        </div>
      </div>
    );
  }

  // Se requerer um tipo específico e o usuário não tiver o tipo correto, mostra loading
  if (requiredUserType) {
    const requiredTypes = Array.isArray(requiredUserType) 
      ? requiredUserType 
      : [requiredUserType];
    
    if (!userType || !requiredTypes.includes(userType)) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-black">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            <p className="text-white text-lg">Redirecionando...</p>
          </div>
        </div>
      );
    }
  }

  // Se estiver autenticado e tiver o tipo correto, renderiza o conteúdo
  return <>{children}</>;
};

export default ProtectedRoute;