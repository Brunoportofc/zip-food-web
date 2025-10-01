import Stripe from 'stripe';

export interface StripeErrorInfo {
  code: string;
  message: string;
  userMessage: string;
  statusCode: number;
  type: string;
}

export class StripeErrorHandler {
  static handleError(error: any): StripeErrorInfo {
    console.error('Stripe Error:', error);

    // Handle Stripe-specific errors
    if (error instanceof Stripe.errors.StripeError) {
      return this.handleStripeError(error);
    }

    // Handle general errors
    return {
      code: 'UNKNOWN_ERROR',
      message: error.message || 'An unknown error occurred',
      userMessage: 'Ocorreu um erro inesperado. Tente novamente.',
      statusCode: 500,
      type: 'unknown_error',
    };
  }

  private static handleStripeError(error: Stripe.errors.StripeError): StripeErrorInfo {
    const baseInfo = {
      code: error.code || 'STRIPE_ERROR',
      message: error.message,
      type: error.type,
    };

    switch (error.type) {
      case 'StripeCardError':
        return {
          ...baseInfo,
          userMessage: this.getCardErrorMessage(error.code),
          statusCode: 400,
        };

      case 'StripeRateLimitError':
        return {
          ...baseInfo,
          userMessage: 'Muitas tentativas. Aguarde um momento e tente novamente.',
          statusCode: 429,
        };

      case 'StripeInvalidRequestError':
        return {
          ...baseInfo,
          userMessage: 'Dados inválidos fornecidos. Verifique as informações e tente novamente.',
          statusCode: 400,
        };

      case 'StripeAPIError':
        return {
          ...baseInfo,
          userMessage: 'Erro no servidor de pagamentos. Tente novamente em alguns minutos.',
          statusCode: 502,
        };

      case 'StripeConnectionError':
        return {
          ...baseInfo,
          userMessage: 'Erro de conexão. Verifique sua internet e tente novamente.',
          statusCode: 503,
        };

      case 'StripeAuthenticationError':
        return {
          ...baseInfo,
          userMessage: 'Erro de autenticação no sistema de pagamentos.',
          statusCode: 401,
        };

      default:
        return {
          ...baseInfo,
          userMessage: 'Erro no processamento do pagamento. Tente novamente.',
          statusCode: 500,
        };
    }
  }

  private static getCardErrorMessage(code?: string): string {
    const cardErrorMessages: Record<string, string> = {
      'card_declined': 'Cartão recusado. Tente outro cartão ou entre em contato com seu banco.',
      'expired_card': 'Cartão expirado. Verifique a data de validade.',
      'incorrect_cvc': 'Código de segurança (CVC) incorreto.',
      'incorrect_number': 'Número do cartão incorreto.',
      'insufficient_funds': 'Saldo insuficiente. Tente outro cartão.',
      'invalid_cvc': 'Código de segurança (CVC) inválido.',
      'invalid_expiry_month': 'Mês de expiração inválido.',
      'invalid_expiry_year': 'Ano de expiração inválido.',
      'invalid_number': 'Número do cartão inválido.',
      'processing_error': 'Erro no processamento. Tente novamente.',
      'generic_decline': 'Pagamento recusado. Tente outro cartão.',
    };

    return cardErrorMessages[code || ''] || 'Erro no cartão. Verifique os dados e tente novamente.';
  }

  static logError(context: string, error: any, additionalInfo?: any): void {
    const errorInfo = this.handleError(error);
    
    console.error(`[${context}] Stripe Error:`, {
      ...errorInfo,
      originalError: error,
      additionalInfo,
      timestamp: new Date().toISOString(),
    });
  }

  static createErrorResponse(error: any) {
    const errorInfo = this.handleError(error);
    
    return {
      error: errorInfo.userMessage,
      code: errorInfo.code,
      type: errorInfo.type,
    };
  }
}

// Utility functions for common error scenarios
export const StripeErrorUtils = {
  isRetryableError(error: any): boolean {
    if (error instanceof Stripe.errors.StripeError) {
      return ['StripeRateLimitError', 'StripeAPIError', 'StripeConnectionError'].includes(error.type);
    }
    return false;
  },

  isCardError(error: any): boolean {
    return error instanceof Stripe.errors.StripeCardError;
  },

  isAuthenticationError(error: any): boolean {
    return error instanceof Stripe.errors.StripeAuthenticationError;
  },

  shouldShowToUser(error: any): boolean {
    if (error instanceof Stripe.errors.StripeError) {
      return ['StripeCardError', 'StripeRateLimitError'].includes(error.type);
    }
    return false;
  },
};
