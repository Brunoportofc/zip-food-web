'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/services/auth.service';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredUserType?: UserRole | UserRole[];
  requiresPermission?: string;
  fallbackPath?: string;
  loadingComponent?: ReactNode;
  unauthorizedComponent?: ReactNode;
}

export function ProtectedRoute({
  children,
  requiredUserType,
  requiresPermission,
  fallbackPath = '/auth/sign-in',
  loadingComponent,
  unauthorizedComponent
}: ProtectedRouteProps) {
  const { user, loading, hasPermission, isUserType, userData, userRole } = useAuth();
  const router = useRouter();

  // [DIAGNÓSTICO] Log do estado atual do ProtectedRoute
  console.log('[PROTECTED_ROUTE] 🛡️ Estado atual:', {
    hasUser: !!user,
    loading,
    userData: !!userData,
    userRole,
    requiredUserType,
    timestamp: new Date().toISOString()
  });

  useEffect(() => {
    if (!loading && !user) {
      console.log('[PROTECTED_ROUTE] 🚪 Redirecionando usuário não autenticado para:', fallbackPath);
      router.push(fallbackPath);
    }
  }, [user, loading, router, fallbackPath]);

  // Mostrar loading enquanto verifica autenticação
  if (loading) {
    return loadingComponent || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  // Usuário não autenticado
  if (!user) {
    return null; // O useEffect já redirecionou
  }

  // Verificar tipo de usuário
  if (requiredUserType && !isUserType(requiredUserType)) {
    console.log('[PROTECTED_ROUTE] ❌ Acesso negado - tipo de usuário incorreto:', {
      requiredUserType,
      currentUserRole: userRole,
      hasUserData: !!userData
    });
    return unauthorizedComponent || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Acesso Negado
          </h1>
          <p className="text-gray-600 mb-6">
            Você não tem permissão para acessar esta área.
          </p>
          <button
            onClick={() => router.back()}
            className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  // Verificar permissão específica
  if (requiresPermission && !hasPermission(requiresPermission)) {
    return unauthorizedComponent || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Permissão Insuficiente
          </h1>
          <p className="text-gray-600 mb-6">
            Você não tem permissão para acessar esta funcionalidade.
          </p>
          <button
            onClick={() => router.back()}
            className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

// Componentes específicos para cada tipo de usuário
export function RestaurantProtectedRoute({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute requiredUserType="restaurant">
      {children}
    </ProtectedRoute>
  );
}

export function CustomerProtectedRoute({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute requiredUserType="customer">
      {children}
    </ProtectedRoute>
  );
}

export function DeliveryProtectedRoute({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute requiredUserType="delivery">
      {children}
    </ProtectedRoute>
  );
}

// Exportação padrão
export default ProtectedRoute;