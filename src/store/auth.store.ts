import { createWithEqualityFn } from 'zustand/traditional';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import { shallow } from 'zustand/shallow';
import { authService } from '@/services/auth.service';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

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
  lastAuthCheck: number;
  login: (userData: User, token: string) => void;
  logout: () => void;
  setUserType: (type: UserType) => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  checkAuth: () => Promise<void>;
  syncUserData: () => Promise<void>;
  setOfflineMode: (isOffline: boolean) => void;
  setLoading: (loading: boolean) => void;
}

const useAuthStore = createWithEqualityFn<AuthState>(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        isAuthenticated: false,
        user: null,
        token: null,
        userType: null,
        isOfflineMode: false,
        isLoading: false,
        lastAuthCheck: 0,
        login: (userData, token) => set({ 
          isAuthenticated: true, 
          user: userData, 
          token, 
          userType: userData.type,
          isLoading: false,
          lastAuthCheck: Date.now()
        }),
      logout: async () => {
        try {
          await authService.signOut();
          set({ isAuthenticated: false, user: null, token: null, userType: null });
        } catch (error) {
          console.error('Erro ao fazer logout:', error);
        }
      },
      setUserType: (type) => set({ userType: type }),
      signIn: async (email, password) => {
        try {
          const currentUserType = get().userType;
          const { user, token } = await authService.signIn({ email, password });
          
          // Preserva o userType selecionado pelo usuário, ou usa o do banco se não houver seleção
          const finalUserType = currentUserType || user.type;
          
          set({ isAuthenticated: true, user, token, userType: finalUserType });
        } catch (error) {
          console.error('Erro ao fazer login:', error);
          throw error;
        }
      },
      signUp: async (name, email, password) => {
        try {
          const userType = get().userType;
          if (!userType) throw new Error('Tipo de usuário não selecionado');
          
          const user = await authService.signUp({ name, email, password, userType });
          const { token } = await authService.signIn({ email, password });
          set({ isAuthenticated: true, user, token });
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
        
        // Verificação inicial rápida - se já está autenticado e tem usuário, não precisa verificar novamente
        if (auth.currentUser && currentState.isAuthenticated && currentState.user) {
          set({ lastAuthCheck: now });
          return;
        }
        
        // Se não há usuário no Firebase Auth, limpar estado
        if (!auth.currentUser) {
          set({
            user: null,
            isAuthenticated: false,
            userType: null,
            isLoading: false,
            lastAuthCheck: now
          });
          return;
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
              lastAuthCheck: now
            });
          } else {
              set({
                user: null,
                isAuthenticated: false,
                userType: null,
                isLoading: false,
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
            lastAuthCheck: now
          });
        }
      },
      
      syncUserData: async () => {
        try {
          // Só tenta sincronizar se estiver autenticado e tiver um usuário atual no Firebase
          if (get().isAuthenticated && auth.currentUser) {
            const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
            
            if (userDoc.exists()) {
              const userData = userDoc.data() as User;
              set({ user: userData, userType: userData.type, isOfflineMode: false });
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
    isLoading: state.isLoading
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