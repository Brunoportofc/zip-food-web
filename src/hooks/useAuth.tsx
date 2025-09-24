'use client';

// src/hooks/useAuth.tsx
// Hook para gerenciar estado de autenticação com Firebase

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { authService, UserData, UserRole } from '@/services/auth.service';

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  userRole: UserRole | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, displayName: string, role: UserRole) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🔄 Configurando listener de autenticação...');
    
    const unsubscribe = authService.onAuthStateChanged(async (firebaseUser) => {
      console.log('🔄 Estado de autenticação mudou:', firebaseUser?.uid || 'null');
      
      setUser(firebaseUser);
      
      if (firebaseUser) {
        // Usuário logado - buscar dados do Firestore
        try {
          const data = await authService.getUserData(firebaseUser.uid);
          setUserData(data);
          setUserRole(data?.role || null);
          console.log('✅ Dados do usuário carregados:', data?.role);
        } catch (error) {
          console.error('❌ Erro ao carregar dados do usuário:', error);
          setUserData(null);
          setUserRole(null);
        }
      } else {
        // Usuário deslogado
        setUserData(null);
        setUserRole(null);
      }
      
      setLoading(false);
    });

    return () => {
      console.log('🔄 Removendo listener de autenticação');
      unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const result = await authService.signIn({ email, password });
      
      if (result.success) {
        // Criar cookie de sessão no servidor
        const user = authService.getCurrentUser();
        if (user) {
          const idToken = await user.getIdToken();
          await fetch('/api/auth/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken }),
          });
        }
        
        // O onAuthStateChanged vai atualizar o estado automaticamente
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error: any) {
      return { success: false, error: error.message || 'Erro inesperado' };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, displayName: string, role: UserRole) => {
    try {
      setLoading(true);
      const result = await authService.signUp({ email, password, displayName, role });
      
      if (result.success) {
        // Criar cookie de sessão no servidor
        const user = authService.getCurrentUser();
        if (user) {
          const idToken = await user.getIdToken();
          await fetch('/api/auth/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken }),
          });
        }
        
        // O onAuthStateChanged vai atualizar o estado automaticamente
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error: any) {
      return { success: false, error: error.message || 'Erro inesperado' };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      
      // Remover cookie de sessão no servidor
      await fetch('/api/auth/session', {
        method: 'DELETE',
      });
      
      // Fazer logout no Firebase
      await authService.signOut();
      
      // O onAuthStateChanged vai limpar o estado automaticamente
    } catch (error) {
      console.error('❌ Erro ao fazer logout:', error);
    } finally {
      setLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    userData,
    userRole,
    loading,
    signIn,
    signUp,
    signOut,
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