// src/services/profile.service.ts

import { User } from '@/types';
// REMOVA a importação do authService
// import { authService } from './auth.service';

export interface Address {
  id: string;
  userId: string;
  label: string;
  street: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  complement?: string;
  isDefault?: boolean;
}

export interface PaymentMethod {
  id: string;
  userId: string;
  type: 'credit' | 'debit' | 'pix';
  cardNumber?: string;
  holderName?: string;
  expiryDate?: string;
  isDefault?: boolean;
}

export interface PersonalData {
  name: string;
  email: string;
  phone: string;
  avatar?: string;
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

  // Métodos para endereços
  async getUserAddresses(userId: string): Promise<Address[]> {
    try {
      const response = await this.makeRequest(`${this.baseUrl}/addresses?userId=${userId}`);
      return response.addresses || [];
    } catch (error) {
      console.error('Erro ao buscar endereços:', error);
      return [];
    }
  }

  async addAddress(userId: string, address: Omit<Address, 'id' | 'userId'>): Promise<Address> {
    return this.makeRequest(`${this.baseUrl}/addresses`, {
      method: 'POST',
      body: JSON.stringify({ userId, ...address })
    });
  }

  async updateAddress(userId: string, addressId: string, address: Partial<Address>): Promise<Address> {
    return this.makeRequest(`${this.baseUrl}/addresses/${addressId}`, {
      method: 'PUT',
      body: JSON.stringify({ userId, ...address })
    });
  }

  async removeAddress(userId: string, addressId: string): Promise<void> {
    await this.makeRequest(`${this.baseUrl}/addresses/${addressId}`, {
      method: 'DELETE',
      body: JSON.stringify({ userId })
    });
  }

  // Métodos para métodos de pagamento
  async getUserPaymentMethods(userId: string): Promise<PaymentMethod[]> {
    try {
      const response = await this.makeRequest(`${this.baseUrl}/payment-methods?userId=${userId}`);
      return response.paymentMethods || [];
    } catch (error) {
      console.error('Erro ao buscar métodos de pagamento:', error);
      return [];
    }
  }

  async addPaymentMethod(userId: string, paymentMethod: Omit<PaymentMethod, 'id' | 'userId'>): Promise<PaymentMethod> {
    return this.makeRequest(`${this.baseUrl}/payment-methods`, {
      method: 'POST',
      body: JSON.stringify({ userId, ...paymentMethod })
    });
  }

  async removePaymentMethod(userId: string, paymentMethodId: string): Promise<void> {
    await this.makeRequest(`${this.baseUrl}/payment-methods/${paymentMethodId}`, {
      method: 'DELETE',
      body: JSON.stringify({ userId })
    });
  }

  // Método para atualizar dados pessoais
  async updatePersonalData(userId: string, data: Partial<PersonalData>): Promise<PersonalData> {
    return this.makeRequest(`${this.baseUrl}/personal`, {
      method: 'PUT',
      body: JSON.stringify({ userId, ...data })
    });
  }
}

export const profileService = new ProfileService();
export default ProfileService;
