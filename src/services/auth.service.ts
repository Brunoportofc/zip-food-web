import { User, UserType } from '@/store/auth.store';

/**
 * Serviço de autenticação integrado com o backend Supabase
 */
class AuthService {
  private readonly API_BASE_URL = '/api/auth';

  /**
   * Faz login usando as APIs do backend
   */
  async signIn(email: string, password: string, userType?: UserType): Promise<{ user: User; token: string }> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao fazer login');
      }

      if (!data.success) {
        throw new Error(data.message || 'Credenciais inválidas');
      }

      // Armazenar token no localStorage para persistência
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth-token', data.data.token);
      }

      return {
        user: data.data.user,
        token: data.data.token
      };
    } catch (error) {
      console.error('Erro no login:', error);
      throw error;
    }
  }

  /**
   * Registra novo usuário usando as APIs do backend
   */
  async signUp(name: string, email: string, password: string, userType: UserType): Promise<User> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password, userType }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao registrar usuário');
      }

      if (!data.success) {
        throw new Error(data.message || 'Erro no registro');
      }

      return data.data.user;
    } catch (error) {
      console.error('Erro no registro:', error);
      throw error;
    }
  }

  /**
   * Faz logout removendo o token
   */
  async signOut(): Promise<void> {
    try {
      // Remover token do localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth-token');
      }
      
      console.log('Logout realizado com sucesso');
    } catch (error) {
      console.error('Erro no logout:', error);
      throw error;
    }
  }

  /**
   * Obtém o usuário atual baseado no token armazenado
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      const token = this.getCurrentToken();
      if (!token) {
        return null;
      }

      // Verificar se há dados de autenticação persistidos no store
      if (typeof window !== 'undefined') {
        try {
          const authData = localStorage.getItem('auth-storage');
          if (authData) {
            const parsedData = JSON.parse(authData);
            if (parsedData.state && parsedData.state.isAuthenticated && parsedData.state.user) {
              return parsedData.state.user;
            }
          }
        } catch (error) {
          console.error('Erro ao verificar dados de autenticação:', error);
        }
      }

      return null;
    } catch (error) {
      console.error('Erro ao obter usuário atual:', error);
      return null;
    }
  }

  /**
   * Verifica se está autenticado baseado na sessão persistida
   */
  isAuthenticated(): boolean {
    if (typeof window !== 'undefined') {
      try {
        const token = localStorage.getItem('auth-token');
        const authData = localStorage.getItem('auth-storage');
        
        if (token && authData) {
          const parsedData = JSON.parse(authData);
          return parsedData.state && parsedData.state.isAuthenticated === true;
        }
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
      }
    }
    return false;
  }

  /**
   * Retorna token atual armazenado
   */
  getCurrentToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth-token');
    }
    return null;
  }

  /**
   * Atualiza perfil do usuário usando a API do backend
   */
  async updateProfile(updates: Partial<User>): Promise<User> {
    try {
      const token = this.getCurrentToken();
      if (!token) {
        throw new Error('Token de autenticação não encontrado');
      }

      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao atualizar perfil');
      }

      if (!data.success) {
        throw new Error(data.message || 'Erro na atualização');
      }

      return data.data;
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      throw error;
    }
  }

  /**
   * Método para desenvolvimento - credenciais de teste
   */
  getDevCredentials(): { email: string; password: string } {
    return {
      email: 'admin@gmail.com',
      password: '12341234'
    };
  }

  /**
   * Auto-login para desenvolvimento (opcional)
   */
  async autoLoginForDev(): Promise<{ user: User; token: string } | null> {
    try {
      const { email, password } = this.getDevCredentials();
      return await this.signIn(email, password);
    } catch (error) {
      console.warn('Auto-login de desenvolvimento falhou:', error);
      return null;
    }
  }
}

export const authService = new AuthService();
export default AuthService;