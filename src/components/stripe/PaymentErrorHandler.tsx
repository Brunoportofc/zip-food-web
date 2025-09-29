'use client';

import React from 'react';
import { AlertTriangle, RefreshCw, CreditCard, Wifi, Clock } from 'lucide-react';

interface PaymentError {
  code: string;
  message: string;
  userMessage: string;
  type: string;
}

interface PaymentErrorHandlerProps {
  error: PaymentError | null;
  onRetry?: () => void;
  onChangePaymentMethod?: () => void;
  className?: string;
}

export default function PaymentErrorHandler({
  error,
  onRetry,
  onChangePaymentMethod,
  className = '',
}: PaymentErrorHandlerProps) {
  if (!error) return null;

  const getErrorIcon = () => {
    switch (error.type) {
      case 'StripeCardError':
        return <CreditCard className="w-8 h-8 text-red-500" />;
      case 'StripeConnectionError':
        return <Wifi className="w-8 h-8 text-orange-500" />;
      case 'StripeRateLimitError':
        return <Clock className="w-8 h-8 text-yellow-500" />;
      default:
        return <AlertTriangle className="w-8 h-8 text-red-500" />;
    }
  };

  const getErrorColor = () => {
    switch (error.type) {
      case 'StripeConnectionError':
        return 'border-orange-200 bg-orange-50';
      case 'StripeRateLimitError':
        return 'border-yellow-200 bg-yellow-50';
      default:
        return 'border-red-200 bg-red-50';
    }
  };

  const isRetryable = () => {
    return ['StripeRateLimitError', 'StripeAPIError', 'StripeConnectionError'].includes(error.type);
  };

  const isCardError = () => {
    return error.type === 'StripeCardError';
  };

  return (
    <div className={`rounded-lg border-2 p-6 ${getErrorColor()} ${className}`}>
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          {getErrorIcon()}
        </div>
        
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Erro no Pagamento
          </h3>
          
          <p className="text-gray-700 mb-4">
            {error.userMessage}
          </p>

          {/* Error-specific help text */}
          {error.type === 'StripeCardError' && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800">
                💡 <strong>Dica:</strong> Verifique se os dados do cartão estão corretos ou tente outro cartão.
              </p>
            </div>
          )}

          {error.type === 'StripeConnectionError' && (
            <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-md">
              <p className="text-sm text-orange-800">
                💡 <strong>Dica:</strong> Verifique sua conexão com a internet e tente novamente.
              </p>
            </div>
          )}

          {error.type === 'StripeRateLimitError' && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">
                💡 <strong>Dica:</strong> Aguarde alguns segundos antes de tentar novamente.
              </p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            {isRetryable() && onRetry && (
              <button
                onClick={onRetry}
                className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Tentar Novamente
              </button>
            )}

            {isCardError() && onChangePaymentMethod && (
              <button
                onClick={onChangePaymentMethod}
                className="flex items-center justify-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Alterar Cartão
              </button>
            )}

            {!isRetryable() && !isCardError() && onRetry && (
              <button
                onClick={onRetry}
                className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Tentar Novamente
              </button>
            )}
          </div>

          {/* Technical details for debugging (only in development) */}
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-4">
              <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700">
                Detalhes técnicos (desenvolvimento)
              </summary>
              <div className="mt-2 p-3 bg-gray-100 rounded-md">
                <p className="text-xs text-gray-600">
                  <strong>Código:</strong> {error.code}
                </p>
                <p className="text-xs text-gray-600">
                  <strong>Tipo:</strong> {error.type}
                </p>
                <p className="text-xs text-gray-600">
                  <strong>Mensagem:</strong> {error.message}
                </p>
              </div>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}

// Hook for handling payment errors
export function usePaymentErrorHandler() {
  const [error, setError] = React.useState<PaymentError | null>(null);

  const handleError = React.useCallback((err: any) => {
    if (err?.code && err?.userMessage) {
      // Already processed error
      setError(err);
    } else {
      // Raw error - create user-friendly message
      setError({
        code: err?.code || 'UNKNOWN_ERROR',
        message: err?.message || 'Unknown error',
        userMessage: 'Ocorreu um erro inesperado. Tente novamente.',
        type: err?.type || 'unknown_error',
      });
    }
  }, []);

  const clearError = React.useCallback(() => {
    setError(null);
  }, []);

  return {
    error,
    handleError,
    clearError,
  };
}