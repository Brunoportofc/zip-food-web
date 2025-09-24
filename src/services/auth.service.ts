// src/services/auth.service.ts
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  UserCredential,
  AuthError,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';

// Tipos de usuário permitidos
export type UserType = 'customer' | 'restaurant' | 'delivery_driver';

// Interface para dados do usuário
export interface UserData {
  id: string;
  email: string;
  name: string;
  user_type: UserType;
  phone?: string;
  status: 'active' | 'inactive' | 'pending';
  created_at: any; // Mantido como 'any' para compatibilidade com serverTimestamp() e Timestamp
  updated_at: any;
}

// Interface para dados de cadastro
export interface SignUpData {
  email: string;
  password: string;
  name: string;
  user_type: UserType;
  phone?: string;
}

// Interface para dados de login
export interface SignInData {
  email: string;
  password: string;
}

// Interface para resposta de autenticação
export interface AuthResponse {
  success: boolean;
  user?: UserData;
  message?: string;
  error?: string;
}

class AuthService {
  private currentUser: User | null = null;
  private userProfile: UserData | null = null;

  constructor() {
    // Monitorar mudanças no estado de autenticação (APENAS NO CLIENT-SIDE)
    if (typeof window !== 'undefined') {
      onAuthStateChanged(auth, async (user) => {
        this.currentUser = user;
        if (user) {
          await this.loadUserProfile(user.uid);
        } else {
          this.userProfile = null;
        }
      });
    }
  }

  /**
   * Cadastrar novo usuário (VERSÃO PARA CLIENT-SIDE - SERÁ CHAMADA VIA API)
   */
  async signUp(data: SignUpData): Promise<AuthResponse> {
    try {
      console.log('🚀 Iniciando cadastro de usuário via API:', { email: data.email, user_type: data.user_type });

      // Validar dados de entrada
      const validation = this.validateSignUpData(data);
      if (!validation.isValid) {
        return { success: false, error: validation.message };
      }

      // Fazer requisição para a API route que usa o Admin SDK
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        return { success: false, error: result.error || 'Erro durante o cadastro' };
      }

      console.log('✅ Cadastro realizado com sucesso via API!');
      return result;

    } catch (error: any) {
      console.error('❌ Erro durante o cadastro:', error);
      return { success: false, error: 'Ocorreu um erro inesperado durante o cadastro.' };
    }
  }

  // ... (mantenha os outros métodos como signIn, signOutUser, etc., pois eles são usados no client-side)
  // O signIn, por exemplo, está correto usando o SDK do cliente, pois ele é chamado do navegador.
  
  /**
   * Fazer login
   */
  async signIn(data: SignInData): Promise<AuthResponse> {
    try {
      console.log('🔐 Iniciando login:', { email: data.email });

      // Validar dados de entrada
      if (!data.email || !data.password) {
        return {
          success: false,
          error: 'Email e senha são obrigatórios.',
        };
      }

      // Fazer login no Firebase Auth
      const userCredential: UserCredential = await signInWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );

      const user = userCredential.user;
      console.log('✅ Login realizado no Firebase Auth:', user.uid);

      // Carregar perfil do usuário
      await this.loadUserProfile(user.uid);

      if (!this.userProfile) {
        return {
          success: false,
          error: 'Perfil do usuário não encontrado.',
        };
      }

      console.log('🎉 Login realizado com sucesso!');
      return {
        success: true,
        user: this.userProfile,
        message: 'Login realizado com sucesso!',
      };

    } catch (error) {
      console.error('❌ Erro durante o login:', error);
      return this.handleAuthError(error as AuthError);
    }
  }

  /**
   * Fazer logout
   */
  async signOutUser(): Promise<AuthResponse> {
    try {
      console.log('🚪 Fazendo logout...');
      await signOut(auth);
      this.currentUser = null;
      this.userProfile = null;
      console.log('✅ Logout realizado com sucesso!');
      
      return {
        success: true,
        message: 'Logout realizado com sucesso!',
      };
    } catch (error) {
      console.error('❌ Erro durante o logout:', error);
      return {
        success: false,
        error: 'Erro ao fazer logout.',
      };
    }
  }

  /**
   * Obter usuário atual
   */
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  /**
   * Obter perfil do usuário atual
   */
  getCurrentUserProfile(): UserData | null {
    return this.userProfile;
  }

  /**
   * Verificar se o usuário está autenticado
   */
  isAuthenticated(): boolean {
    return !!this.currentUser;
  }

  /**
   * Monitorar mudanças no estado de autenticação
   */
  onAuthStateChange(callback: (user: UserData | null) => void): () => void {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      this.currentUser = firebaseUser;
      if (firebaseUser) {
        await this.loadUserProfile(firebaseUser.uid);
        callback(this.userProfile);
      } else {
        this.userProfile = null;
        callback(null);
      }
    });
  }

  /**
   * Carregar perfil do usuário do Firestore
   */
  private async loadUserProfile(uid: string): Promise<void> {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        this.userProfile = userDoc.data() as UserData;
        console.log('✅ Perfil do usuário carregado:', this.userProfile.user_type);
      } else {
        console.warn('⚠️ Documento do usuário não encontrado no Firestore');
        this.userProfile = null;
      }
    } catch (error) {
      console.error('❌ Erro ao carregar perfil do usuário:', error);
      this.userProfile = null;
    }
  }

  /**
   * Validar dados de cadastro
   */
  private validateSignUpData(data: SignUpData): { isValid: boolean; message?: string } {
    if (!data.email || !data.password || !data.name || !data.user_type) {
      return {
        isValid: false,
        message: 'Todos os campos obrigatórios devem ser preenchidos.',
      };
    }

    if (!['customer', 'restaurant', 'delivery_driver'].includes(data.user_type)) {
      return {
        isValid: false,
        message: 'Tipo de usuário inválido.',
      };
    }

    if (data.password.length < 6) {
      return {
        isValid: false,
        message: 'A senha deve ter pelo menos 6 caracteres.',
      };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      return {
        isValid: false,
        message: 'Email inválido.',
      };
    }

    return { isValid: true };
  }

  // Função auxiliar para criar os dados específicos de cada tipo de usuário
  private createUserTypeData(uid: string, userType: UserType, userData: UserData): any {
    const now = serverTimestamp();
    const baseData = {
      user_id: uid,
      email: userData.email,
      name: userData.name,
      phone: userData.phone || '',
      created_at: now,
      updated_at: now,
    };

    switch (userType) {
      case 'customer':
        return {
          ...baseData,
          addresses: [],
          preferences: {},
        };
      case 'restaurant':
        return {
          ...baseData,
          address: '',
          cuisine_type: '',
          description: '',
          status: 'pending',
          rating: 0,
          total_reviews: 0,
        };
      case 'delivery_driver':
        return {
          ...baseData,
          vehicle_type: '',
          license_plate: '',
          status: 'offline',
          rating: 0,
          total_deliveries: 0,
        };
      default:
        throw new Error(`Tipo de usuário não suportado: ${userType}`);
    }
  }

  /**
   * Tratar erros de autenticação
   */
  private handleAuthError(error: AuthError): AuthResponse {
    console.error('Código do erro:', error.code);
    console.error('Mensagem do erro:', error.message);

    switch (error.code) {
      case 'auth/email-already-in-use':
        return {
          success: false,
          error: 'Este email já está sendo usado por outra conta.',
        };
      case 'auth/weak-password':
        return {
          success: false,
          error: 'A senha é muito fraca. Use pelo menos 6 caracteres.',
        };
      case 'auth/invalid-email':
        return {
          success: false,
          error: 'Email inválido.',
        };
      case 'auth/user-not-found':
        return {
          success: false,
          error: 'Usuário não encontrado.',
        };
      case 'auth/wrong-password':
        return {
          success: false,
          error: 'Senha incorreta.',
        };
      case 'auth/too-many-requests':
        return {
          success: false,
          error: 'Muitas tentativas de login. Tente novamente mais tarde.',
        };
      case 'auth/network-request-failed':
        return {
          success: false,
          error: 'Erro de conexão. Verifique sua internet.',
        };
      default:
        return {
          success: false,
          error: 'Erro inesperado. Tente novamente.',
        };
    }
  }
}

// Exportar instância única do serviço
export const authService = new AuthService();
export default authService;