import { User, UserType } from '@/store/auth.store';
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
  /**
   * Registra um novo usuário com email e senha
   */
  async signUp({ email, password, name, userType }: SignUpData): Promise<User> {
    return await mockAuthService.signUp(name, email, password, userType);
  }

  /**
   * Realiza login com email e senha
   */
  async signIn({ email, password }: AuthCredentials): Promise<{ user: User; token: string }> {
    return await mockAuthService.signIn(email, password);
  }

  /**
   * Realiza logout do usuário
   */
  async signOut(): Promise<void> {
    return await mockAuthService.signOut();
  }

  /**
   * Verifica se o usuário está autenticado
   */
  isAuthenticated(): boolean {
    return mockAuthService.isAuthenticated();
  }

  /**
   * Obtém o usuário atual
   */
  async getCurrentUser(): Promise<User | null> {
    return await mockAuthService.getCurrentUser();
  }

  /**
   * Obtém o token do usuário atual
   */
  async getCurrentToken(): Promise<string | null> {
    return await mockAuthService.getCurrentToken();
  }

  /**
   * Função de auto-login para desenvolvimento
   */
  async autoLoginForDev(): Promise<{ user: User; token: string } | null> {
    return await mockAuthService.autoLoginForDev();
  }
}

export const authService = new AuthService();