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
  fallbackPath = '/login',
  loadingComponent,
  unauthorizedComponent
}: ProtectedRouteProps) {
  const { user, loading, hasPermission, isUserType } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
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
            Você não tem permissão para realizar esta ação.
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

// Componentes específicos para diferentes tipos de usuário
export function RestaurantProtectedRoute({ 
  children, 
  ...props 
}: Omit<ProtectedRouteProps, 'requiredUserType'>) {
  return (
    <ProtectedRoute requiredUserType="restaurant" {...props}>
      {children}
    </ProtectedRoute>
  );
}

export function DeliveryProtectedRoute({ 
  children, 
  ...props 
}: Omit<ProtectedRouteProps, 'requiredUserType'>) {
  return (
    <ProtectedRoute requiredUserType="delivery" {...props}>
      {children}
    </ProtectedRoute>
  );
}


export function CustomerProtectedRoute({ 
  children, 
  ...props 
}: Omit<ProtectedRouteProps, 'requiredUserType'>) {
  return (
    <ProtectedRoute requiredUserType="customer" {...props}>
      {children}
    </ProtectedRoute>
  );
}

// Componente para verificar status da conta de restaurante
export function RestaurantStatusGuard({ children }: { children: ReactNode }) {
  const { user, canAccessRestaurantArea } = useAuth();
  const router = useRouter();

  if (!user || user.user_type !== 'restaurant') {
    return null;
  }

  if (!canAccessRestaurantArea()) {
    const restaurantStatus = user.profile?.restaurant_status;
    const userStatus = user.profile?.status;
    
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          {restaurantStatus === 'pending_approval' && (
            <>
              <h1 className="text-2xl font-bold text-yellow-600 mb-4">
                Conta Aguardando Aprovação
              </h1>
              <p className="text-gray-600 mb-6">
                Sua conta de restaurante está sendo analisada. 
                Você receberá um email quando for aprovada.
              </p>
            </>
          )}
          
          {restaurantStatus === 'rejected' && (
            <>
              <h1 className="text-2xl font-bold text-red-600 mb-4">
                Conta Rejeitada
              </h1>
              <p className="text-gray-600 mb-6">
                Sua conta de restaurante foi rejeitada. 
                Entre em contato com o suporte para mais informações.
              </p>
            </>
          )}
          
          {userStatus === 'suspended' && (
            <>
              <h1 className="text-2xl font-bold text-red-600 mb-4">
                Conta Suspensa
              </h1>
              <p className="text-gray-600 mb-6">
                Sua conta foi suspensa. 
                Entre em contato com o suporte.
              </p>
            </>
          )}
          
          <button
            onClick={() => router.push('/')}
            className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600"
          >
            Ir para Página Inicial
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}