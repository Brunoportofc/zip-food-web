import { User } from '@/store/auth.store';

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
  private addresses: Address[] = [];
  private paymentMethods: PaymentMethod[] = [];

  constructor() {
    this.initializeMockData();
  }

  private initializeMockData() {
    // Dados mock para desenvolvimento
    this.addresses = [
      {
        id: '1',
        label: 'Casa',
        street: 'Rua Exemplo, 123',
        neighborhood: 'Bairro',
        city: 'Cidade',
        state: 'Estado',
        zipCode: '00000-000',
        isDefault: true,
        userId: 'mock-user-id-12345'
      }
    ];
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

  // Métodos para endereços
  async getUserAddresses(userId: string): Promise<Address[]> {
    return this.addresses.filter(addr => addr.userId === userId);
  }

  async addAddress(userId: string, addressData: Omit<Address, 'id' | 'userId'>): Promise<Address> {
    this.validateAddress(addressData);
    
    const newAddress: Address = {
      ...addressData,
      id: `addr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId
    };
    
    this.addresses.push(newAddress);
    return newAddress;
  }

  async removeAddress(userId: string, addressId: string): Promise<boolean> {
    const initialLength = this.addresses.length;
    this.addresses = this.addresses.filter(addr => !(addr.id === addressId && addr.userId === userId));
    return this.addresses.length < initialLength;
  }

  async updateAddress(userId: string, addressId: string, updates: Partial<Omit<Address, 'id' | 'userId'>>): Promise<Address | null> {
    const addressIndex = this.addresses.findIndex(addr => addr.id === addressId && addr.userId === userId);
    if (addressIndex === -1) {
      throw new Error('Endereço não encontrado');
    }

    const updatedAddress = { ...this.addresses[addressIndex], ...updates };
    this.validateAddress(updatedAddress);
    
    this.addresses[addressIndex] = updatedAddress;
    return this.addresses[addressIndex];
  }

  // Métodos para métodos de pagamento
  async getUserPaymentMethods(userId: string): Promise<PaymentMethod[]> {
    return this.paymentMethods.filter(pm => pm.userId === userId);
  }

  async addPaymentMethod(userId: string, paymentData: Omit<PaymentMethod, 'id' | 'userId'>): Promise<PaymentMethod> {
    this.validatePaymentMethod(paymentData);
    
    const newPayment: PaymentMethod = {
      ...paymentData,
      id: `pm-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      cardNumber: `**** **** **** ${paymentData.cardNumber.slice(-4)}` // Mascarar número do cartão
    };
    
    this.paymentMethods.push(newPayment);
    return newPayment;
  }

  async removePaymentMethod(userId: string, paymentId: string): Promise<boolean> {
    const initialLength = this.paymentMethods.length;
    this.paymentMethods = this.paymentMethods.filter(pm => !(pm.id === paymentId && pm.userId === userId));
    return this.paymentMethods.length < initialLength;
  }

  // Método para atualizar dados pessoais (mock)
  async updatePersonalData(userId: string, data: PersonalData): Promise<PersonalData> {
    this.validatePersonalData(data);
    // Em produção, aqui faria a chamada para a API
    return data;
  }
}

export const profileService = new ProfileService();
export default ProfileService;