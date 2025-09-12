import { User } from '@/store/auth.store';
import { authService } from './auth.service';

export interface Address {
  id: string;
  label: string;
  street: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  isDefault?: boolean;
  userId: string;
}

export interface PaymentMethod {
  id: string;
  type: 'credit' | 'debit';
  cardNumber: string;
  holderName: string;
  expiryDate: string;
  isDefault?: boolean;
  userId: string;
}

export interface PersonalData {
  name: string;
  email: string;
  phone: string;
}

class ProfileService {
  private baseUrl = '/api/profile';

  // Método para fazer requisições autenticadas
  private async makeRequest(url: string, options: RequestInit = {}) {
    const token = authService.getToken();
    
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
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

  // Validações centralizadas
  private validatePersonalData(data: PersonalData): void {
    if (!data.name?.trim()) {
      throw new Error('Nome é obrigatório');
    }
    if (!data.email?.trim()) {
      throw new Error('Email é obrigatório');
    }
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      throw new Error('Email inválido');
    }
  }

  private validateAddress(address: Omit<Address, 'id' | 'userId'>): void {
    if (!address.label?.trim()) {
      throw new Error('Rótulo do endereço é obrigatório');
    }
    if (!address.street?.trim()) {
      throw new Error('Rua é obrigatória');
    }
    if (!address.city?.trim()) {
      throw new Error('Cidade é obrigatória');
    }
    if (!address.state?.trim()) {
      throw new Error('Estado é obrigatório');
    }
    if (address.zipCode && !/^\d{5}-?\d{3}$/.test(address.zipCode)) {
      throw new Error('CEP inválido');
    }
  }

  private validatePaymentMethod(payment: Omit<PaymentMethod, 'id' | 'userId'>): void {
    if (!payment.cardNumber?.trim()) {
      throw new Error('Número do cartão é obrigatório');
    }
    if (!payment.holderName?.trim()) {
      throw new Error('Nome do portador é obrigatório');
    }
    if (!payment.expiryDate?.trim()) {
      throw new Error('Data de validade é obrigatória');
    }
    if (!/^\d{2}\/\d{2}$/.test(payment.expiryDate)) {
      throw new Error('Data de validade deve estar no formato MM/AA');
    }
  }

  // Métodos de endereços
  async getUserAddresses(userId: string): Promise<Address[]> {
    try {
      const data = await this.makeRequest(`${this.baseUrl}/addresses?userId=${userId}`);
      return data.addresses || [];
    } catch (error) {
      console.error('Erro ao buscar endereços:', error);
      return this.getDevAddresses(userId);
    }
  }

  async addAddress(userId: string, addressData: Omit<Address, 'id' | 'userId'>): Promise<Address> {
    this.validateAddress(addressData);
    
    try {
      const data = await this.makeRequest(`${this.baseUrl}/addresses`, {
        method: 'POST',
        body: JSON.stringify({ ...addressData, userId }),
      });
      
      return data.address;
    } catch (error) {
      console.error('Erro ao adicionar endereço:', error);
      throw error;
    }
  }

  async removeAddress(userId: string, addressId: string): Promise<boolean> {
    try {
      await this.makeRequest(`${this.baseUrl}/addresses/${addressId}`, {
        method: 'DELETE',
      });
      
      return true;
    } catch (error) {
      console.error('Erro ao remover endereço:', error);
      return false;
    }
  }

  async updateAddress(userId: string, addressId: string, updates: Partial<Omit<Address, 'id' | 'userId'>>): Promise<Address | null> {
    try {
      const data = await this.makeRequest(`${this.baseUrl}/addresses/${addressId}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      
      return data.address || null;
    } catch (error) {
      console.error('Erro ao atualizar endereço:', error);
      throw error;
    }
  }

  // Métodos de pagamento
  async getUserPaymentMethods(userId: string): Promise<PaymentMethod[]> {
    try {
      const data = await this.makeRequest(`${this.baseUrl}/payment-methods?userId=${userId}`);
      return data.paymentMethods || [];
    } catch (error) {
      console.error('Erro ao buscar métodos de pagamento:', error);
      return this.getDevPaymentMethods(userId);
    }
  }

  async addPaymentMethod(userId: string, paymentData: Omit<PaymentMethod, 'id' | 'userId'>): Promise<PaymentMethod> {
    this.validatePaymentMethod(paymentData);
    
    try {
      const data = await this.makeRequest(`${this.baseUrl}/payment-methods`, {
        method: 'POST',
        body: JSON.stringify({ ...paymentData, userId }),
      });
      
      return data.paymentMethod;
    } catch (error) {
      console.error('Erro ao adicionar método de pagamento:', error);
      throw error;
    }
  }

  async removePaymentMethod(userId: string, paymentId: string): Promise<boolean> {
    try {
      await this.makeRequest(`${this.baseUrl}/payment-methods/${paymentId}`, {
        method: 'DELETE',
      });
      
      return true;
    } catch (error) {
      console.error('Erro ao remover método de pagamento:', error);
      return false;
    }
  }

  // Método para atualizar dados pessoais
  async updatePersonalData(userId: string, data: PersonalData): Promise<PersonalData> {
    this.validatePersonalData(data);
    
    try {
      const response = await this.makeRequest(`${this.baseUrl}/personal-data`, {
        method: 'PUT',
        body: JSON.stringify({ ...data, userId }),
      });
      
      return response.personalData;
    } catch (error) {
      console.error('Erro ao atualizar dados pessoais:', error);
      throw error;
    }
  }

  // Dados de desenvolvimento para fallback
  private getDevAddresses(userId: string): Address[] {
    return [
      {
        id: 'dev-address-1',
        label: 'Casa',
        street: 'Rua Exemplo, 123',
        neighborhood: 'Bairro Central',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01234-567',
        isDefault: true,
        userId
      },
      {
        id: 'dev-address-2',
        label: 'Trabalho',
        street: 'Av. Paulista, 1000',
        neighborhood: 'Bela Vista',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01310-100',
        isDefault: false,
        userId
      }
    ];
  }

  private getDevPaymentMethods(userId: string): PaymentMethod[] {
    return [
      {
        id: 'dev-payment-1',
        type: 'credit',
        cardNumber: '**** **** **** 1234',
        holderName: 'João Silva',
        expiryDate: '12/25',
        isDefault: true,
        userId
      },
      {
        id: 'dev-payment-2',
        type: 'debit',
        cardNumber: '**** **** **** 5678',
        holderName: 'João Silva',
        expiryDate: '08/26',
        isDefault: false,
        userId
      }
    ];
  }
}

export const profileService = new ProfileService();
export default ProfileService;