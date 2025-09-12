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
        body: JSON.stringify({ email, password, userType }),
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

      // Mapear campos da API para interface User
      const user: User = {
        id: data.data.user.id,
        name: data.data.user.name,
        email: data.data.user.email,
        phone: data.data.user.phone,
        type: data.data.user.userType, // Mapear userType -> type
        address: data.data.user.address,
        profileImage: data.data.user.profileImage
      };

      return {
        user,
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
  async signUp(name: string, email: string, password: string, userType: UserType, phone: string): Promise<User> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password, userType, phone }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao registrar usuário');
      }

      if (!data.success) {
        throw new Error(data.message || 'Erro no registro');
      }

      // Mapear campos da API para interface User
      const user: User = {
        id: data.data.user.id,
        name: data.data.user.name,
        email: data.data.user.email,
        phone: data.data.user.phone,
        type: data.data.user.userType, // Mapear userType -> type
        address: data.data.user.address,
        profileImage: data.data.user.profileImage
      };

      return user;
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
   * Alias para getCurrentToken() - compatibilidade com outros serviços
   */
  getToken(): string | null {
    return this.getCurrentToken();
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
   * Solicita código de redefinição de senha via SMS
   */
  async requestPasswordReset(phone: string): Promise<{
    success: boolean;
    message: string;
    developmentCode?: string;
  }> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/password-reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: data.error || 'Erro ao solicitar redefinição de senha'
        };
      }

      return {
        success: true,
        message: data.message,
        ...(data.developmentCode && { developmentCode: data.developmentCode })
      };

    } catch (error) {
      console.error('Erro na solicitação de redefinição:', error);
      return {
        success: false,
        message: 'Erro de conexão. Tente novamente.'
      };
    }
  }

  /**
   * Verifica código SMS
   */
  async verifySMSCode(phone: string, code: string, purpose: 'password_reset' | 'phone_verification' = 'password_reset'): Promise<{
    success: boolean;
    message: string;
    userId?: string;
  }> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/verify-sms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone, code, purpose }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: data.error || 'Erro ao verificar código'
        };
      }

      return {
        success: true,
        message: data.message,
        userId: data.userId
      };

    } catch (error) {
      console.error('Erro na verificação do código:', error);
      return {
        success: false,
        message: 'Erro de conexão. Tente novamente.'
      };
    }
  }

  /**
   * Redefine senha usando código SMS
   */
  async resetPassword(phone: string, code: string, newPassword: string): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/password-reset`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone, code, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: data.error || 'Erro ao redefinir senha'
        };
      }

      return {
        success: true,
        message: data.message
      };

    } catch (error) {
      console.error('Erro na redefinição de senha:', error);
      return {
        success: false,
        message: 'Erro de conexão. Tente novamente.'
      };
    }
  }

  /**
   * Verifica rate limit para SMS
   */
  async checkSMSRateLimit(phone: string): Promise<{
    remaining: number;
    resetTime: number;
    canSend: boolean;
  }> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/verify-sms/rate-limit?phone=${encodeURIComponent(phone)}`);
      
      if (!response.ok) {
        return { remaining: 0, resetTime: 0, canSend: false };
      }

      return await response.json();

    } catch (error) {
      console.error('Erro ao verificar rate limit:', error);
      return { remaining: 0, resetTime: 0, canSend: false };
    }
  }

  /**
   * Valida formato de telefone brasileiro
   */
  validatePhoneFormat(phone: string): { isValid: boolean; formatted?: string; error?: string } {
    // Remove todos os caracteres não numéricos
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Verifica comprimento básico
    if (cleanPhone.length < 10 || cleanPhone.length > 13) {
      return {
        isValid: false,
        error: 'Número deve ter entre 10 e 13 dígitos'
      };
    }
    
    // Formata para padrão brasileiro
    let formattedPhone = cleanPhone;
    
    // Lista de DDDs válidos no Brasil
    const validDDDs = [
      '11', '12', '13', '14', '15', '16', '17', '18', '19', // SP
      '21', '22', '24', // RJ
      '27', '28', // ES
      '31', '32', '33', '34', '35', '37', '38', // MG
      '41', '42', '43', '44', '45', '46', // PR
      '47', '48', '49', // SC
      '51', '53', '54', '55', // RS
      '61', // DF
      '62', '64', // GO
      '63', // TO
      '65', '66', // MT
      '67', // MS
      '68', // AC
      '69', // RO
      '71', '73', '74', '75', '77', // BA
      '79', // SE
      '81', '87', // PE
      '82', // AL
      '83', // PB
      '84', // RN
      '85', '88', // CE
      '86', '89', // PI
      '91', '93', '94', // PA
      '92', '97', // AM
      '95', // RR
      '96', // AP
      '98', '99' // MA
    ];
    
    // Adiciona código do país se necessário
    if (formattedPhone.length === 11) {
      // Verifica se o DDD é válido
      const ddd = formattedPhone.substring(0, 2);
      if (!validDDDs.includes(ddd)) {
        return {
          isValid: false,
          error: 'DDD inválido'
        };
      }
      formattedPhone = '55' + formattedPhone;
    } else if (formattedPhone.length === 10) {
      // Número sem 9 inicial - adiciona DDD padrão 11 e código do país
      formattedPhone = '5511' + formattedPhone;
    } else if (formattedPhone.length === 13 && formattedPhone.startsWith('55')) {
      // Já tem código do país - verifica DDD
      const ddd = formattedPhone.substring(2, 4);
      if (!validDDDs.includes(ddd)) {
        return {
          isValid: false,
          error: 'DDD inválido'
        };
      }
    }
    
    // Valida formato final: +55XXYXXXXXXXX (X = dígito)
    const phoneRegex = /^55[1-9][0-9]{1}9?[0-9]{8}$/;
    if (!phoneRegex.test(formattedPhone)) {
      return {
        isValid: false,
        error: 'Formato de telefone inválido'
      };
    }
    
    // Formata para exibição: (XX) 9XXXX-XXXX ou (XX) XXXX-XXXX
    const displayFormat = formattedPhone.replace(/^55([1-9][0-9])(9?[0-9]{4})([0-9]{4})$/, '($1) $2-$3');
    
    return {
      isValid: true,
      formatted: displayFormat
    };
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