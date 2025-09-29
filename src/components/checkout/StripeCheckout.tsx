'use client';

import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';
import PaymentErrorHandler, { usePaymentErrorHandler } from '@/components/stripe/PaymentErrorHandler';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

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
  const stripe = useStripe();
  const elements = useElements();
  const { user } = useAuth();
  const [processing, setProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'pix'>('card');
  const { error: paymentError, handleError, clearError } = usePaymentErrorHandler();
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  useEffect(() => {
    createPaymentIntent();
  }, [order]);

  const createPaymentIntent = async () => {
    try {
      const response = await fetch('/api/stripe/payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: order.id,
          amount: Math.round(order.total * 100), // Convert to cents
          currency: 'brl',
          restaurantId: order.restaurantId,
          customerId: user?.uid,
          metadata: {
            orderTotal: order.total,
            deliveryFee: order.deliveryFee,
            subtotal: order.subtotal,
            itemCount: order.items.length
          }
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setClientSecret(data.data.clientSecret);
      } else {
        onError(data.message || 'Erro ao criar intenção de pagamento');
      }
    } catch (error: any) {
      console.error('Error creating payment intent:', error);
      handleError(error);
      onError('Erro ao processar pagamento');
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      return;
    }

    setProcessing(true);

    const cardElement = elements.getElement(CardElement);

    if (!cardElement) {
      onError('Elemento do cartão não encontrado');
      setProcessing(false);
      return;
    }

    try {
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: user?.displayName || 'Cliente',
            email: user?.email || '',
          },
        },
      });

      if (error) {
        console.error('Payment error:', error);
        onError(error.message || 'Erro no pagamento');
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        onSuccess(paymentIntent.id);
        toast.success('Pagamento realizado com sucesso!');
      }
    } catch (error) {
      console.error('Payment processing error:', error);
      onError('Erro ao processar pagamento');
    } finally {
      setProcessing(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
        fontFamily: 'system-ui, -apple-system, sans-serif',
      },
      invalid: {
        color: '#9e2146',
      },
    },
    hidePostalCode: true,
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Informações do Cartão
        </label>
        <div className="border border-gray-300 rounded-lg p-4 bg-white">
          <CardElement options={cardElementOptions} />
        </div>
      </div>

      {/* Payment Error Display */}
      <PaymentErrorHandler
        error={paymentError}
        onRetry={() => {
          clearError();
          handleSubmit();
        }}
        onChangePaymentMethod={() => {
          clearError();
          setPaymentMethod(paymentMethod === 'card' ? 'pix' : 'card');
        }}
        className="mb-6"
      />

      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-semibold text-gray-900 mb-2">Resumo do Pedido</h4>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>R$ {order.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Taxa de entrega:</span>
            <span>R$ {order.deliveryFee.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Taxa da plataforma (5%):</span>
            <span>R$ {(order.total * 0.05).toFixed(2)}</span>
          </div>
          <div className="border-t pt-1 mt-2">
            <div className="flex justify-between font-semibold">
              <span>Total:</span>
              <span>R$ {order.total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={!stripe || processing || !clientSecret}
        className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {processing ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
            Processando...
          </div>
        ) : (
          `Pagar R$ ${order.total.toFixed(2)}`
        )}
      </button>

      <div className="text-xs text-gray-500 text-center">
        <p>Pagamento seguro processado pelo Stripe</p>
        <p>Seus dados de cartão são criptografados e seguros</p>
      </div>
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
    <Elements stripe={stripePromise}>
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
    </Elements>
  );
}