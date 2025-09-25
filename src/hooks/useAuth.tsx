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
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string; userRole?: UserRole }>;
  signUp: (email: string, password: string, displayName: string, role: UserRole) => Promise<{ success: boolean; error?: string; userRole?: UserRole }>;
  signOut: () => Promise<void>;
  isUserType: (requiredType: UserRole | UserRole[]) => boolean;
  hasPermission: (permission: string) => boolean;
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

  // [FASE 3 - LOG 1] Hook inicializado
  console.log('[useAuth] 🚀 Hook inicializado', {
    timestamp: new Date().toISOString(),
    initialLoadingState: loading
  });

  useEffect(() => {
    // [FASE 3 - LOG 2] useEffect de verificação de sessão disparado
    console.log('[useAuth] 🔄 useEffect de verificação de sessão disparado', {
      timestamp: new Date().toISOString()
    });
    
    const unsubscribe = authService.onAuthStateChanged(async (firebaseUser) => {
      // [FASE 3 - LOG 3] Estado de autenticação mudou
      console.log('[useAuth] 📡 Estado de autenticação mudou:', {
        hasUser: !!firebaseUser,
        uid: firebaseUser?.uid || 'null',
        email: firebaseUser?.email || 'null',
        timestamp: new Date().toISOString()
      });
      
      setUser(firebaseUser);
      
      if (firebaseUser) {
        // [FASE 3 - LOG 4] Usuário logado - buscar dados do Firestore
        console.log('[useAuth] 👤 Usuário logado detectado, buscando dados no Firestore...', {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          timestamp: new Date().toISOString()
        });

        try {
          const data = await authService.getUserData(firebaseUser.uid);
          
          // [FASE 3 - LOG 5] Dados do usuário obtidos
          console.log('[useAuth] ✅ Dados do usuário obtidos do Firestore:', {
            hasData: !!data,
            role: data?.role || 'null',
            user_type: data?.user_type || 'null',
            displayName: data?.displayName || 'null',
            timestamp: new Date().toISOString()
          });

          setUserData(data);
          setUserRole(data?.role || null);
        } catch (error) {
          // [FASE 3 - LOG 6] Erro ao carregar dados do usuário
          console.error('[useAuth] ❌ Erro ao carregar dados do usuário:', {
            error: error instanceof Error ? error.message : String(error),
            uid: firebaseUser.uid,
            timestamp: new Date().toISOString()
          });
          setUserData(null);
          setUserRole(null);
        }
      } else {
        // [FASE 3 - LOG 7] Usuário deslogado
        console.log('[useAuth] 🚪 Usuário deslogado detectado', {
          timestamp: new Date().toISOString()
        });
        setUserData(null);
        setUserRole(null);
      }
      
      // [FASE 3 - LOG 8] Finalizando verificação de sessão
      // Use setTimeout to ensure state updates are reflected in logs
      setTimeout(() => {
        console.log('[useAuth] 🏁 Verificação de sessão finalizada', {
          hasUser: !!firebaseUser,
          hasUserData: !!firebaseUser ? 'will_be_set' : false,
          userRole: firebaseUser ? 'will_be_set' : null,
          loadingState: false,
          timestamp: new Date().toISOString()
        });
      }, 0);
      setLoading(false);
    });

    return () => {
      // [FASE 3 - LOG 9] Removendo listener
      console.log('[useAuth] 🧹 Removendo listener de autenticação', {
        timestamp: new Date().toISOString()
      });
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
              console.warn('⚠️ Aviso ao criar sessão:', sessionData.details || sessionData.error);
              // Não falhar o login se apenas o cookie de sessão falhou
            } else {
              console.log('✅ Cookie de sessão criado com sucesso');
            }
          } catch (sessionError) {
            console.warn('⚠️ Erro ao criar cookie de sessão:', sessionError);
            // Não falhar o login se apenas o cookie de sessão falhou
          }
        }
        
        // O onAuthStateChanged vai atualizar o estado automaticamente
        // O middleware cuidará do redirecionamento baseado no tipo de usuário
        return { success: true, userRole: result.user?.role };
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
              console.warn('⚠️ Aviso ao criar sessão:', sessionData.details || sessionData.error);
              // Não falhar o login se apenas o cookie de sessão falhou
            } else {
              console.log('✅ Cookie de sessão criado com sucesso');
            }
          } catch (sessionError) {
            console.warn('⚠️ Erro ao criar cookie de sessão:', sessionError);
            // Não falhar o login se apenas o cookie de sessão falhou
          }
        }
        
        // O onAuthStateChanged vai atualizar o estado automaticamente
        // O middleware cuidará do redirecionamento baseado no tipo de usuário
        return { success: true, userRole: role };
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
      
      // Limpar estados locais
      setUser(null);
      setUserData(null);
      setUserRole(null);
      
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    } finally {
      setLoading(false);
    }
  };

  // Função para verificar se o usuário tem um tipo específico
  const isUserType = (requiredType: UserRole | UserRole[]): boolean => {
    if (!userRole) return false;
    
    if (Array.isArray(requiredType)) {
      return requiredType.includes(userRole);
    }
    
    return userRole === requiredType;
  };

  // Função para verificar permissões (implementação básica)
  const hasPermission = (permission: string): boolean => {
    // Implementação básica - pode ser expandida conforme necessário
    if (!userRole) return false;
    
    // Exemplo de permissões básicas por tipo de usuário
    const permissions: Record<UserRole, string[]> = {
      customer: ['view_restaurants', 'place_orders', 'view_orders'],
      restaurant: ['manage_menu', 'view_orders', 'manage_restaurant'],
      delivery: ['view_deliveries', 'accept_deliveries', 'update_delivery_status']
    };
    
    return permissions[userRole]?.includes(permission) || false;
  };

  const value: AuthContextType = {
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