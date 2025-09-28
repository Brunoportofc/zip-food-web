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

// Labels para status de pedidos
export const orderStatusLabels = {
  pending: 'Aguardando',
  confirmed: 'Confirmado',
  preparing: 'Preparando',
  ready: 'Pronto',
  out_for_delivery: 'Saiu para entrega',
  delivered: 'Entregue',
  cancelled: 'Cancelado'
};

// Configurações de delivery
export const deliveryConfig = {
  defaultDeliveryTime: '30-45 min',
  freeDeliveryMinOrder: 30.00,
  promotionalMessage: 'Descubra sabores únicos e peça com facilidade',
  supportPhone: '(11) 99999-9999'
};

// Configurações de UI
export const uiConfig = {
  defaultAddress: {
    street: 'Rua das Flores, 123',
    neighborhood: 'Centro',
    city: 'São Paulo'
  },
  maxRecentSearches: 5,
  defaultCurrency: 'BRL',
  currencySymbol: 'R$'
};