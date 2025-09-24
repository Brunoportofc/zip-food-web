import { useState, useEffect, useContext, createContext, ReactNode } from 'react';
import { authService } from '@/services/auth.service';
import { userTypeService, type UserProfile } from '@/services/user-type.service';
import { type User, type SignInData, type SignUpData, type UserType } from '@/types/auth';

interface AuthContextType {
  user: (User & { profile?: UserProfile }) | null;
  loading: boolean;
  signIn: (credentials: SignInData) => Promise<User & { profile?: UserProfile }>;
  signUp: (userData: SignUpData) => Promise<User & { profile?: UserProfile }>;
  signOut: () => Promise<void>;
  hasPermission: (permission: string) => Promise<boolean>;
  canAccessRestaurantArea: () => Promise<boolean>;
  isUserType: (userType: UserType | UserType[]) => boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Verificação de tipo para garantir que o contexto está definido
if (!AuthContext) {
  throw new Error('Falha ao criar AuthContext');
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<(User & { profile?: UserProfile }) | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChange((user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (credentials: SignInData): Promise<User & { profile?: UserProfile }> => {
    setLoading(true);
    try {
      const user = await authService.signIn(credentials);
      return user;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (userData: SignUpData): Promise<User & { profile?: UserProfile }> => {
    setLoading(true);
    try {
      const response = await authService.signUp(userData);
      
      if (!response.success || !response.user) {
        throw new Error(response.error || 'Erro ao criar conta');
      }
      
      // Converter UserData para User & { profile?: UserProfile }
      const user: User & { profile?: UserProfile } = {
        id: response.user.id,
        email: response.user.email,
        name: response.user.name,
        user_type: response.user.user_type,
        phone: response.user.phone,
        status: response.user.status,
        created_at: response.user.created_at,
        updated_at: response.user.updated_at,
        profile: undefined // Será carregado posteriormente se necessário
      };
      
      return user;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async (): Promise<void> => {
    setLoading(true);
    try {
      await authService.signOut();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = async (permission: string): Promise<boolean> => {
    if (!user?.id) return false;
    return await userTypeService.hasPermission(user.id, permission);
  };

  const canAccessRestaurantArea = async (): Promise<boolean> => {
    if (!user?.id) return false;
    return await userTypeService.canAccessRestaurantArea(user.id);
  };

  const isUserType = (userType: UserType | UserType[]): boolean => {
    if (!user?.user_type) return false;
    
    if (Array.isArray(userType)) {
      return userType.includes(user.user_type);
    }
    
    return user.user_type === userType;
  };

  const refreshProfile = async (): Promise<void> => {
    if (!user?.id) return;
    
    try {
      const profile = await userTypeService.getUserProfile(user.id);
      setUser(prev => prev ? { ...prev, profile: profile || undefined } : null);
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    hasPermission,
    canAccessRestaurantArea,
    isUserType,
    refreshProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}

export function useRestaurantAuth() {
  const auth = useAuth();
  
  return {
    ...auth,
    isRestaurant: auth.isUserType('restaurant'),
    canAccess: async () => await auth.canAccessRestaurantArea(),
    restaurantId: auth.user?.profile?.restaurant_id,
    restaurantName: auth.user?.profile?.restaurant_name,
    restaurantStatus: auth.user?.profile?.restaurant_status,
    isApproved: auth.user?.profile?.restaurant_status === 'approved',
    isPending: auth.user?.profile?.restaurant_status === 'pending_approval',
    isRejected: auth.user?.profile?.restaurant_status === 'rejected'
  };
}

export function useDeliveryAuth() {
  const auth = useAuth();
  
  return {
    ...auth,
    isDelivery: auth.isUserType('delivery'),
    deliveryStatus: auth.user?.profile?.delivery_status,
    vehicleType: auth.user?.profile?.vehicle_type,
    isAvailable: auth.user?.profile?.delivery_status === 'available',
    isBusy: auth.user?.profile?.delivery_status === 'busy',
    isOffline: auth.user?.profile?.delivery_status === 'offline'
  };
}

export function useCustomerAuth() {
  const auth = useAuth();
  
  return {
    ...auth,
    isCustomer: auth.isUserType('customer')
  };
}

// Função para verificar permissões administrativas
export function useAdminPermissions() {
  const auth = useAuth();
  
  return {
    ...auth,
    canManageUsers: async () => await auth.hasPermission('manage_users'),
    canApproveRestaurants: async () => await auth.hasPermission('approve_restaurants'),
    isAdmin: auth.user?.user_type === 'admin' || false
  };
}

// Hook para redirecionamento inteligente
export function useAuthRedirect() {
  const auth = useAuth();
  
  const getRedirectRoute = (): string => {
    if (!auth.user?.profile) {
      return '/customer';
    }
    
    // Importar e usar o userTypeService
    import('@/services/user-type.service').then(({ userTypeService }) => {
      return userTypeService.getRedirectRoute(auth.user!.profile!);
    });
    
    // Fallback baseado no tipo de usuário
    switch (auth.user.user_type) {
      case 'restaurant':
        return '/restaurant';
      case 'delivery':
        return '/delivery';
      default:
        return '/customer';
    }
  };
  
  return {
    ...auth,
    getRedirectRoute
  };
}