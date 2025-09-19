// src/store/auth.store.ts
import { create } from 'zustand';
import { authService } from '@/services/auth.service';
import { type User, type SignInData, type SignUpData } from '@/types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  signIn: (credentials: SignInData) => Promise<void>;
  signUp: (userData: SignUpData) => Promise<void>;
  signOut: () => Promise<void>;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true, // Inicia como true para verificar o estado inicial
  error: null,

  setUser: (user) => {
    set({
      user,
      isAuthenticated: !!user,
      isLoading: false,
      error: null,
    });
  },

  signIn: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const user = await authService.signIn(credentials);
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  signUp: async (userData) => {
    set({ isLoading: true, error: null });
    try {
      const user = await authService.signUp(userData);
      // Opcional: pode-se setar o usuário aqui ou aguardar o onAuthStateChange
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  signOut: async () => {
    set({ isLoading: true });
    try {
      await authService.signOut();
      set({ user: null, isAuthenticated: false, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },
}));

// Inicializa o listener para o estado de autenticação
authService.onAuthStateChange((user) => {
  useAuthStore.getState().setUser(user);
});