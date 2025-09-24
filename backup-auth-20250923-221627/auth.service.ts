// src/services/auth.service.ts
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  addDoc 
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';
import { type SignUpData, type SignInData, type User } from '@/types';
import { userTypeService, type UserProfile } from './user-type.service';
import { userFirestoreService } from './firestore/user.service';
import { User as FirestoreUser } from '@/types/firestore';

class AuthService {
  /**
   * Força a limpeza do cache do Firebase Auth para evitar problemas de "email já em uso"
   * @private
   */
  private async clearAuthCache(): Promise<void> {
    try {
      // Se há um usuário logado, fazer logout primeiro
      if (auth.currentUser) {
        console.log('Fazendo logout do usuário atual para limpar cache...');
        await firebaseSignOut(auth);
      }
      
      // Aguardar um pequeno delay para garantir que o estado seja limpo
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log('Cache do Firebase Auth limpo com sucesso');
    } catch (error) {
      console.warn('Aviso: Não foi possível limpar completamente o cache do Auth:', error);
      // Não lançar erro aqui, pois é apenas uma limpeza preventiva
    }
  }

  /**
   * Realiza o login de um usuário usando o Firebase Auth.
   * @param credentials - Email e senha do usuário.
   * @returns Os dados do usuário logado.
   */
  async signIn(credentials: SignInData): Promise<User & { profile?: UserProfile }> {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth, 
        credentials.email, 
        credentials.password
      );

      const firebaseUser = userCredential.user;
      
      // Buscar perfil completo do usuário
      const userProfile = await userTypeService.getUserProfile(firebaseUser.uid);
      
      if (!userProfile) {
        throw new Error('Perfil do usuário não encontrado.');
      }

      // Verificar se o tipo de usuário solicitado corresponde ao perfil
      if (credentials.userType && credentials.userType !== userProfile.user_type) {
        throw new Error(`Esta conta não é do tipo ${credentials.userType}.`);
      }

      // Verificar status da conta
      if (userProfile.status === 'suspended') {
        throw new Error('Conta suspensa. Entre em contato com o suporte.');
      }

      if (userProfile.status === 'inactive') {
        throw new Error('Conta inativa. Entre em contato com o suporte.');
      }

      // Para restaurantes, verificar aprovação
      if (userProfile.user_type === 'restaurant' && userProfile.restaurant_status === 'pending_approval') {
        throw new Error('Sua conta de restaurante ainda está pendente de aprovação.');
      }

      if (userProfile.user_type === 'restaurant' && userProfile.restaurant_status === 'rejected') {
        throw new Error('Sua conta de restaurante foi rejeitada. Entre em contato com o suporte.');
      }

      // Atualizar último login
      await userTypeService.updateLastLogin(firebaseUser.uid);

      return {
        id: firebaseUser.uid,
        email: firebaseUser.email || '',
        name: userProfile.name,
        user_type: userProfile.user_type,
        phone: userProfile.phone,
        avatar: userProfile.avatar,
        profile: userProfile
      };
    } catch (error: any) {
      console.error('Firebase SignIn Error:', error.message);
      
      // Retornar mensagens de erro mais específicas
      if (error.message.includes('user-not-found')) {
        throw new Error('Usuário não encontrado.');
      } else if (error.message.includes('wrong-password')) {
        throw new Error('Senha incorreta.');
      } else if (error.message.includes('too-many-requests')) {
        throw new Error('Muitas tentativas de login. Tente novamente mais tarde.');
      } else if (error.message.includes('Esta conta não é do tipo') || 
                 error.message.includes('pendente de aprovação') ||
                 error.message.includes('rejeitada') ||
                 error.message.includes('suspensa') ||
                 error.message.includes('inativa')) {
        throw error;
      } else {
        throw new Error('Email ou senha inválidos.');
      }
    }
  }

  /**
   * Registra um novo usuário no sistema.
   * @param userData - Dados do usuário para registro.
   * @returns Os dados do usuário registrado.
   */
  async signUp(userData: SignUpData): Promise<User & { profile?: UserProfile }> {
    let firebaseUser: any = null;
    
    try {
      // SOLUÇÃO: Limpar cache do Firebase Auth antes de tentar criar conta
      console.log('Limpando cache do Firebase Auth...');
      await this.clearAuthCache();
      
      // Validar tipo de usuário
      if (!userTypeService.isValidUserType(userData.userType)) {
        throw new Error('Tipo de usuário inválido.');
      }

      // Etapa 1: Criar usuário no Firebase Auth
      console.log('Criando usuário no Firebase Auth...');
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        userData.email,
        userData.password
      );

      firebaseUser = userCredential.user;
      console.log('Usuário criado no Firebase Auth com sucesso:', firebaseUser.uid);

      // Etapa 2: Atualizar o perfil do usuário com o nome
      console.log('Atualizando perfil do usuário...');
      await updateProfile(firebaseUser, {
        displayName: userData.name
      });

      // Etapa 3: Criar perfil completo no Firestore
      console.log('Criando perfil no Firestore...');
      const userProfile = await userTypeService.createUserProfile(firebaseUser.uid, {
        ...userData, // Incluir todos os campos de userData
        name: userData.name,
        user_type: userData.userType
      });

      console.log('Perfil criado no Firestore com sucesso');

      return {
        id: firebaseUser.uid,
        email: firebaseUser.email || '',
        name: userData.name,
        user_type: userData.userType,
        phone: userData.phone,
        profile: userProfile
      };
    } catch (error: any) {
      console.error('Firebase SignUp Error:', error.message);
      console.error('Error details:', error);
      
      // Se o erro ocorreu após a criação do usuário no Firebase Auth
      if (firebaseUser) {
        console.error('Usuário foi criado no Firebase Auth mas houve erro na criação do perfil');
        
        // Verificar se é erro de permissão do Firestore
        if (error.message.includes('permission-denied') || error.message.includes('Missing or insufficient permissions')) {
          throw new Error('Erro de permissão ao criar perfil. Verifique as regras do Firestore.');
        }
        
        // Verificar se é erro de rede
        if (error.message.includes('network') || error.message.includes('offline')) {
          throw new Error('Erro de conexão. Verifique sua internet e tente novamente.');
        }
        
        // Erro genérico após criação do usuário
        throw new Error('Conta criada no Firebase, mas houve erro ao configurar o perfil. Entre em contato com o suporte.');
      }
      
      // Erros específicos do Firebase Auth
      if (error.code === 'auth/email-already-in-use') {
        // SOLUÇÃO APRIMORADA: Mensagem mais clara e sugestão de limpeza de cache
        throw new Error('Este email já está em uso. Se você acabou de tentar criar esta conta, limpe o cache do navegador (Ctrl+Shift+Delete) e tente novamente. Caso contrário, tente fazer login ou use outro email.');
      } else if (error.code === 'auth/weak-password') {
        throw new Error('A senha é muito fraca. Use pelo menos 6 caracteres.');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Email inválido. Verifique o formato do email.');
      } else if (error.code === 'auth/operation-not-allowed') {
        throw new Error('Registro não permitido. Entre em contato com o suporte.');
      }
      
      // Erro genérico
      throw new Error('Falha ao registrar. Tente novamente ou entre em contato com o suporte.');
    }
  }

  /**
   * Sincroniza o usuário criado no Firebase Auth com o Firestore
   * @param firebaseUser - Usuário do Firebase Auth
   * @param userData - Dados originais do registro
   */
  private async syncUserToFirestore(firebaseUser: FirebaseUser, userData: SignUpData): Promise<void> {
    const userType = userData.userType;
    
    // Preparar dados para inserção no Firestore
    const userDocData = {
      id: firebaseUser.uid,
      email: firebaseUser.email,
      user_type: userType,
      name: userData.name,
      phone: userData.phone || null,
      created_at: new Date(),
      updated_at: new Date()
    };

    // Salvar na coleção users
    await setDoc(doc(db, 'users', firebaseUser.uid), userDocData);

    // Se for restaurante, criar entrada na coleção restaurants
    if (userData.userType === 'restaurant') {
      await this.createRestaurantEntry(firebaseUser, userData);
    }

    // Se for entregador, criar entrada na coleção delivery_drivers
    if (userData.userType === 'delivery') {
      await this.createDeliveryDriverEntry(firebaseUser, userData);
    }
  }

  /**
   * Cria entrada na coleção restaurants para usuários do tipo restaurant
   */
  private async createRestaurantEntry(firebaseUser: FirebaseUser, userData: SignUpData): Promise<void> {
    try {
      const restaurantData = {
        user_id: firebaseUser.uid,
        name: userData.name,
        description: 'Restaurante criado automaticamente',
        address: 'Endereço a ser definido',
        city: 'Cidade a ser definida',
        cuisine_type: 'Variada',
        phone: userData.phone,
        email: firebaseUser.email,
        created_by: firebaseUser.uid,
        created_at: new Date(),
        updated_at: new Date(),
        is_active: true,
        rating: 0,
        delivery_fee: 0
      };

      await addDoc(collection(db, 'restaurants'), restaurantData);
    } catch (error) {
      console.error('Erro ao criar entrada de restaurante:', error);
    }
  }

  /**
   * Cria entrada na coleção delivery_drivers para usuários do tipo delivery_driver
   */
  private async createDeliveryDriverEntry(firebaseUser: FirebaseUser, userData: SignUpData): Promise<void> {
    try {
      const driverData = {
        user_id: firebaseUser.uid,
        vehicle_type: 'moto',
        is_available: true,
        current_location: null,
        rating: 0,
        created_at: new Date(),
        updated_at: new Date()
      };

      await addDoc(collection(db, 'delivery_drivers'), driverData);
    } catch (error) {
      console.error('Erro ao criar entrada de entregador:', error);
    }
  }

  /**
   * Realiza o logout do usuário.
   */
  async signOut(): Promise<void> {
    try {
      await firebaseSignOut(auth);
    } catch (error: any) {
      console.error('Firebase SignOut Error:', error.message);
      throw new Error('Falha ao fazer logout.');
    }
  }

  /**
   * Observa mudanças no estado de autenticação (login, logout).
   * @param callback - Função a ser chamada quando o estado mudar.
   * @returns Um objeto com o método `unsubscribe`.
   */
  onAuthStateChange(callback: (user: (User & { profile?: UserProfile }) | null) => void) {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Buscar perfil completo do usuário
          const userProfile = await userTypeService.getUserProfile(firebaseUser.uid);
          
          if (!userProfile) {
            console.error('Perfil do usuário não encontrado');
            callback(null);
            return;
          }

          const user: User & { profile?: UserProfile } = {
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            name: userProfile.name,
            user_type: userProfile.user_type,
            phone: userProfile.phone,
            avatar: userProfile.avatar,
            profile: userProfile
          };

          callback(user);
        } catch (error) {
          console.error('Erro ao buscar dados do usuário:', error);
          callback(null);
        }
      } else {
        callback(null);
      }
    });
  }
}

export const authService = new AuthService();