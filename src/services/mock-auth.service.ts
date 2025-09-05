import { User, UserType } from '@/store/auth.store';

/**
 * Serviço de autenticação simulada para desenvolvimento
 * Credenciais fixas: admin@gmail.com / 12341234
 */
class MockAuthService {
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
  async signIn(email: string, password: string): Promise<{ user: User; token: string }> {
    // Simula delay de rede
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (email === this.MOCK_EMAIL && password === this.MOCK_PASSWORD) {
      // Infere o tipo de usuário baseado na URL atual
      const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
      let userType: UserType = 'customer'; // padrão
      
      if (currentPath.startsWith('/restaurant')) {
        userType = 'restaurant';
      } else if (currentPath.startsWith('/delivery')) {
        userType = 'delivery';
      } else if (currentPath.startsWith('/customer')) {
        userType = 'customer';
      }
      
      // Atualiza o tipo do usuário simulado
      const userWithCorrectType = {
        ...this.mockUser,
        type: userType
      };
      
      console.log(`🎭 Login simulado realizado com sucesso para tipo: ${userType}`);
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
   * Retorna usuário atual simulado
   */
  async getCurrentUser(): Promise<User | null> {
    // Simula verificação de token
    await new Promise(resolve => setTimeout(resolve, 100));
    return this.mockUser;
  }

  /**
   * Verifica se está autenticado (sempre true no modo simulado)
   */
  isAuthenticated(): boolean {
    return true;
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

export const mockAuthService = new MockAuthService();
export default MockAuthService;