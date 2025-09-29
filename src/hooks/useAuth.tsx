'use client';

// src/hooks/useAuth.tsx
// Hook para gerenciar estado de autenticação com Firebase

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { authService, UserData, UserRole } from '@/services/auth.service';
import { useAuthStore } from '@/store/auth.store';

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  userRole: UserRole | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string; userRole?: UserRole }>;
  signUp: (email: string, password: string, displayName: string, role: UserRole, phone?: string) => Promise<{ success: boolean; error?: string; userRole?: UserRole }>;
  signOut: () => Promise<void>;
  isUserType: (requiredType: UserRole | UserRole[]) => boolean;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  // ✨ CORREÇÃO: Usar o store Zustand como fonte única da verdade
  const {
    user,
    userData,
    userRole,
    loading,
    setUser,
    setUserData,
    setUserRole,
    setLoading,
    clearAuth,
    isAuthenticated
  } = useAuthStore();

  // [FASE 3 - LOG 1] Hook inicializado
  console.log('[useAuth] 🚀 Hook inicializado', {
    timestamp: new Date().toISOString(),
    initialLoadingState: loading,
    hasUser: !!user,
    userRole
  });

  // ✨ CORREÇÃO: useEffect para monitorar mudanças de autenticação
  useEffect(() => {
    console.log('[useAuth] 🔄 Configurando listener de autenticação...');
    
    const unsubscribe = authService.onAuthStateChanged(async (firebaseUser) => {
      console.log('[useAuth] 🔥 Firebase Auth State Changed:', {
        hasUser: !!firebaseUser,
        uid: firebaseUser?.uid,
        email: firebaseUser?.email,
        timestamp: new Date().toISOString()
      });

      if (firebaseUser) {
        // Usuário logado
        setUser(firebaseUser);
        
        try {
          // Buscar dados do usuário no Firestore
          const userData = await authService.getUserData(firebaseUser.uid);
          
          if (userData) {
            console.log('[useAuth] ✅ Dados do usuário carregados:', {
              uid: userData.uid,
              role: userData.role,
              displayName: userData.displayName
            });
            
            setUserData(userData);
            setUserRole(userData.role);
          } else {
            console.warn('[useAuth] ⚠️ Dados do usuário não encontrados no Firestore');
            // Manter o usuário mas sem dados específicos
            setUserData(null);
            setUserRole(null);
          }
        } catch (error) {
          console.error('[useAuth] ❌ Erro ao buscar dados do usuário:', error);
          setUserData(null);
          setUserRole(null);
        }
      } else {
        // Usuário deslogado
        console.log('[useAuth] 🚪 Usuário deslogado, limpando estado');
        clearAuth();
      }
      
      // Sempre definir loading como false após processar
      setLoading(false);
    });

    return () => {
      console.log('[useAuth] 🧹 Removendo listener de autenticação');
      unsubscribe();
    };
  }, [setUser, setUserData, setUserRole, setLoading, clearAuth]);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      console.log('[useAuth] 🔐 Iniciando processo de login...');
      
      const result = await authService.signIn({ email, password });
      
      if (result.success && result.user) {
        console.log('[useAuth] ✅ Login bem-sucedido:', {
          uid: result.user.uid,
          role: result.user.role
        });

        // Criar cookie de sessão no servidor
        const firebaseUser = authService.getCurrentUser();
        if (firebaseUser) {
          const idToken = await firebaseUser.getIdToken();
          try {
            const sessionResponse = await fetch('/api/auth/session', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ idToken }),
            });

            const sessionData = await sessionResponse.json();
            
            if (!sessionResponse.ok) {
              console.warn('⚠️ [useAuth] Aviso ao criar sessão:', sessionData.error || sessionData.warning);
            } else {
              console.log('✅ [useAuth] Cookie de sessão criado com sucesso');
            }
          } catch (sessionError) {
            console.warn('⚠️ [useAuth] Erro ao criar cookie de sessão:', sessionError);
          }
        }
        
        // ✨ CORREÇÃO: Atualizar estado imediatamente para evitar problemas de timing
        const currentUser = authService.getCurrentUser();
        setUser(currentUser);
        setUserData(result.user);
        setUserRole(result.user.role);
        
        console.log('[useAuth] ✅ Estado atualizado após login:', {
          uid: result.user.uid,
          role: result.user.role,
          hasUser: !!currentUser,
          userEmail: currentUser?.email
        });
        
        // Garantir que o estado foi persistido antes de retornar
        await new Promise(resolve => setTimeout(resolve, 100));
        
        return { success: true, userRole: result.user.role };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error: any) {
      console.error('[useAuth] ❌ Erro no login:', error);
      return { success: false, error: error.message || 'Erro inesperado' };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, displayName: string, role: UserRole, phone?: string) => {
    try {
      setLoading(true);
      console.log('[useAuth] 📝 Iniciando processo de cadastro...');
      
      const result = await authService.signUp({ email, password, displayName, role, phone });
      
      if (result.success && result.user) {
        console.log('[useAuth] ✅ Cadastro bem-sucedido:', {
          uid: result.user.uid,
          role: result.user.role
        });

        // Criar cookie de sessão no servidor
        const firebaseUser = authService.getCurrentUser();
        if (firebaseUser) {
          const idToken = await firebaseUser.getIdToken();
          try {
            const sessionResponse = await fetch('/api/auth/session', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ idToken }),
            });

            const sessionData = await sessionResponse.json();
            
            if (!sessionResponse.ok) {
              console.warn('⚠️ [useAuth] Aviso ao criar sessão:', sessionData.error || sessionData.warning);
            } else {
              console.log('✅ [useAuth] Cookie de sessão criado com sucesso');
            }
          } catch (sessionError) {
            console.warn('⚠️ [useAuth] Erro ao criar cookie de sessão:', sessionError);
          }
        }
        
        // O onAuthStateChanged vai atualizar o estado automaticamente
        return { success: true, userRole: result.user.role };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error: any) {
      console.error('[useAuth] ❌ Erro no cadastro:', error);
      return { success: false, error: error.message || 'Erro inesperado' };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      console.log('[useAuth] 🚪 Iniciando processo de logout...');
      
      await authService.signOut();
      
      // Limpar cookie de sessão
      try {
        await fetch('/api/auth/session', {
          method: 'DELETE',
        });
        console.log('✅ [useAuth] Cookie de sessão removido');
      } catch (error) {
        console.warn('⚠️ [useAuth] Erro ao remover cookie de sessão:', error);
      }
      
      // O onAuthStateChanged vai limpar o estado automaticamente
      console.log('[useAuth] ✅ Logout realizado com sucesso');
    } catch (error) {
      console.error('[useAuth] ❌ Erro no logout:', error);
    } finally {
      setLoading(false);
    }
  };

  const isUserType = (requiredType: UserRole | UserRole[]): boolean => {
    if (!userRole) return false;
    
    if (Array.isArray(requiredType)) {
      return requiredType.includes(userRole);
    }
    
    return userRole === requiredType;
  };

  const hasPermission = (permission: string): boolean => {
    // Implementar lógica de permissões baseada no papel do usuário
    if (!userRole) return false;
    
    // Exemplo básico de permissões
    const permissions: Record<UserRole, string[]> = {
      customer: ['order', 'review', 'profile'],
      restaurant: ['menu', 'orders', 'profile', 'dashboard'],
      delivery: ['deliveries', 'profile', 'earnings']
    };
    
    return permissions[userRole]?.includes(permission) || false;
  };

  const contextValue: AuthContextType = {
    user,
    userData,
    userRole,
    loading,
    signIn,
    signUp,
    signOut,
    isUserType,
    hasPermission,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}