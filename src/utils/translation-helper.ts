/**
 * Helper functions para tradução
 * Facilita o uso de traduções em todo o app
 */

import { RestaurantCategory } from '@/types/restaurant';
import { categoryTranslationKeys, orderStatusTranslationKeys } from '@/constants';

// Helper para obter nome traduzido de categoria
export const getCategoryName = (category: RestaurantCategory, t: (key: string) => string): string => {
  return t(categoryTranslationKeys[category]);
};

// Helper para obter status de pedido traduzido
export const getOrderStatusName = (status: string, t: (key: string) => string): string => {
  const key = orderStatusTranslationKeys[status as keyof typeof orderStatusTranslationKeys];
  return key ? t(key) : status;
};

// Helper para formatar tempo de entrega
export const formatDeliveryTime = (minutes: number, t: (key: string) => string): string => {
  if (minutes < 60) {
    return `${minutes} ${t('time.minutes')}`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return `${hours} ${t('time.hours')}`;
  }
  return `${hours} ${t('time.hours')} ${t('common.and')} ${remainingMinutes} ${t('time.minutes')}`;
};

// Helper para formatar moeda
export const formatCurrency = (amount: number): string => {
  return `₪${amount.toFixed(2)}`;
};

// Helper para formatar avaliação
export const formatRating = (rating: number): string => {
  return rating.toFixed(1);
};

// Helper para verificar se está aberto
export const getRestaurantStatus = (isOpen: boolean, t: (key: string) => string): string => {
  return isOpen ? t('restaurant.open') : t('restaurant.closed');
};

// Helper para mensagens de erro comuns
export const getErrorMessage = (error: any, t: (key: string) => string): string => {
  if (typeof error === 'string') return error;
  if (error?.message) return error.message;
  return t('messages.errorOccurred');
};

