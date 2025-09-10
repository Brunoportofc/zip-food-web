'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  MdPayment, 
  MdCreditCard, 
  MdAccountBalance, 
  MdQrCode, 
  MdArrowBack, 
  MdArrowForward,
  MdCheck,
  MdInfo
} from 'react-icons/md';
import { RestaurantConfigService } from '@/services/restaurant-config.service';
import { PaymentMethods } from '@/types/restaurant-config';
import { AnimatedContainer } from '@/components/ui/animated-container';

const PAYMENT_OPTIONS = [
  {
    id: 'credit_card',
    name: 'Cartão de Crédito',
    description: 'Visa, Mastercard, Elo, American Express',
    icon: MdCreditCard,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    popular: true
  },
  {
    id: 'debit_card',
    name: 'Cartão de Débito',
    description: 'Débito online com confirmação instantânea',
    icon: MdAccountBalance,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    popular: true
  },
  {
    id: 'pix',
    name: 'PIX',
    description: 'Pagamento instantâneo 24h por dia',
    icon: MdQrCode,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    popular: true
  },
  {
    id: 'cash_on_delivery',
    name: 'Dinheiro na Entrega',
    description: 'Pagamento em espécie no momento da entrega',
    icon: MdPayment,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    popular: false
  },
  {
    id: 'voucher',
    name: 'Vale Refeição/Alimentação',
    description: 'Ticket, Sodexo, Alelo, VR e outros',
    icon: MdCreditCard,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    popular: false
  }
];

const DELIVERY_FEE_OPTIONS = [
  { id: 'fixed', name: 'Taxa Fixa', description: 'Mesmo valor para todas as entregas' },
  { id: 'distance', name: 'Por Distância', description: 'Varia conforme a distância do cliente' },
  { id: 'free', name: 'Frete Grátis', description: 'Sem cobrança de taxa de entrega' }
];

export default function RestaurantPaymentsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethods>({
    credit_card: true,
    debit_card: true,
    pix: true,
    cash_on_delivery: false,
    voucher: false
  });
  const [deliveryFeeType, setDeliveryFeeType] = useState<'fixed' | 'distance' | 'free'>('fixed');
  const [deliveryFeeValue, setDeliveryFeeValue] = useState<number>(5.00);
  const [minOrderValue, setMinOrderValue] = useState<number>(15.00);
  const [freeDeliveryMinValue, setFreeDeliveryMinValue] = useState<number>(50.00);
  const [acceptsChange, setAcceptsChange] = useState<boolean>(true);
  const [maxChangeValue, setMaxChangeValue] = useState<number>(50.00);

  const restaurantService = new RestaurantConfigService();

  useEffect(() => {
    loadCurrentConfig();
  }, []);

  const loadCurrentConfig = async () => {
    try {
      const config = await restaurantService.getConfig();
      if (config?.paymentMethods) {
        setPaymentMethods(config.paymentMethods);
      }
      if (config?.deliveryFeeType) {
        setDeliveryFeeType(config.deliveryFeeType);
      }
      if (config?.deliveryFeeValue !== undefined) {
        setDeliveryFeeValue(config.deliveryFeeValue);
      }
      if (config?.minOrderValue !== undefined) {
        setMinOrderValue(config.minOrderValue);
      }
      if (config?.freeDeliveryMinValue !== undefined) {
        setFreeDeliveryMinValue(config.freeDeliveryMinValue);
      }
      if (config?.acceptsChange !== undefined) {
        setAcceptsChange(config.acceptsChange);
      }
      if (config?.maxChangeValue !== undefined) {
        setMaxChangeValue(config.maxChangeValue);
      }
    } catch (error) {
      console.error('Erro ao carregar configuração:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentMethodToggle = (methodId: keyof PaymentMethods) => {
    setPaymentMethods(prev => ({
      ...prev,
      [methodId]: !prev[methodId]
    }));
  };

  const handleSave = async () => {
    // Validação: pelo menos um método de pagamento deve estar selecionado
    const hasPaymentMethod = Object.values(paymentMethods).some(method => method);
    if (!hasPaymentMethod) {
      alert('Selecione pelo menos um método de pagamento.');
      return;
    }

    // Validação: se aceita dinheiro, deve informar se aceita troco
    if (paymentMethods.cash_on_delivery && acceptsChange && maxChangeValue <= 0) {
      alert('Informe o valor máximo para troco.');
      return;
    }

    setIsSaving(true);
    try {
      await restaurantService.updateConfig({
        paymentMethods,
        deliveryFeeType,
        deliveryFeeValue,
        minOrderValue,
        freeDeliveryMinValue,
        acceptsChange,
        maxChangeValue
      });
      
      router.push('/restaurant/setup/delivery-areas');
    } catch (error) {
      console.error('Erro ao salvar métodos de pagamento:', error);
      alert('Erro ao salvar configurações. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-gray-600">Carregando configurações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8">
        <AnimatedContainer>
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-primary/10 rounded-xl">
                  <MdPayment className="text-2xl text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Métodos de Pagamento</h1>
                  <p className="text-gray-600 mt-1">
                    Configure as formas de pagamento aceitas pelo seu restaurante
                  </p>
                </div>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Formas de Pagamento</h2>
              
              <div className="grid md:grid-cols-2 gap-4">
                {PAYMENT_OPTIONS.map((option) => {
                  const IconComponent = option.icon;
                  const isSelected = paymentMethods[option.id as keyof PaymentMethods];
                  
                  return (
                    <div
                      key={option.id}
                      onClick={() => handlePaymentMethodToggle(option.id as keyof PaymentMethods)}
                      className={`relative p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                        isSelected 
                          ? 'border-primary bg-primary/5' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {option.popular && (
                        <div className="absolute -top-2 -right-2 bg-primary text-white text-xs px-2 py-1 rounded-full font-medium">
                          Popular
                        </div>
                      )}
                      
                      <div className="flex items-start space-x-3">
                        <div className={`p-2 rounded-lg ${option.bgColor}`}>
                          <IconComponent className={`text-xl ${option.color}`} />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold text-gray-900">{option.name}</h3>
                            {isSelected && (
                              <MdCheck className="text-primary text-lg" />
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{option.description}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Cash on Delivery Settings */}
            {paymentMethods.cash_on_delivery && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Configurações de Dinheiro</h2>
                
                <div className="space-y-4">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={acceptsChange}
                      onChange={(e) => setAcceptsChange(e.target.checked)}
                      className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                    />
                    <span className="text-gray-900 font-medium">Aceita troco</span>
                  </label>
                  
                  {acceptsChange && (
                    <div className="ml-7">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Valor máximo para troco (R$)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={maxChangeValue}
                        onChange={(e) => setMaxChangeValue(parseFloat(e.target.value) || 0)}
                        className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="50.00"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Delivery Fee */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Taxa de Entrega</h2>
              
              <div className="space-y-4">
                {DELIVERY_FEE_OPTIONS.map((option) => (
                  <label key={option.id} className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="deliveryFeeType"
                      value={option.id}
                      checked={deliveryFeeType === option.id}
                      onChange={(e) => setDeliveryFeeType(e.target.value as 'fixed' | 'distance' | 'free')}
                      className="w-4 h-4 text-primary border-gray-300 focus:ring-primary mt-1"
                    />
                    <div>
                      <div className="font-medium text-gray-900">{option.name}</div>
                      <div className="text-sm text-gray-600">{option.description}</div>
                    </div>
                  </label>
                ))}
                
                {deliveryFeeType === 'fixed' && (
                  <div className="ml-7 mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Valor da taxa de entrega (R$)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={deliveryFeeValue}
                      onChange={(e) => setDeliveryFeeValue(parseFloat(e.target.value) || 0)}
                      className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="5.00"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Order Settings */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Configurações de Pedido</h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valor mínimo do pedido (R$)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={minOrderValue}
                    onChange={(e) => setMinOrderValue(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="15.00"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Valor mínimo para aceitar pedidos
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Frete grátis a partir de (R$)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={freeDeliveryMinValue}
                    onChange={(e) => setFreeDeliveryMinValue(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="50.00"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Deixe 0 para desabilitar frete grátis
                  </p>
                </div>
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
              <div className="flex items-start space-x-3">
                <MdInfo className="text-blue-600 text-xl mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Dica importante:</p>
                  <p>
                    Oferecer múltiplas formas de pagamento aumenta suas vendas. 
                    PIX e cartões são os métodos mais populares entre os clientes.
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => router.push('/restaurant/setup/hours')}
                className="flex items-center space-x-2 px-6 py-3 text-gray-600 hover:text-gray-800 font-medium transition-colors"
              >
                <MdArrowBack className="text-lg" />
                <span>Voltar</span>
              </button>
              
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center space-x-2 px-8 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <MdArrowForward className="text-lg" />
                )}
                <span>{isSaving ? 'Salvando...' : 'Continuar'}</span>
              </button>
            </div>
          </div>
        </AnimatedContainer>
      </div>
    </div>
  );
}