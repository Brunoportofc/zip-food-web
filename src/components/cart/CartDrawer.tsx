'use client';

import React, { useState, useEffect } from 'react';
import { 
  MdClose, 
  MdAdd, 
  MdRemove, 
  MdDelete,
  MdLocationOn,
  MdEdit,
  MdPayment,
  MdMoney,
  MdMyLocation,
  MdSearch
} from 'react-icons/md';
import { useCartStore, CartItem, DeliveryAddress, PaymentMethod } from '@/store/cart.store';
import { toast } from 'react-hot-toast';
import { useGeoapifyAddress } from '@/hooks/useGeoapifyAddress';

interface CartDrawerProps {
  onCheckout?: (paymentMethod: PaymentMethod) => void;
}

export default function CartDrawer({ onCheckout }: CartDrawerProps) {
  const {
    items,
    restaurantName,
    deliveryFee,
    isOpen,
    deliveryAddress,
    paymentMethod,
    closeCart,
    updateQuantity,
    removeItem,
    setDeliveryAddress,
    setPaymentMethod,
    getTotalItems,
    getSubtotal,
    getTotal,
    hasItems,
    canCheckout,
    clearCart
  } = useCartStore();

  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressForm, setAddressForm] = useState<DeliveryAddress>(
    deliveryAddress || {
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      zipCode: ''
    }
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [addressSearchQuery, setAddressSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Hook do Geoapify
  const {
    getCurrentLocation,
    searchAddresses,
    parseSelectedAddress,
    addressSuggestions,
    isLoadingLocation,
    isLoadingSuggestions,
    clearSuggestions
  } = useGeoapifyAddress();

  // Efeito para buscar sugestões de endereço
  useEffect(() => {
    if (addressSearchQuery) {
      const timeoutId = setTimeout(() => {
        searchAddresses(addressSearchQuery);
        setShowSuggestions(true);
      }, 300);

      return () => clearTimeout(timeoutId);
    } else {
      clearSuggestions();
      setShowSuggestions(false);
    }
  }, [addressSearchQuery, searchAddresses, clearSuggestions]);

  // Não renderizar se o carrinho não estiver aberto
  if (!isOpen) return null;

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      removeItem(itemId);
    } else {
      updateQuantity(itemId, newQuantity);
    }
  };

  const handleAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação básica
    if (!addressForm.street || !addressForm.number || !addressForm.neighborhood || !addressForm.city || !addressForm.zipCode) {
      toast.error('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    setDeliveryAddress(addressForm);
    setShowAddressForm(false);
    toast.success('Endereço atualizado com sucesso!');
  };

  const handleCheckout = async () => {
    if (!canCheckout()) {
      toast.error('Complete as informações antes de finalizar o pedido.');
      return;
    }

    setIsProcessing(true);

    try {
      if (onCheckout) {
        await onCheckout(paymentMethod);
      }
    } catch (error) {
      console.error('Erro no checkout:', error);
      toast.error('Erro ao processar pedido. Tente novamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Usar localização atual
  const handleUseCurrentLocation = async () => {
    const address = await getCurrentLocation();
    if (address) {
      setAddressForm(address);
      setAddressSearchQuery('');
      setShowSuggestions(false);
    }
  };

  // Selecionar endereço das sugestões
  const handleSelectSuggestion = (feature: any) => {
    const parsedAddress = parseSelectedAddress(feature);
    setAddressForm(parsedAddress);
    setAddressSearchQuery(feature.properties.formatted);
    setShowSuggestions(false);
  };

  // Limpar busca e sugestões
  const handleClearSearch = () => {
    setAddressSearchQuery('');
    setShowSuggestions(false);
    clearSuggestions();
  };

  const CartItemComponent = ({ item, index }: { item: CartItem; index: number }) => (
    <div 
      className="flex items-center gap-3 py-4 border-b border-gray-100 animate-in slide-in-from-right-2 fade-in"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <img
        src={item.image}
        alt={item.name}
        className="w-16 h-16 object-cover rounded-lg flex-shrink-0 transition-transform duration-200 hover:scale-105"
      />
      
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-gray-900 truncate">{item.name}</h4>
        {item.description && (
          <p className="text-sm text-gray-500 truncate">{item.description}</p>
        )}
        <p className="text-primary font-semibold">₪ {item.price.toFixed(2)}</p>
      </div>
      
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-all duration-200 hover:scale-110 active:scale-95"
        >
          <MdRemove className="text-gray-600" size={16} />
        </button>
        
        <span className="font-medium text-gray-900 w-8 text-center transition-all duration-300">
          {item.quantity}
        </span>
        
        <button
          onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-all duration-200 hover:scale-110 active:scale-95"
        >
          <MdAdd className="text-gray-600" size={16} />
        </button>
        
        <button
          onClick={() => removeItem(item.id)}
          className="w-8 h-8 rounded-full text-error hover:bg-error-50 flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 ml-2"
        >
          <MdDelete size={16} />
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Overlay com desfoque */}
      <div 
        className={`fixed inset-0 z-40 transition-all duration-300 ease-out ${
          isOpen ? 'backdrop-blur-sm bg-black/30 opacity-100' : 'backdrop-blur-0 bg-black/0 opacity-0'
        }`}
        onClick={closeCart}
      />
      
      {/* Drawer com animação suave */}
      <div className={`fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 shadow-2xl transform transition-all duration-500 ${
        isOpen 
          ? 'translate-x-0 scale-100 opacity-100 ease-out' 
          : 'translate-x-full scale-95 opacity-0 ease-in'
      }`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
            <div className="animate-in slide-in-from-left-2 fade-in duration-300">
              <h2 className="text-xl font-semibold text-gray-900">Seu Pedido</h2>
              {restaurantName && (
                <p className="text-sm text-gray-600">{restaurantName}</p>
              )}
            </div>
            <button
              onClick={closeCart}
              className="p-2 rounded-full hover:bg-gray-100 transition-all duration-200 hover:scale-110 active:scale-95 animate-in slide-in-from-right-2 fade-in duration-300"
            >
              <MdClose size={24} className="text-gray-600" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {!hasItems() ? (
              /* Carrinho vazio */
              <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <div className="text-6xl mb-4">🛒</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Seu carrinho está vazio
                </h3>
                <p className="text-gray-600">
                  Adicione itens do cardápio para começar seu pedido
                </p>
              </div>
            ) : (
              <div className="p-4 space-y-0">
                {/* Itens do carrinho */}
                <div className="mb-6">
                  {items.map((item, index) => (
                    <CartItemComponent key={item.id} item={item} index={index} />
                  ))}
                </div>

                {/* Resumo do pedido */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h3 className="font-medium text-gray-900 mb-3">Resumo do Pedido</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-gray-600">
                      <span>Subtotal ({getTotalItems()} itens)</span>
                      <span>₪ {getSubtotal().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Taxa de entrega</span>
                      <span>₪ {deliveryFee.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-lg text-gray-900 border-t pt-2">
                      <span>Total</span>
                      <span>₪ {getTotal().toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Endereço de entrega */}
                <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-gray-900 flex items-center gap-2">
                      <MdLocationOn className="text-primary" />
                      Endereço de Entrega
                    </h3>
                    <button
                      onClick={() => setShowAddressForm(true)}
                      className="text-primary hover:text-primary-dark text-sm font-medium flex items-center gap-1"
                    >
                      <MdEdit size={16} />
                      {deliveryAddress ? 'Alterar' : 'Adicionar'}
                    </button>
                  </div>
                  
                  {deliveryAddress ? (
                    <div className="text-sm text-gray-600">
                      <p>{deliveryAddress.street}, {deliveryAddress.number}</p>
                      {deliveryAddress.complement && <p>{deliveryAddress.complement}</p>}
                      <p>{deliveryAddress.neighborhood}</p>
                      <p>{deliveryAddress.city} - {deliveryAddress.zipCode}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">
                      Adicione um endereço de entrega
                    </p>
                  )}
                </div>

                {/* Forma de pagamento */}
                <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
                  <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <MdPayment className="text-primary" />
                    Forma de Pagamento
                  </h3>
                  
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="card"
                        checked={paymentMethod === 'card'}
                        onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                        className="text-primary focus:ring-primary"
                      />
                      <div className="flex items-center gap-2">
                        <MdPayment className="text-gray-600" />
                        <span className="text-sm font-medium">Cartão de Crédito ou Débito</span>
                      </div>
                    </label>
                    
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="cash"
                        checked={paymentMethod === 'cash'}
                        onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                        className="text-primary focus:ring-primary"
                      />
                      <div className="flex items-center gap-2">
                        <MdMoney className="text-gray-600" />
                        <span className="text-sm font-medium">Dinheiro</span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer - Botão de checkout */}
          {hasItems() && (
            <div className="border-t border-gray-200 p-4 bg-white">
              <button
                onClick={handleCheckout}
                disabled={!canCheckout() || isProcessing}
                className="w-full bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processando...
                  </span>
                ) : !deliveryAddress ? (
                  'Adicione um endereço para continuar'
                ) : (
                  `Finalizar Pedido • ₪ ${getTotal().toFixed(2)}`
                )}
              </button>
              
              <button
                onClick={clearCart}
                className="w-full mt-2 text-gray-600 py-2 text-sm hover:text-gray-800 transition-all duration-200 hover:scale-105 active:scale-95"
              >
                Limpar carrinho
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal de endereço */}
      {showAddressForm && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/30 z-60 flex items-center justify-center p-4 transition-all duration-300 ease-out">
          <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto animate-in zoom-in-95 fade-in duration-300 ease-out">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 animate-in slide-in-from-left-2 fade-in duration-300">
                  Endereço de Entrega
                </h3>
                <button
                  onClick={() => setShowAddressForm(false)}
                  className="text-gray-400 hover:text-gray-600 transition-all duration-200 hover:scale-110 active:scale-95 animate-in slide-in-from-right-2 fade-in duration-300"
                >
                  <MdClose size={24} />
                </button>
              </div>

              {/* Botões de ação rápida */}
              <div className="flex gap-2 mb-4 animate-in slide-in-from-bottom-2 fade-in duration-300 delay-100">
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  disabled={isLoadingLocation}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50"
                >
                  {isLoadingLocation ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <MdMyLocation size={16} />
                  )}
                  {isLoadingLocation ? 'Localizando...' : 'Usar minha localização'}
                </button>
              </div>

              {/* Campo de busca */}
              <div className="relative mb-4 animate-in slide-in-from-bottom-2 fade-in duration-300 delay-150">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Buscar endereço
                </label>
                <div className="relative">
                  <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    value={addressSearchQuery}
                    onChange={(e) => setAddressSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500 transition-all duration-200 focus:scale-105"
                    placeholder="Digite o endereço para buscar..."
                  />
                  {addressSearchQuery && (
                    <button
                      type="button"
                      onClick={handleClearSearch}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <MdClose size={16} />
                    </button>
                  )}
                </div>

                {/* Lista de sugestões */}
                {showSuggestions && addressSuggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {isLoadingSuggestions && (
                      <div className="p-3 text-center text-gray-500">
                        <div className="inline-block w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mr-2"></div>
                        Buscando...
                      </div>
                    )}
                    {addressSuggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleSelectSuggestion(suggestion)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0"
                      >
                        <div className="text-sm font-medium text-gray-900">
                          {suggestion.properties.formatted}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <form onSubmit={handleAddressSubmit} className="space-y-4 animate-in slide-in-from-bottom-2 fade-in duration-500 delay-200">
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Rua / Avenida *
                    </label>
                    <input
                      type="text"
                      value={addressForm.street}
                      onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500 transition-all duration-200 focus:scale-105"
                      placeholder="Nome da rua"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Número *
                    </label>
                    <input
                      type="text"
                      value={addressForm.number}
                      onChange={(e) => setAddressForm({ ...addressForm, number: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500 transition-all duration-200 focus:scale-105"
                      placeholder="123"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Complemento
                  </label>
                  <input
                    type="text"
                    value={addressForm.complement}
                    onChange={(e) => setAddressForm({ ...addressForm, complement: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                    placeholder="Apartamento, bloco, etc. (opcional)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bairro *
                  </label>
                  <input
                    type="text"
                    value={addressForm.neighborhood}
                    onChange={(e) => setAddressForm({ ...addressForm, neighborhood: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                    placeholder="Nome do bairro"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cidade *
                    </label>
                    <input
                      type="text"
                      value={addressForm.city}
                      onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500 transition-all duration-200 focus:scale-105"
                      placeholder="Cidade"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      CEP *
                    </label>
                    <input
                      type="text"
                      value={addressForm.zipCode}
                      onChange={(e) => setAddressForm({ ...addressForm, zipCode: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500 transition-all duration-200 focus:scale-105"
                      placeholder="12345-678"
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4 animate-in slide-in-from-bottom-2 fade-in duration-300 delay-500">
                  <button
                    type="button"
                    onClick={() => setShowAddressForm(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-all duration-200 hover:scale-105 active:scale-95"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-all duration-200 hover:scale-105 active:scale-95"
                  >
                    Salvar Endereço
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
