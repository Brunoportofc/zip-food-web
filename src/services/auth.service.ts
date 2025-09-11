import { User, UserType } from '@/store/auth.store';

/**
 * Serviço de autenticação para desenvolvimento
 * Credenciais fixas: admin@gmail.com / 12341234
 */
class AuthService {
  private readonly MOCK_EMAIL = 'admin@gmail.com';
  private readonly MOCK_PASSWORD = '12341234';
  private readonly MOCK_TOKEN = 'mock-jwt-token-dev-12345';
  
  private mockUser: User = {
    id: 'mock-user-id-12345',
    name: 'Usuário de Desenvolvimento',
    email: this.MOCK_EMAIL,
    type: 'customer',
    phone: '(11) 99999-9999',
    address: 'Rua de Desenvolvimento, 123 - São Paulo, SP'
  };

  /**
   * Simula login com credenciais fixas
   */
  async signIn(email: string, password: string, userType?: UserType): Promise<{ user: User; token: string }> {
    // Simula delay de rede
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (email === this.MOCK_EMAIL && password === this.MOCK_PASSWORD) {
      // Usa o userType fornecido ou tenta obter do store de autenticação
      let finalUserType: UserType = userType || 'customer';
      
      // Se não foi fornecido userType, tenta obter do localStorage (store persistido)
      if (!userType && typeof window !== 'undefined') {
        try {
          const authData = localStorage.getItem('auth-storage');
          if (authData) {
            const parsedData = JSON.parse(authData);
            if (parsedData.state && parsedData.state.userType) {
              finalUserType = parsedData.state.userType;
            }
          }
        } catch (error) {
          console.warn('Erro ao obter userType do localStorage:', error);
        }
      }
      
      // Atualiza o tipo do usuário simulado
      const userWithCorrectType = {
        ...this.mockUser,
        type: finalUserType
      };
      
      console.log(`🎭 Login simulado realizado com sucesso para tipo: ${finalUserType}`);
      return {
        user: userWithCorrectType,
        token: this.MOCK_TOKEN
      };
    }
    
    throw new Error('Credenciais inválidas. Use: admin@gmail.com / 12341234');
  }

  /**
   * Simula registro de usuário
   */
  async signUp(name: string, email: string, password: string, userType: UserType): Promise<User> {
    // Simula delay de rede
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const newUser: User = {
      id: `mock-user-${Date.now()}`,
      name,
      email,
      type: userType,
      phone: '(11) 99999-9999'
    };
    
    console.log('🎭 Registro simulado realizado com sucesso');
    return newUser;
  }

  /**
   * Simula logout
   */
  async signOut(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 200));
    console.log('🎭 Logout simulado realizado');
  }

  /**
   * Retorna usuário atual simulado baseado na sessão persistida
   */
  async getCurrentUser(): Promise<User | null> {
    // Simula verificação de token
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Verifica se há dados de autenticação persistidos
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
  }

  /**
   * Verifica se está autenticado baseado na sessão persistida
   */
  isAuthenticated(): boolean {
    if (typeof window !== 'undefined') {
      try {
        const authData = localStorage.getItem('auth-storage');
        if (authData) {
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
   * Retorna token atual simulado
   */
  async getCurrentToken(): Promise<string | null> {
    await new Promise(resolve => setTimeout(resolve, 50));
    return this.MOCK_TOKEN;
  }

  /**
   * Atualiza dados do usuário simulado
   */
  updateMockUser(updates: Partial<User>): void {
    this.mockUser = { ...this.mockUser, ...updates };
    console.log('🎭 Dados do usuário simulado atualizados:', updates);
  }

  /**
   * Obtém credenciais de desenvolvimento
   */
  getDevCredentials(): { email: string; password: string } {
    return {
      email: this.MOCK_EMAIL,
      password: this.MOCK_PASSWORD
    };
  }

  /**
   * Auto-login para desenvolvimento
   */
  async autoLoginForDev(): Promise<{ user: User; token: string } | null> {
    console.log('🎭 Auto-login de desenvolvimento ativado');
    return await this.signIn(this.MOCK_EMAIL, this.MOCK_PASSWORD);
  }
}

export const authService = new AuthService();
export default AuthService;