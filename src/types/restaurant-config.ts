export type PaymentMethod = 
  | 'credit-card'
  | 'debit-card'
  | 'pix'
  | 'cash'
  | 'voucher'
  | 'meal-voucher';

export type DayOfWeek = 
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

export interface TimeSlot {
  start: string; // formato HH:mm
  end: string;   // formato HH:mm
}

export interface OperatingHours {
  [key: string]: {
    isOpen: boolean;
    slots: TimeSlot[];
  };
}

export interface DeliveryArea {
  id: string;
  name: string;
  coordinates: {
    lat: number;
    lng: number;
  }[];
  deliveryFee: number;
  minimumOrder: number;
  estimatedTime: number; // em minutos
  isActive: boolean;
}

export interface RestaurantConfiguration {
  id: string;
  restaurantId: string;
  
  // Dados básicos
  businessName: string;
  displayName: string;
  description: string;
  category: string;
  secondaryCategories: string[];
  
  // Contato e localização
  phone: string;
  email: string;
  address: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  
  // Configurações operacionais
  operatingHours: OperatingHours;
  paymentMethods: PaymentMethod[];
  deliveryAreas: DeliveryArea[];
  
  // Configurações de entrega
  hasDelivery: boolean;
  hasPickup: boolean;
  minimumDeliveryOrder: number;
  averageDeliveryTime: number;
  
  // Documentação
  documents: {
    cnpj: string;
    municipalLicense?: string;
    healthLicense?: string;
  };
  
  // Configurações visuais
  logo?: string;
  banner?: string;
  theme: {
    primaryColor: string;
    secondaryColor: string;
  };
  
  // Status
  isConfigured: boolean;
  isActive: boolean;
  approvalStatus: 'pending' | 'approved' | 'rejected' | 'under-review';
  
  createdAt: Date;
  updatedAt: Date;
}

// Mapeamento de métodos de pagamento
export const paymentMethodDisplayNames: Record<PaymentMethod, string> = {
  'credit-card': 'Cartão de Crédito',
  'debit-card': 'Cartão de Débito',
  'pix': 'PIX',
  'cash': 'Dinheiro',
  'voucher': 'Vale Refeição',
  'meal-voucher': 'Vale Alimentação'
};

// Mapeamento de dias da semana
export const dayOfWeekDisplayNames: Record<DayOfWeek, string> = {
  'monday': 'Segunda-feira',
  'tuesday': 'Terça-feira',
  'wednesday': 'Quarta-feira',
  'thursday': 'Quinta-feira',
  'friday': 'Sexta-feira',
  'saturday': 'Sábado',
  'sunday': 'Domingo'
};

// Horários padrão para inicialização
export const defaultOperatingHours: OperatingHours = {
  monday: { isOpen: true, slots: [{ start: '11:00', end: '14:00' }, { start: '18:00', end: '23:00' }] },
  tuesday: { isOpen: true, slots: [{ start: '11:00', end: '14:00' }, { start: '18:00', end: '23:00' }] },
  wednesday: { isOpen: true, slots: [{ start: '11:00', end: '14:00' }, { start: '18:00', end: '23:00' }] },
  thursday: { isOpen: true, slots: [{ start: '11:00', end: '14:00' }, { start: '18:00', end: '23:00' }] },
  friday: { isOpen: true, slots: [{ start: '11:00', end: '14:00' }, { start: '18:00', end: '23:00' }] },
  saturday: { isOpen: true, slots: [{ start: '11:00', end: '15:00' }, { start: '18:00', end: '00:00' }] },
  sunday: { isOpen: true, slots: [{ start: '11:00', end: '15:00' }, { start: '18:00', end: '22:00' }] }
};

// Função para validar configuração do restaurante
export function validateRestaurantConfig(config: Partial<RestaurantConfiguration>): string[] {
  const errors: string[] = [];
  
  if (!config.businessName?.trim()) {
    errors.push('Nome empresarial é obrigatório');
  }
  
  if (!config.displayName?.trim()) {
    errors.push('Nome de exibição é obrigatório');
  }
  
  if (!config.description?.trim()) {
    errors.push('Descrição é obrigatória');
  }
  
  if (!config.phone?.trim()) {
    errors.push('Telefone é obrigatório');
  }
  
  if (!config.email?.trim()) {
    errors.push('Email é obrigatório');
  }
  
  if (!config.documents?.cnpj?.trim()) {
    errors.push('CNPJ é obrigatório');
  }
  
  if (!config.address?.street?.trim()) {
    errors.push('Endereço completo é obrigatório');
  }
  
  if (!config.paymentMethods || config.paymentMethods.length === 0) {
    errors.push('Pelo menos um método de pagamento deve ser selecionado');
  }
  
  return errors;
}

// Função para verificar se está aberto no momento
export function isRestaurantOpen(operatingHours: OperatingHours, date: Date = new Date()): boolean {
  const days: DayOfWeek[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const currentDay = days[date.getDay()];
  const currentTime = date.getHours() * 60 + date.getMinutes();
  
  const daySchedule = operatingHours[currentDay];
  if (!daySchedule?.isOpen) return false;
  
  return daySchedule.slots.some(slot => {
    const [startHour, startMin] = slot.start.split(':').map(Number);
    const [endHour, endMin] = slot.end.split(':').map(Number);
    const startTime = startHour * 60 + startMin;
    let endTime = endHour * 60 + endMin;
    
    // Handle midnight crossing
    if (endTime < startTime) {
      endTime += 24 * 60;
    }
    
    return currentTime >= startTime && currentTime <= endTime;
  });
}
