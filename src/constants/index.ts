import { RestaurantCategory } from '@/types/restaurant';

// Configurações de categoria com ícones (apenas categorias válidas do enum RestaurantCategory)
export const categoryConfig: Record<RestaurantCategory, { icon: string; color: string }> = {
  'fast_food': {
    icon: '🍔',
    color: 'bg-yellow-100 text-yellow-800'
  },
  'italian': {
    icon: '🍝',
    color: 'bg-green-100 text-green-800'
  },
  'chinese': {
    icon: '🥡',
    color: 'bg-purple-100 text-purple-800'
  },
  'japanese': {
    icon: '🍣',
    color: 'bg-red-100 text-red-800'
  },
  'indian': {
    icon: '🍛',
    color: 'bg-orange-100 text-orange-800'
  },
  'mexican': {
    icon: '🌮',
    color: 'bg-orange-100 text-orange-800'
  },
  'american': {
    icon: '🍟',
    color: 'bg-red-100 text-red-800'
  },
  'mediterranean': {
    icon: '🫒',
    color: 'bg-green-100 text-green-800'
  },
  'thai': {
    icon: '🍜',
    color: 'bg-yellow-100 text-yellow-800'
  },
  'french': {
    icon: '🥐',
    color: 'bg-blue-100 text-blue-800'
  },
  'middle_eastern': {
    icon: '🥙',
    color: 'bg-purple-100 text-purple-800'
  },
  'other': {
    icon: '🍽️',
    color: 'bg-gray-100 text-gray-800'
  }
};

// Função para obter o ícone de uma categoria
export const getCategoryIcon = (category: RestaurantCategory): string => {
  return categoryConfig[category]?.icon || '🍽️';
};

// Chaves de tradução para nomes de categorias
export const categoryTranslationKeys: Record<RestaurantCategory, string> = {
  'fast_food': 'categories.fast_food',
  'italian': 'categories.italian',
  'chinese': 'categories.chinese',
  'japanese': 'categories.japanese',
  'indian': 'categories.indian',
  'mexican': 'categories.mexican',
  'american': 'categories.american',
  'mediterranean': 'categories.mediterranean',
  'thai': 'categories.thai',
  'french': 'categories.french',
  'middle_eastern': 'categories.middle_eastern',
  'other': 'categories.other'
};

// Cores para status de pedidos
export const orderStatusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  preparing: 'bg-orange-100 text-orange-800',
  ready: 'bg-green-100 text-green-800',
  out_for_delivery: 'bg-purple-100 text-purple-800',
  delivered: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800'
};

// Chaves de tradução para status de pedidos
export const orderStatusTranslationKeys = {
  pending: 'order.status.pending',
  confirmed: 'order.status.confirmed',
  preparing: 'order.status.preparing',
  ready: 'order.status.ready',
  out_for_delivery: 'order.status.out_for_delivery',
  delivered: 'order.status.delivered',
  cancelled: 'order.status.cancelled'
};

// Configurações de delivery
export const deliveryConfig = {
  defaultDeliveryTime: '30-45 דקות', // minutes in Hebrew
  freeDeliveryMinOrder: 30.00,
  supportPhone: '(11) 99999-9999'
};

// Configurações de UI
export const uiConfig = {
  defaultAddress: {
    street: 'רחוב הפרחים 123',
    neighborhood: 'מרכז העיר',
    city: 'תל אביב'
  },
  maxRecentSearches: 5,
  defaultCurrency: 'ILS',
  currencySymbol: '₪'
};

// Helper para formatar moeda israelense
export const formatCurrency = (amount: number): string => {
  return `₪${amount.toFixed(2)}`;
};

// Helper para formatar tempo
export const formatDeliveryTime = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes} דקות`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return `${hours} ${hours === 1 ? 'שעה' : 'שעות'}`;
  }
  return `${hours} ${hours === 1 ? 'שעה' : 'שעות'} ו-${remainingMinutes} דקות`;
};
