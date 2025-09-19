// src/services/auth.service.ts
import { createClient } from '@/lib/supabase/client';
import { type SignUpData, type SignInData, type User } from '@/types';

class AuthService {
  private supabase = createClient();

  /**
   * Realiza o login de um usuário usando o Supabase Auth.
   * @param credentials - Email e senha do usuário.
   * @returns Os dados do usuário logado.
   */
  async signIn(credentials: SignInData): Promise<User> {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });

    if (error) {
      console.error('Supabase SignIn Error:', error.message);
      // Lança um erro com uma mensagem amigável
      throw new Error('Email ou senha inválidos.');
    }

    if (!data.user) {
      throw new Error('Login falhou, nenhum usuário retornado.');
    }

    // Mapeia os dados do Supabase para o seu tipo User
    return {
      id: data.user.id,
      email: data.user.email || '',
      name: data.user.user_metadata.name || 'Usuário',
      user_type: data.user.user_metadata.user_type || 'customer',
    };
  }

  /**
   * Registra um novo usuário no Supabase Auth.
   * @param userData - Dados para o registro.
   * @returns Os dados do novo usuário.
   */
  async signUp(userData: SignUpData): Promise<User> {
    const { data, error } = await this.supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        // Armazena dados extras no Supabase
        data: {
          name: userData.name,
          user_type: userData.userType,
          phone: userData.phone,
        },
      },
    });

    if (error) {
      console.error('Supabase SignUp Error:', error.message);
      throw new Error('Falha ao registrar. O email pode já estar em uso.');
    }
    
    if (!data.user) {
        throw new Error('Registro falhou, nenhum usuário retornado.');
    }

    // Sincronizar com a tabela public.users
    try {
      await this.syncUserToPublicTable(data.user, userData);
    } catch (syncError) {
      console.error('Erro ao sincronizar usuário com tabela public.users:', syncError);
      // Não falha o registro se a sincronização falhar, mas loga o erro
    }

    return {
      id: data.user.id,
      email: data.user.email || '',
      name: data.user.user_metadata.name,
      user_type: data.user.user_metadata.user_type,
    };
  }

  /**
   * Sincroniza o usuário criado no auth.users com a tabela public.users
   * @param authUser - Usuário do Supabase Auth
   * @param userData - Dados originais do registro
   */
  private async syncUserToPublicTable(authUser: any, userData: SignUpData): Promise<void> {
    // Preparar dados para inserção na tabela public.users
    const publicUserData = {
      id: authUser.id,
      email: authUser.email,
      user_type: userData.userType === 'delivery_driver' ? 'delivery' : userData.userType,
      name: userData.name,
      phone: userData.phone || null,
      password_hash: '$2b$10$synced.from.auth.users', // Hash placeholder para usuários sincronizados
      created_at: authUser.created_at,
      updated_at: authUser.updated_at || authUser.created_at
    };

    // Inserir na tabela public.users
    const { error: insertError } = await this.supabase
      .from('users')
      .insert(publicUserData);

    if (insertError) {
      console.error('Erro ao inserir usuário na tabela public.users:', insertError.message);
      throw insertError;
    }

    // Se for restaurante, criar entrada na tabela restaurants
    if (userData.userType === 'restaurant') {
      await this.createRestaurantEntry(authUser, userData);
    }

    // Se for entregador, criar entrada na tabela delivery_drivers
    if (userData.userType === 'delivery') {
      await this.createDeliveryDriverEntry(authUser, userData);
    }
  }

  /**
   * Cria entrada na tabela restaurants para usuários do tipo restaurant
   */
  private async createRestaurantEntry(authUser: any, userData: SignUpData): Promise<void> {
    const restaurantData = {
      user_id: authUser.id,
      name: userData.name,
      description: 'Restaurante criado automaticamente',
      address: 'Endereço a ser definido', // Endereço padrão para evitar erro de NOT NULL
      city: 'Cidade a ser definida',
      cuisine_type: 'Variada',
      phone: userData.phone,
      email: authUser.email,
      created_by: authUser.id,
      created_at: authUser.created_at,
      updated_at: authUser.updated_at || authUser.created_at
    };

    const { error } = await this.supabase
      .from('restaurants')
      .insert(restaurantData);

    if (error && !error.message.includes('duplicate key')) {
      console.error('Erro ao criar entrada de restaurante:', error.message);
    }
  }

  /**
   * Cria entrada na tabela delivery_drivers para usuários do tipo delivery_driver
   */
  private async createDeliveryDriverEntry(authUser: any, userData: SignUpData): Promise<void> {
    const driverData = {
      user_id: authUser.id,
      vehicle_type: 'moto' // Tipo padrão
    };

    const { error } = await this.supabase
      .from('delivery_drivers')
      .insert(driverData);

    if (error && !error.message.includes('duplicate key')) {
      console.error('Erro ao criar entrada de entregador:', error.message);
    }
  }

  /**
   * Realiza o logout do usuário.
   */
  async signOut(): Promise<void> {
    const { error } = await this.supabase.auth.signOut();
    if (error) {
      console.error('Supabase SignOut Error:', error.message);
      throw new Error('Falha ao fazer logout.');
    }
  }

  /**
   * Observa mudanças no estado de autenticação (login, logout).
   * @param callback - Função a ser chamada quando o estado mudar.
   * @returns Um objeto com o método `unsubscribe`.
   */
  onAuthStateChange(
    callback: (user: User | null) => void
  ) {
    // Verifica o estado inicial
    this.supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        const user: User = {
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata.name || 'Usuário',
          user_type: session.user.user_metadata.user_type || 'customer',
        };
        callback(user);
      } else {
        callback(null);
      }
    });

    const { data: { subscription } } = this.supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          const user: User = {
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata.name || 'Usuário',
            user_type: session.user.user_metadata.user_type || 'customer',
          };
          callback(user);
        } else if (event === 'SIGNED_OUT') {
          callback(null);
        }
      }
    );

    return subscription;
  }
}

export const authService = new AuthService();