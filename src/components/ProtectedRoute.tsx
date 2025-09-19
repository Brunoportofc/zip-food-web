'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredUserType?: 'customer' | 'restaurant' | 'delivery' | ('customer' | 'restaurant' | 'delivery')[];
}

/**
 * Componente que protege rotas que requerem autenticação
 * e opcionalmente verifica se o usuário tem o tipo correto
 */
const ProtectedRoute = ({ children, requiredUserType }: ProtectedRouteProps) => {
  const router = useRouter();
  const { isAuthenticated, user, isLoading } = useAuthStore();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient && !isLoading && !isAuthenticated) {
      router.push('/auth/sign-in');
    }
  }, [isClient, isAuthenticated, isLoading, router]);

  // Se não está no cliente ainda, não renderiza nada (evita hidratação)
  if (!isClient) {
    return null;
  }

  // Se está carregando, mostra um spinner
  if (isLoading) {
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
  if (requiredUserType && user) {
    const requiredTypes = Array.isArray(requiredUserType) 
      ? requiredUserType 
      : [requiredUserType];
    
    // Se não tiver o tipo correto, mostra mensagem de acesso negado
    if (!user.user_type || !requiredTypes.includes(user.user_type)) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Acesso não autorizado</h1>
            <p className="text-gray-600">Você não tem permissão para acessar esta página</p>
            <div className="mt-4 text-sm text-gray-500">
              <p>Tipo atual: {user.user_type || 'Não definido'}</p>
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