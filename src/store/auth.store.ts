import { createWithEqualityFn } from 'zustand/traditional';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import { shallow } from 'zustand/shallow';
import { authService } from '@/services/auth.service';

export type UserType = 'customer' | 'restaurant' | 'delivery';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  type: UserType;
  address?: string;
  profileImage?: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  userType: UserType | null;
  isOfflineMode: boolean;
  isLoading: boolean;
  isInitialized: boolean; // Flag para controlar se a verificação inicial foi concluída
  lastAuthCheck: number;
  login: (userData: User, token: string) => void;
  logout: () => void;
  setUserType: (type: UserType) => void;
  signIn: (email: string, password: string, userType?: UserType) => Promise<void>;
  signUp: (name: string, email: string, password: string, phone: string) => Promise<void>;
  checkAuth: () => Promise<void>;
  syncUserData: () => Promise<void>;
  setOfflineMode: (isOffline: boolean) => void;
  setLoading: (loading: boolean) => void;
}

const useAuthStore = createWithEqualityFn<AuthState>()(
  subscribeWithSelector(
    persist<AuthState>(
      (set, get) => ({
        isAuthenticated: false,
        user: null,
        token: null,
        userType: null,
        isOfflineMode: false,
        isLoading: false,
        isInitialized: false, // Inicialmente não foi verificado
        lastAuthCheck: 0,
        login: (userData, token) => set({ 
          isAuthenticated: true, 
          user: userData, 
          token, 
          userType: userData.type,
          isLoading: false,
          isInitialized: true, // Marca como inicializado após login
          lastAuthCheck: Date.now()
        }),
      logout: async () => {
        try {
          await authService.signOut();
          set({ 
            isAuthenticated: false, 
            user: null, 
            token: null, 
            userType: null,
            isInitialized: true // Mantém como inicializado após logout
          });
        } catch (error) {
          console.error('Erro ao fazer logout:', error);
        }
      },
      setUserType: (type) => set({ userType: type }),
      signIn: async (email, password, userType) => {
        try {
          set({ isLoading: true });
          
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password, userType }),
          });
          
          const data = await response.json();
          
          if (!response.ok) {
            throw new Error(data.error || 'Erro ao fazer login');
          }
          
          if (!data.success || !data.data) {
            throw new Error('Resposta inválida do servidor');
          }
          
          const { user, token } = data.data;
          
          // Usa o userType do usuário retornado pelo serviço
          const finalUserType = user.type;
          
          console.log('Auth Store - Login bem-sucedido:', {
            userId: user.id,
            userType: finalUserType,
            userName: user.name
          });
          
          set({ 
            isAuthenticated: true, 
            user, 
            token, 
            userType: finalUserType,
            isLoading: false,
            lastAuthCheck: Date.now()
          });

          // Lógica de redirecionamento para restaurantes
          if (finalUserType === 'restaurant') {
            try {
              // Verifica se o restaurante já tem cadastro completo
              const restaurantResponse = await fetch(`/api/restaurants?owner=${user.id}`, {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
              });
              
              if (restaurantResponse.ok) {
                const restaurantData = await restaurantResponse.json();
                const restaurants = restaurantData.data || [];
                
                // Se já tem restaurante cadastrado, redireciona para o dashboard
                if (restaurants.length > 0) {
                  window.location.href = '/restaurant/dashboard';
                } else {
                  // Se não tem restaurante, redireciona para o cadastro
                  window.location.href = '/restaurant/register';
                }
              } else {
                // Em caso de erro na verificação, redireciona para o cadastro por segurança
                window.location.href = '/restaurant/register';
              }
            } catch (restaurantError) {
              console.error('Erro ao verificar restaurante:', restaurantError);
              // Em caso de erro, redireciona para o cadastro
              window.location.href = '/restaurant/register';
            }
          }
        } catch (error) {
          set({ isLoading: false });
          console.error('Erro ao fazer login:', error);
          throw error;
        }
      },
      signUp: async (name, email, password, phone) => {
        try {
          const userType = get().userType;
          if (!userType) throw new Error('Tipo de usuário não selecionado');
          
          const user = await authService.signUp(name, email, password, userType, phone);
          // Não faz login automático - usuário deve fazer login manualmente
          console.log('Usuário registrado com sucesso:', user.name);
        } catch (error) {
          console.error('Erro ao registrar usuário:', error);
          throw error;
        }
      },
      checkAuth: async () => {
        const currentState = get();
        const now = Date.now();
        const CACHE_DURATION = 30000; // 30 segundos
        
        // Verificação de cache temporal - evita verificações muito frequentes
        if (currentState.lastAuthCheck && (now - currentState.lastAuthCheck) < CACHE_DURATION) {
          if (currentState.isAuthenticated && currentState.user) {
            return;
          }
        }
        
        // Define loading apenas se não estiver já carregando
        if (!currentState.isLoading) {
          set({ isLoading: true });
        }
        
        try {
          const user = await authService.getCurrentUser();
          
          if (user) {
            // Preserva userType atual se disponível, senão usa o do usuário
            const finalUserType = currentState.userType || user.type;
            
            set({
              user,
              isAuthenticated: true,
              userType: finalUserType,
              isLoading: false,
              isInitialized: true, // Marca como inicializado após verificação
              lastAuthCheck: now
            });
          } else {
            set({
              user: null,
              isAuthenticated: false,
              userType: null,
              isLoading: false,
              isInitialized: true, // Marca como inicializado mesmo sem usuário
              lastAuthCheck: now
            });
          }
        } catch (error) {
          console.error('Erro ao verificar autenticação:', error);
          set({
            user: null,
            isAuthenticated: false,
            userType: null,
            isLoading: false,
            isInitialized: true, // Marca como inicializado mesmo com erro
            lastAuthCheck: now
          });
        }
      },
      
      syncUserData: async () => {
        try {
          // Sincronização simulada - apenas atualiza o timestamp
          if (get().isAuthenticated) {
            const user = await authService.getCurrentUser();
            if (user) {
              set({ user, userType: user.type, isOfflineMode: false });
              console.log('Dados do usuário sincronizados com sucesso');
            }
          }
        } catch (error) {
          console.error('Erro ao sincronizar dados do usuário:', error);
        }
      },
      
      setOfflineMode: (isOffline: boolean) => {
        set({ isOfflineMode: isOffline });
      },
      
      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },
    }),
    {
      name: 'auth-storage', // nome para o armazenamento persistente
    }
    )
  ),
  shallow
);

// Seletor otimizado para componentes que só precisam de dados específicos
export const useAuthData = () => useAuthStore(
  (state) => ({
    isAuthenticated: state.isAuthenticated,
    user: state.user,
    userType: state.userType,
    isLoading: state.isLoading,
    isInitialized: state.isInitialized // Incluindo flag de inicialização
  })
);

// Seletor para ações (não causa re-render quando estado muda)
export const useAuthActions = () => useAuthStore(
  (state) => ({
    login: state.login,
    logout: state.logout,
    signIn: state.signIn,
    signUp: state.signUp,
    checkAuth: state.checkAuth,
    setUserType: state.setUserType,
    setLoading: state.setLoading
  })
);

export default useAuthStore;