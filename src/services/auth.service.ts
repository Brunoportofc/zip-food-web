// src/services/auth.service.ts
// Serviço de autenticação usando Firebase Client SDK

import { auth, db } from '@/lib/firebase/config';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  onAuthStateChanged,
  User,
  UserCredential
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  serverTimestamp 
} from 'firebase/firestore';

// Tipos
export type UserRole = 'customer' | 'restaurant' | 'delivery';

export interface UserData {
  uid: string;
  email: string;
  displayName?: string;
  role: UserRole;
  user_type: UserRole; // Adicionar para compatibilidade
  phone?: string;
  createdAt: any;
  updatedAt: any;
}

export interface SignUpData {
  email: string;
  password: string;
  displayName: string;
  role: UserRole;
  phone?: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  user?: UserData;
  message?: string;
  error?: string;
}

class AuthService {
  /**
   * Cadastrar novo usuário
   */
  async signUp(data: SignUpData): Promise<AuthResponse> {
    try {
      console.log('🚀 Iniciando cadastro:', { email: data.email, role: data.role });

      // Criar usuário no Firebase Auth
      const userCredential: UserCredential = await createUserWithEmailAndPassword(
        auth, 
        data.email, 
        data.password
      );
      
      const user = userCredential.user;
      console.log('✅ Usuário criado no Firebase Auth:', user.uid);

      // Preparar dados do usuário para o Firestore
      const userData: UserData = {
        uid: user.uid,
        email: user.email || '',
        displayName: data.displayName,
        role: data.role,
        user_type: data.role, // Adicionar user_type para compatibilidade
        phone: data.phone || '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // Salvar dados do usuário no Firestore com retry
      try {
        await setDoc(doc(db, 'users', user.uid), userData);
        console.log('✅ Dados do usuário salvos no Firestore');
      } catch (firestoreError) {
        console.error('❌ Erro ao salvar no Firestore:', firestoreError);
        
        // Se falhar ao salvar no Firestore, deletar o usuário do Auth para evitar conta órfã
        try {
          await user.delete();
          console.log('🧹 Usuário removido do Firebase Auth devido ao erro no Firestore');
        } catch (deleteError) {
          console.error('❌ Erro ao limpar usuário do Auth:', deleteError);
        }
        
        throw new Error('Erro ao salvar dados do usuário. Tente novamente.');
      }

      return {
        success: true,
        user: userData,
        message: 'Conta criada com sucesso!'
      };

    } catch (error: any) {
      console.error('❌ Erro durante o cadastro:', error);
      
      let errorMessage = 'Erro inesperado durante o cadastro';
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'Este email já está sendo usado por outra conta';
          break;
        case 'auth/weak-password':
          errorMessage = 'A senha é muito fraca. Use pelo menos 6 caracteres';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Email inválido';
          break;
        default:
          errorMessage = error.message || errorMessage;
      }

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Fazer login
   */
  async signIn(data: SignInData): Promise<AuthResponse> {
    try {
      console.log('🔐 Iniciando login:', { email: data.email });

      // Fazer login no Firebase Auth
      const userCredential: UserCredential = await signInWithEmailAndPassword(
        auth, 
        data.email, 
        data.password
      );
      
      const user = userCredential.user;
      console.log('✅ Login realizado no Firebase Auth:', user.uid);

      // Buscar dados do usuário no Firestore
      let userData = await this.getUserData(user.uid);
      
      // Se não encontrar dados do usuário, pode ser uma conta órfã
      if (!userData) {
        console.log('⚠️ Dados do usuário não encontrados no Firestore. Tentando recuperar...');
        
        // Tentar criar os dados básicos do usuário no Firestore
        const basicUserData: UserData = {
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || user.email?.split('@')[0] || 'Usuário',
          role: 'customer', // Padrão para contas órfãs
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        try {
          await setDoc(doc(db, 'users', user.uid), basicUserData);
          console.log('✅ Dados básicos do usuário criados no Firestore');
          userData = basicUserData;
        } catch (firestoreError) {
          console.error('❌ Erro ao criar dados básicos do usuário:', firestoreError);
          throw new Error('Não foi possível recuperar os dados da conta. Entre em contato com o suporte.');
        }
      }

      return {
        success: true,
        user: userData,
        message: 'Login realizado com sucesso!'
      };

    } catch (error: any) {
      console.error('❌ Erro durante o login:', error);
      
      let errorMessage = 'Erro inesperado durante o login';
      
      switch (error.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          errorMessage = 'Email ou senha incorretos';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Email inválido';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Muitas tentativas de login. Tente novamente mais tarde';
          break;
        default:
          errorMessage = error.message || errorMessage;
      }

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Fazer logout
   */
  async signOut(): Promise<AuthResponse> {
    try {
      console.log('🚪 Fazendo logout...');
      await signOut(auth);
      console.log('✅ Logout realizado com sucesso');
      
      return {
        success: true,
        message: 'Logout realizado com sucesso!'
      };
    } catch (error: any) {
      console.error('❌ Erro durante o logout:', error);
      return {
        success: false,
        error: 'Erro ao fazer logout'
      };
    }
  }

  /**
   * Buscar dados do usuário no Firestore
   */
  async getUserData(uid: string): Promise<UserData | null> {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      
      if (userDoc.exists()) {
        return userDoc.data() as UserData;
      }
      
      return null;
    } catch (error) {
      console.error('❌ Erro ao buscar dados do usuário:', error);
      return null;
    }
  }

  /**
   * Buscar papel do usuário
   */
  async getUserRole(uid: string): Promise<UserRole | null> {
    try {
      const userData = await this.getUserData(uid);
      return userData?.role || null;
    } catch (error) {
      console.error('❌ Erro ao buscar papel do usuário:', error);
      return null;
    }
  }

  /**
   * Observar mudanças no estado de autenticação
   */
  onAuthStateChanged(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, callback);
  }

  /**
   * Obter usuário atual
   */
  getCurrentUser(): User | null {
    return auth.currentUser;
  }
}

// Exportar instância única do serviço
export const authService = new AuthService();
export default authService;
