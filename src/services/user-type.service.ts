// src/services/user-type.service.ts
import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  updateDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { type UserType, type User } from '@/types';

/**
 * Interface para dados estendidos do usuário no Firestore
 */
export interface UserProfile {
  id: string;
  email: string;
  name: string;
  user_type: UserType;
  phone?: string;
  avatar?: string;
  status: 'active' | 'inactive' | 'pending' | 'suspended';
  created_at: any;
  updated_at: any;
  
  // Campos específicos para restaurantes
  restaurant_id?: string;
  restaurant_name?: string;
  restaurant_status?: 'pending_approval' | 'approved' | 'rejected';
  
  // Campos específicos para entregadores - removido temporariamente
  
  // Permissões e configurações
  permissions?: string[];
  last_login?: any;
}

/**
 * Interface para configurações de tipo de usuário
 */
export interface UserTypeConfig {
  type: UserType;
  display_name: string;
  permissions: string[];
  default_status: string;
  requires_approval: boolean;
  collection_name: string;
}

class UserTypeService {
  
  /**
   * Configurações para cada tipo de usuário
   */
  private userTypeConfigs: Record<UserType, UserTypeConfig> = {
    customer: {
      type: 'customer',
      display_name: 'Cliente',
      permissions: ['place_order', 'view_menu', 'track_delivery'],
      default_status: 'active',
      requires_approval: false,
      collection_name: 'customers'
    },
    restaurant: {
      type: 'restaurant',
      display_name: 'Restaurante',
      permissions: ['manage_menu', 'view_orders', 'update_status', 'manage_restaurant'],
      default_status: 'pending_approval',
      requires_approval: true,
      collection_name: 'restaurants'
    }
  };

  /**
   * Cria o perfil do usuário no Firestore com base no tipo
   */
  async createUserProfile(userId: string, userData: {
    email: string;
    name: string;
    user_type: UserType;
    phone?: string;
    [key: string]: any;
  }): Promise<UserProfile> {
    try {
      console.log('Iniciando criação de perfil para usuário:', userId, 'tipo:', userData.user_type);
      
      const config = this.userTypeConfigs[userData.user_type];
      if (!config) {
        throw new Error(`Configuração não encontrada para o tipo de usuário: ${userData.user_type}`);
      }
      
      const userProfile: UserProfile = {
        id: userId,
        email: userData.email,
        name: userData.name,
        user_type: userData.user_type,
        phone: userData.phone,
        status: config.default_status as any,
        permissions: config.permissions,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
        last_login: serverTimestamp()
      };

      // Adicionar campos específicos baseados no tipo
      if (userData.user_type === 'restaurant') {
        userProfile.restaurant_name = userData.restaurant_name || userData.name;
        userProfile.restaurant_status = 'pending_approval';
      }

      console.log('Salvando perfil na coleção users...');
      // Salvar no documento principal de usuários
      await setDoc(doc(db, 'users', userId), userProfile);
      console.log('Perfil salvo na coleção users com sucesso');

      console.log(`Salvando perfil na coleção específica: ${config.collection_name}...`);
      // Salvar também na coleção específica do tipo de usuário
      await setDoc(doc(db, config.collection_name, userId), {
        ...userProfile,
        user_id: userId
      });
      console.log(`Perfil salvo na coleção ${config.collection_name} com sucesso`);

      return userProfile;
    } catch (error: any) {
      console.error('Erro ao criar perfil do usuário:', error);
      console.error('Detalhes do erro:', {
        code: error.code,
        message: error.message,
        userId,
        userType: userData.user_type
      });
      
      // Re-throw com mensagem mais específica
      if (error.code === 'permission-denied') {
        throw new Error(`Permissão negada ao criar perfil para ${userData.user_type}. Verifique as regras do Firestore.`);
      } else if (error.code === 'unavailable') {
        throw new Error('Serviço temporariamente indisponível. Tente novamente em alguns instantes.');
      } else if (error.message.includes('network')) {
        throw new Error('Erro de conexão ao salvar perfil. Verifique sua internet.');
      }
      
      throw error; // Re-throw o erro original se não for um caso específico
    }
  }

  /**
   * Determina a rota de redirecionamento baseada no tipo de usuário e status
   */
  getRedirectRoute(userProfile: UserProfile): string {
    switch (userProfile.user_type) {
      case 'customer':
        return '/customer';
      
      case 'restaurant':
        if (userProfile.restaurant_status === 'approved') {
          return '/restaurant';
        } else if (userProfile.restaurant_status === 'pending_approval') {
          return '/restaurant/pending';
        } else {
          return '/restaurant/register';
        }
      
      case 'delivery':
        if (userProfile.status === 'active') {
          return '/delivery';
        } else {
          return '/delivery/pending';
        }
      
      default:
        return '/customer';
    }
  }

  /**
   * Busca o perfil completo do usuário
   */
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      
      if (!userDoc.exists()) {
        return null;
      }

      return userDoc.data() as UserProfile;
    } catch (error) {
      console.error('Erro ao buscar perfil do usuário:', error);
      return null;
    }
  }

  /**
   * Verifica se o usuário tem permissão específica
   */
  async hasPermission(userId: string, permission: string): Promise<boolean> {
    const profile = await this.getUserProfile(userId);
    
    if (!profile || !profile.permissions) {
      return false;
    }

    return profile.permissions.includes(permission);
  }

  /**
   * Verifica se o usuário pode acessar a área de restaurante
   */
  async canAccessRestaurantArea(userId: string): Promise<boolean> {
    const profile = await this.getUserProfile(userId);
    
    if (!profile) {
      return false;
    }

    return profile.user_type === 'restaurant' && 
           profile.status === 'active' && 
           profile.restaurant_status === 'approved';
  }

  /**
   * Aprova um restaurante (função administrativa)
   */
  async approveRestaurant(userId: string): Promise<void> {
    const userRef = doc(db, 'users', userId);
    const restaurantRef = doc(db, 'restaurants', userId);

    await updateDoc(userRef, {
      status: 'active',
      restaurant_status: 'approved',
      updated_at: serverTimestamp()
    });

    await updateDoc(restaurantRef, {
      status: 'active',
      restaurant_status: 'approved',
      updated_at: serverTimestamp()
    });
  }

  /**
   * Atualiza o último login do usuário
   */
  async updateLastLogin(userId: string): Promise<void> {
    const userRef = doc(db, 'users', userId);
    
    await updateDoc(userRef, {
      last_login: serverTimestamp(),
      updated_at: serverTimestamp()
    });
  }

  /**
   * Busca usuários por tipo
   */
  async getUsersByType(userType: UserType): Promise<UserProfile[]> {
    try {
      const q = query(
        collection(db, 'users'),
        where('user_type', '==', userType)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => doc.data() as UserProfile);
    } catch (error) {
      console.error('Erro ao buscar usuários por tipo:', error);
      return [];
    }
  }

  /**
   * Busca restaurantes pendentes de aprovação
   */
  async getPendingRestaurants(): Promise<UserProfile[]> {
    try {
      const q = query(
        collection(db, 'users'),
        where('user_type', '==', 'restaurant'),
        where('restaurant_status', '==', 'pending_approval')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => doc.data() as UserProfile);
    } catch (error) {
      console.error('Erro ao buscar restaurantes pendentes:', error);
      return [];
    }
  }

  /**
   * Obtém configuração para um tipo de usuário
   */
  getUserTypeConfig(userType: UserType): UserTypeConfig {
    return this.userTypeConfigs[userType];
  }

  /**
   * Valida se um tipo de usuário é válido
   */
  isValidUserType(type: string): type is UserType {
    return ['customer', 'restaurant', 'delivery'].includes(type);
  }
}

export const userTypeService = new UserTypeService();