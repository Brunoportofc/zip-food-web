// src/store/auth.store.ts
// Store Zustand para gerenciar estado global de autenticação

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from 'firebase/auth';
import { UserData, UserRole } from '@/services/auth.service';

interface AuthState {
  // Estado
  user: User | null;
  userData: UserData | null;
  userRole: UserRole | null;
  loading: boolean;
  
  // Ações
  setUser: (user: User | null) => void;
  setUserData: (userData: UserData | null) => void;
  setUserRole: (role: UserRole | null) => void;
  setLoading: (loading: boolean) => void;
  clearAuth: () => void;
  
  // Getters
  isAuthenticated: () => boolean;
  isCustomer: () => boolean;
  isRestaurant: () => boolean;
  isDelivery: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      user: null,
      userData: null,
      userRole: null,
      loading: true,

      // Ações
      setUser: (user) => {
        console.log('🔄 [Store] Atualizando usuário:', user?.uid || 'null');
        set({ user });
      },

      setUserData: (userData) => {
        console.log('🔄 [Store] Atualizando dados do usuário:', userData?.role || 'null');
        set({ userData });
      },

      setUserRole: (userRole) => {
        console.log('🔄 [Store] Atualizando papel do usuário:', userRole);
        set({ userRole });
      },

      setLoading: (loading) => {
        console.log('🔄 [Store] Atualizando loading:', loading);
        set({ loading });
      },

      clearAuth: () => {
        console.log('🔄 [Store] Limpando estado de autenticação');
        set({
          user: null,
          userData: null,
          userRole: null,
          loading: false,
        });
      },

      // Getters
      isAuthenticated: () => {
        const state = get();
        return !!(state.user && state.userData && state.userRole);
      },

      isCustomer: () => {
        const state = get();
        return state.userRole === 'customer';
      },

      isRestaurant: () => {
        const state = get();
        return state.userRole === 'restaurant';
      },

      isDelivery: () => {
        const state = get();
        return state.userRole === 'delivery';
      },
    }),
    {
      name: 'auth-storage',
      // ✨ CORREÇÃO: Não persistir dados sensíveis por segurança
      partialize: (state) => ({
        // Apenas persistir informações básicas não sensíveis
        userRole: state.userRole,
      }),
    }
  )
);
