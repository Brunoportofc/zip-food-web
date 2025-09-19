// src/services/profile.service.ts

import { User } from '@/store/auth.store';
// REMOVA a importação do authService
// import { authService } from './auth.service';

export interface Address {
  // ... (interface permanece a mesma)
}

export interface PaymentMethod {
  // ... (interface permanece a mesma)
}

export interface PersonalData {
  // ... (interface permanece a mesma)
}

class ProfileService {
  private baseUrl = '/api/profile';

  // Método para fazer requisições (agora sem autenticação manual)
  private async makeRequest(url: string, options: RequestInit = {}) {
    // A lógica de token foi removida daqui
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Erro desconhecido' }));
      throw new Error(errorData.message || `Erro ${response.status}`);
    }

    return response.json();
  }

  // ... (O restante da classe, com as validações e métodos, permanece exatamente o mesmo)

  // ... (Cole o restante da sua classe ProfileService aqui)
}

export const profileService = new ProfileService();
export default ProfileService;