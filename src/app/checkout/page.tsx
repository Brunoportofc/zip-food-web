'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import StripeCheckout from '@/components/checkout/StripeCheckout';
import toast from 'react-hot-toast';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  description?: string;
}

interface Order {
  id: string;
  restaurantId: string;
  restaurantName: string;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  deliveryAddress: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    zipCode: string;
  };
}

export default function CheckoutPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'pix'>('card');

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    loadOrderData();
  }, [user]);

  const loadOrderData = async () => {
    try {
      // In a real app, this would come from cart state or URL params
      // For demo purposes, we'll create a mock order
      const mockOrder: Order = {
        id: `order_${Date.now()}`,
        restaurantId: 'restaurant_123',
        restaurantName: 'Restaurante Demo',
        items: [
          {
            id: '1',
            name: 'Pizza Margherita',
            price: 35.90,
            quantity: 1,
            image: '/images/pizza.jpg',
            description: 'Pizza tradicional com molho de tomate, mussarela e manjericão'
          },
          {
            id: '2',
            name: 'Refrigerante 350ml',
            price: 5.50,
            quantity: 2,
            image: '/images/soda.jpg',
            description: 'Coca-Cola 350ml'
          }
        ],
        subtotal: 46.90,
        deliveryFee: 8.90,
        total: 55.80,
        deliveryAddress: {
          street: 'Rua das Flores',
          number: '123',
          complement: 'Apto 45',
          neighborhood: 'Centro',
          city: 'São Paulo',
          zipCode: '01234-567'
        }
      };

      setOrder(mockOrder);
    } catch (error) {
      console.error('Error loading order:', error);
      toast.error('Erro ao carregar dados do pedido');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async (paymentIntentId: string) => {
    try {
      // Update order status in database
      const response = await fetch('/api/orders/update-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: order?.id,
          paymentIntentId,
          status: 'paid'
        }),
      });

      if (response.ok) {
        toast.success('Pedido confirmado! Redirecionando...');
        setTimeout(() => {
          router.push(`/orders/${order?.id}`);
        }, 2000);
      } else {
        toast.error('Erro ao confirmar pedido');
      }
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Erro ao confirmar pedido');
    }
  };

  const handlePaymentError = (error: string) => {
    toast.error(error);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#101828] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando checkout...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[#101828] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Pedido não encontrado</h2>
          <button
            onClick={() => router.push('/')}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
          >
            Voltar ao início
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#101828] py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Finalizar Pedido</h1>
          <p className="text-gray-600">Revise seu pedido e escolha a forma de pagamento</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Order Summary */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Resumo do Pedido</h2>
            
            <div className="mb-6">
              <h3 className="font-medium text-gray-900 mb-2">{order.restaurantName}</h3>
              <div className="space-y-3">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center space-x-3">
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-12 h-12 object-cover rounded-lg"
                      />
                    )}
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{item.name}</h4>
                      <p className="text-sm text-gray-600">{item.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {item.quantity}x R$ {item.price.toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-600">
                        R$ {(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t pt-4 mb-6">
              <h3 className="font-medium text-gray-900 mb-3">Endereço de Entrega</h3>
              <div className="text-gray-600">
                <p>{order.deliveryAddress.street}, {order.deliveryAddress.number}</p>
                {order.deliveryAddress.complement && (
                  <p>{order.deliveryAddress.complement}</p>
                )}
                <p>{order.deliveryAddress.neighborhood}</p>
                <p>{order.deliveryAddress.city} - {order.deliveryAddress.zipCode}</p>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>R$ {order.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Taxa de entrega:</span>
                  <span>R$ {order.deliveryFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-semibold text-lg border-t pt-2">
                  <span>Total:</span>
                  <span>R$ {order.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Forma de Pagamento</h2>
            
            <div className="mb-6">
              <div className="flex space-x-4">
                <button
                  onClick={() => setPaymentMethod('card')}
                  className={`flex-1 p-4 border rounded-lg text-center ${
                    paymentMethod === 'card'
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="text-2xl mb-2">💳</div>
                  <div className="font-medium">Cartão de Crédito</div>
                </button>
                
                <button
                  onClick={() => setPaymentMethod('pix')}
                  className={`flex-1 p-4 border rounded-lg text-center ${
                    paymentMethod === 'pix'
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  disabled
                >
                  <div className="text-2xl mb-2">📱</div>
                  <div className="font-medium">PIX</div>
                  <div className="text-xs text-gray-500 mt-1">Em breve</div>
                </button>
              </div>
            </div>

            {paymentMethod === 'card' && (
              <StripeCheckout
                order={order}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
              />
            )}

            {paymentMethod === 'pix' && (
              <div className="text-center py-8">
                <div className="text-gray-400 text-6xl mb-4">📱</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">PIX em breve</h3>
                <p className="text-gray-600">
                  Estamos trabalhando para disponibilizar o pagamento via PIX em breve.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}