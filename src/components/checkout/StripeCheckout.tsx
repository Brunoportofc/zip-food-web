'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';

interface Order {
  id: string;
  restaurantId: string;
  items: any[];
  total: number;
  deliveryFee: number;
  subtotal: number;
}

interface StripeCheckoutFormProps {
  order: Order;
  onSuccess: (paymentIntentId: string) => void;
  onError: (error: string) => void;
}

function StripeCheckoutForm({ order, onSuccess, onError }: StripeCheckoutFormProps) {
  const [processing, setProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'pix'>('card');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setProcessing(true);

    try {
      // Simulação de pagamento para deploy
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simular sucesso do pagamento
      const mockPaymentId = `pi_${Date.now()}`;
      onSuccess(mockPaymentId);
      toast.success('Pagamento realizado com sucesso!');
    } catch (error) {
      console.error('Payment processing error:', error);
      onError('Erro ao processar pagamento');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Resumo do pedido */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-3">Resumo do Pedido</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>R$ {order.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Taxa de entrega</span>
            <span>R$ {order.deliveryFee.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-semibold text-base border-t pt-2">
            <span>Total</span>
            <span>R$ {order.total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Método de pagamento */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-900">Método de Pagamento</h4>
        
        <div className="space-y-3">
          <label className="flex items-center">
            <input
              type="radio"
              name="paymentMethod"
              value="card"
              checked={paymentMethod === 'card'}
              onChange={(e) => setPaymentMethod(e.target.value as 'card' | 'pix')}
              className="mr-3"
            />
            <span>Cartão de Crédito/Débito</span>
          </label>
          
          <label className="flex items-center">
            <input
              type="radio"
              name="paymentMethod"
              value="pix"
              checked={paymentMethod === 'pix'}
              onChange={(e) => setPaymentMethod(e.target.value as 'card' | 'pix')}
              className="mr-3"
            />
            <span>PIX</span>
          </label>
        </div>
      </div>

      {/* Simulação de campo de cartão */}
      {paymentMethod === 'card' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Número do Cartão
            </label>
            <input
              type="text"
              placeholder="**** **** **** ****"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Validade
              </label>
              <input
                type="text"
                placeholder="MM/AA"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CVV
              </label>
              <input
                type="text"
                placeholder="123"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled
              />
            </div>
          </div>
        </div>
      )}

      {/* Botão de pagamento */}
      <button
        type="submit"
        disabled={processing}
        className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
      >
        {processing ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processando...
          </span>
        ) : (
          `Pagar R$ ${order.total.toFixed(2)}`
        )}
      </button>

      <p className="text-xs text-gray-500 text-center">
        * Esta é uma versão de demonstração. O pagamento real será implementado posteriormente.
      </p>
    </form>
  );
}

interface StripeCheckoutProps {
  order: Order;
  onSuccess: (paymentIntentId: string) => void;
  onError: (error: string) => void;
}

export default function StripeCheckout({ order, onSuccess, onError }: StripeCheckoutProps) {
  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center mb-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Finalizar Pagamento
          </h3>
          <p className="text-gray-600">
            Complete seu pedido com pagamento seguro
          </p>
        </div>

        <StripeCheckoutForm 
          order={order} 
          onSuccess={onSuccess} 
          onError={onError} 
        />
      </div>
    </div>
  );
}