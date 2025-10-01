// Status possíveis de um restaurante
export type RestaurantStatus = 'pending' | 'active' | 'suspended' | 'rejected';

// Categorias de restaurantes disponíveis (sincronizadas com o serviço)
export type RestaurantCategory = 
  | 'italian'
  | 'chinese'
  | 'japanese'
  | 'indian'
  | 'mexican'
  | 'american'
  | 'mediterranean'
  | 'thai'
  | 'french'
  | 'middle_eastern'
  | 'fast_food'
  | 'other';

// Interface principal do restaurante
export interface Restaurant {
  id: string;
  name: string;
  description: string;
  category: RestaurantCategory;
  address: string;
  phone: string;
  email: string;
  image?: string;
  deliveryFee: number;
  minimumOrder: number;
  estimatedDeliveryTime: string;
  rating: number;
  isPromoted: boolean;
  status: RestaurantStatus;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Interface para exibição simplificada do restaurante
export interface RestaurantCard {
  id: string;
  name: string;
  description: string;
  category: RestaurantCategory;
  image?: string;
  deliveryFee: number;
  minimumOrder: number;
  estimatedDeliveryTime: string;
  rating: number;
  isPromoted: boolean;
}

// Interface para filtros de busca
export interface RestaurantFilters {
  category?: RestaurantCategory;
  minRating?: number;
  maxDeliveryFee?: number;
  maxDeliveryTime?: number;
  isPromoted?: boolean;
  searchTerm?: string;
}

// Nomes de exibição das categorias (sincronizados com o serviço)
export const categoryDisplayNames: Record<RestaurantCategory, string> = {
  italian: 'Italiana',
  chinese: 'Chinesa',
  japanese: 'Japonesa',
  indian: 'Indiana',
  mexican: 'Mexicana',
  american: 'Americana',
  mediterranean: 'Mediterrânea',
  thai: 'Tailandesa',
  french: 'Francesa',
  middle_eastern: 'Oriente Médio',
  fast_food: 'Fast Food',
  other: 'Outros'
};

// Mapeamento de status para exibição
export const statusDisplayNames: Record<RestaurantStatus, string> = {
  pending: 'Pendente',
  active: 'Ativo',
  suspended: 'Suspenso',
  rejected: 'Rejeitado'
};

// Cores para cada status (usando classes centralizadas do Tailwind)
export const statusColors: Record<RestaurantStatus, string> = {
  pending: 'text-warning-600 bg-warning-100',
  active: 'text-success-600 bg-success-100',
  suspended: 'text-error-600 bg-error-100',
  rejected: 'text-gray-600 bg-gray-100'
};

// Função utilitária para converter categoria em slug
export function categoryToSlug(category: RestaurantCategory): string {
  return category.toLowerCase().replace(/[^a-z0-9]/g, '-');
}

// Mapeamento de slug para categoria
// Mapeamento de slug para categoria (sincronizado)
export const slugToCategory: Record<string, RestaurantCategory> = {
  'italian': 'italian',
  'chinese': 'chinese',
  'japanese': 'japanese',
  'indian': 'indian',
  'mexican': 'mexican',
  'american': 'american',
  'mediterranean': 'mediterranean',
  'thai': 'thai',
  'french': 'french',
  'middle-eastern': 'middle_eastern',
  'fast-food': 'fast_food',
  'other': 'other'
};

// Função utilitária para converter slug em categoria
export function getSlugToCategory(slug: string): RestaurantCategory | null {
  return slugToCategory[slug] || null;
}

// Função para validar dados de restaurante
export function validateRestaurantData(data: Partial<Restaurant>): string[] {
  const errors: string[] = [];

  if (!data.name || data.name.trim().length < 2) {
    errors.push('Nome deve ter pelo menos 2 caracteres');
  }

  if (!data.description || data.description.trim().length < 10) {
    errors.push('Descrição deve ter pelo menos 10 caracteres');
  }

  if (!data.category || !Object.keys(categoryDisplayNames).includes(data.category)) {
    errors.push('Categoria inválida');
  }

  if (!data.address || data.address.trim().length < 10) {
    errors.push('Endereço deve ter pelo menos 10 caracteres');
  }

  if (!data.phone || !/^\([0-9]{2}\)\s[0-9]{4,5}-[0-9]{4}$/.test(data.phone)) {
    errors.push('Telefone deve estar no formato (XX) XXXXX-XXXX');
  }

  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('Email inválido');
  }

  if (data.deliveryFee !== undefined && (data.deliveryFee < 0 || data.deliveryFee > 50)) {
    errors.push('Taxa de entrega deve estar entre R$ 0,00 e R$ 50,00');
  }

  if (data.minimumOrder !== undefined && (data.minimumOrder < 0 || data.minimumOrder > 200)) {
    errors.push('Pedido mínimo deve estar entre R$ 0,00 e R$ 200,00');
  }

  if (!data.estimatedDeliveryTime || !/^[0-9]+-[0-9]+\s(min|minutos)$/.test(data.estimatedDeliveryTime)) {
    errors.push('Tempo de entrega deve estar no formato "XX-XX min"');
  }

  return errors;
}

// Função para formatar preço
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(price);
}

// Função para formatar rating
export function formatRating(rating: number): string {
  return rating.toFixed(1);
}
