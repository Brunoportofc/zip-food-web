// Exportação centralizada dos utilitários
export * from './validation';

// Re-exportar utilitários do lib/utils para conveniência
export {
  cn,
  formatCurrency,
  formatNumber,
  formatDate,
  formatDateTime,
  formatTime,
  isValidEmail,
  isValidPassword,
  formatCPF,
  formatPhone,
  formatCEP,
  truncateText,
  generateId,
  calculateDistance,
  debounce
} from '@/lib/utils';