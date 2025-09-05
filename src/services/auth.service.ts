import { auth, db } from '@/lib/firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  User as FirebaseUser,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { User, UserType } from '@/store/auth.store';
import { withFirestoreNetwork } from '@/lib/firestore-config';
import { mockAuthService } from './mock-auth.service';

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface SignUpData extends AuthCredentials {
  name: string;
  userType: UserType;
}

class AuthService {
  private userCache: User | null = null;
  private cacheTimestamp: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutos
  private get USE_MOCK_AUTH(): boolean {
    // Em produção, sempre usar Firebase
    if (process.env.NODE_ENV === 'production') return false;
    
    // Em desenvolvimento, verificar configuração do toggle
    if (typeof window !== 'undefined') {
      const authMode = localStorage.getItem('auth-mode');
      return authMode === 'mock' || authMode === null; // Default para mock em dev
    }
    
    // Fallback para mock em desenvolvimento
    return true;
  }

  /**
   * Registra um novo usuário com email e senha
   */
  async signUp({ email, password, name, userType }: SignUpData): Promise<User> {
    try {
      // Usar autenticação simulada em desenvolvimento
      if (this.USE_MOCK_AUTH) {
        console.log('🎭 Usando registro simulado para desenvolvimento');
        return await mockAuthService.signUp(name, email, password, userType);
      }
      
      // Registro Firebase (produção)
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const { user: firebaseUser } = userCredential;
      
      // Atualizar o perfil do usuário com o nome
      await updateProfile(firebaseUser, { displayName: name });
      
      // Criar documento do usuário no Firestore
      const userData: User = {
        id: firebaseUser.uid,
        name,
        email,
        type: userType,
      };
      
      await withFirestoreNetwork(async () => {
        await setDoc(doc(db, 'users', firebaseUser.uid), userData);
      });
      
      return userData;
    } catch (error) {
      console.error('Erro ao registrar usuário:', error);
      throw error;
    }
  }

  /**
   * Realiza login com email e senha
   */
  async signIn({ email, password }: AuthCredentials): Promise<{ user: User; token: string }> {
    try {
      // Usar autenticação simulada em desenvolvimento
      if (this.USE_MOCK_AUTH) {
        console.log('🎭 Usando autenticação simulada para desenvolvimento');
        const result = await mockAuthService.signIn(email, password);
        
        // Atualizar cache
        this.userCache = result.user;
        this.cacheTimestamp = Date.now();
        
        return result;
      }
      
      // Autenticação Firebase (produção)
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const { user: firebaseUser } = userCredential;
      
      try {
        // Buscar dados adicionais do usuário no Firestore
        const userDoc = await withFirestoreNetwork(async () => {
          return await getDoc(doc(db, 'users', firebaseUser.uid));
        });
        
        if (!userDoc.exists()) {
          throw new Error('Usuário não encontrado no banco de dados');
        }
        
        const userData = userDoc.data() as User;
        const token = await firebaseUser.getIdToken();
        
        // Atualizar cache
        this.userCache = userData;
        this.cacheTimestamp = Date.now();
        
        return { user: userData, token };
      } catch (firestoreError: any) {
        // Verificar se o erro é devido ao modo offline
        if (firestoreError.message && firestoreError.message.includes('offline')) {
          console.warn('Usuário autenticado, mas em modo offline. Usando dados básicos.');
          
          // Criar um objeto de usuário básico com os dados disponíveis do Auth
          const basicUserData: User = {
            id: firebaseUser.uid,
            name: firebaseUser.displayName || email.split('@')[0],
            email: firebaseUser.email || email,
            type: 'customer', // Tipo padrão, será atualizado quando online
          };
          
          const token = await firebaseUser.getIdToken();
          return { user: basicUserData, token };
        } else {
          // Se for outro tipo de erro, propagar
          throw firestoreError;
        }
      }
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      throw error;
    }
  }

  /**
   * Realiza logout do usuário
   */
  async signOut(): Promise<void> {
    try {
      // Limpar cache
      this.userCache = null;
      this.cacheTimestamp = 0;
      
      // Usar logout simulado em desenvolvimento
      if (this.USE_MOCK_AUTH) {
        await mockAuthService.signOut();
        return;
      }
      
      // Logout Firebase (produção)
      await signOut(auth);
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      throw error;
    }
  }

  /**
   * Verifica se o usuário está autenticado
   */
  isAuthenticated(): boolean {
    // Usar verificação simulada em desenvolvimento
    if (this.USE_MOCK_AUTH) {
      return mockAuthService.isAuthenticated();
    }
    
    // Verificação Firebase (produção)
    return !!auth.currentUser;
  }

  /**
   * Obtém o usuário atual
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      // Usar usuário simulado em desenvolvimento
      if (this.USE_MOCK_AUTH) {
        return await mockAuthService.getCurrentUser();
      }
      
      // Verificar se há usuário autenticado no Firebase Auth
      const firebaseUser = auth.currentUser;
      
      if (!firebaseUser) {
        this.userCache = null;
        return null;
      }

      // Verificar cache válido
      const now = Date.now();
      if (this.userCache && (now - this.cacheTimestamp) < this.CACHE_DURATION) {
        return this.userCache;
      }

      // Se não há cache válido, buscar do Firestore de forma otimizada
      try {
        const userDoc = await withFirestoreNetwork(async () => {
          return await getDoc(doc(db, 'users', firebaseUser.uid));
        });
        
        if (!userDoc.exists()) {
          this.userCache = null;
          return null;
        }
        
        const userData = userDoc.data() as User;
        
        // Atualizar cache
        this.userCache = userData;
        this.cacheTimestamp = now;
        
        return userData;
      } catch (firestoreError) {
        console.warn('Erro ao acessar Firestore, usando dados do Firebase Auth:', firestoreError);
        
        // Fallback: criar dados básicos do usuário a partir do Firebase Auth
        const fallbackUser: User = {
          id: firebaseUser.uid,
          name: firebaseUser.displayName || 'Usuário',
          email: firebaseUser.email || '',
          type: 'customer' // Tipo padrão como fallback
        };
        
        this.userCache = fallbackUser;
        this.cacheTimestamp = now;
        
        return fallbackUser;
      }
    } catch (error) {
      console.error('Erro ao obter usuário atual:', error);
      this.userCache = null;
      return null;
    }
  }
}

export const authService = new AuthService();