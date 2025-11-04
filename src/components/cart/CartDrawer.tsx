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
import { useLanguage } from '@/contexts/LanguageContext';
import { formatCurrency } from '@/utils/translation-helper';

interface CartDrawerProps {
  onCheckout?: (paymentMethod: PaymentMethod) => void;
}

export default function CartDrawer({ onCheckout }: CartDrawerProps) {
  const { t, language } = useLanguage();
  const isRTL = language === 'he';
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
      toast.error(t('validation.requiredField'));
      return;
    }

    setDeliveryAddress(addressForm);
    setShowAddressForm(false);
    toast.success(t('address.addressSaved'));
  };

  const handleCheckout = async () => {
    if (!canCheckout()) {
      toast.error(t('messages.somethingWentWrong'));
      return;
    }

    setIsProcessing(true);

    try {
      if (onCheckout) {
        await onCheckout(paymentMethod);
      }
    } catch (error) {
      console.error('Erro no checkout:', error);
      toast.error(t('order.errorProcessing'));
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
      className={`flex ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-center gap-3 py-4 border-b border-gray-700 animate-in fade-in ${isRTL ? 'slide-in-from-left-2' : 'slide-in-from-right-2'}`}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <img
        src={item.image}
        alt={item.name}
        className="w-16 h-16 object-cover rounded-lg flex-shrink-0 transition-transform duration-200 hover:scale-105"
      />
      
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-white truncate">{item.name}</h4>
        {item.description && (
          <p className="text-sm text-gray-400 truncate">{item.description}</p>
        )}
        <p className="text-green-400 font-semibold" dir="ltr">₪ {item.price.toFixed(2)}</p>
      </div>
      
      <div className={`flex ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-center gap-2 flex-shrink-0`}>
        <button
          onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
          className="w-8 h-8 rounded-full border border-gray-600 bg-gray-800 flex items-center justify-center hover:bg-gray-700 hover:border-green-500 transition-all duration-200 hover:scale-110 active:scale-95"
        >
          <MdRemove className="text-gray-300 hover:text-green-400" size={16} />
        </button>
        
        <span className="font-medium text-white w-8 text-center transition-all duration-300">
          {item.quantity}
        </span>
        
        <button
          onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
          className="w-8 h-8 rounded-full border border-gray-600 bg-gray-800 flex items-center justify-center hover:bg-gray-700 hover:border-green-500 transition-all duration-200 hover:scale-110 active:scale-95"
        >
          <MdAdd className="text-gray-300 hover:text-green-400" size={16} />
        </button>
        
        <button
          onClick={() => removeItem(item.id)}
          className={`w-8 h-8 rounded-full bg-red-900/30 border border-red-700 text-red-400 hover:bg-red-800 hover:text-red-300 flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 ${isRTL ? 'mr-2' : 'ml-2'}`}
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
      
      {/* Drawer com animação suave - RTL aware */}
      <div 
        style={{
          [isRTL ? 'left' : 'right']: 0,
          transform: isOpen 
            ? 'translateX(0) scale(1)' 
            : isRTL 
              ? 'translateX(-100%) scale(0.95)' 
              : 'translateX(100%) scale(0.95)',
          opacity: isOpen ? 1 : 0
        }}
        className={`fixed top-0 h-full w-full max-w-md bg-[#101828] z-50 shadow-2xl transition-all duration-500 ${
          isOpen ? 'ease-out' : 'ease-in'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className={`flex ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-center justify-between p-4 border-b border-gray-800 bg-gray-900`}>
            <div className={`animate-in fade-in duration-300 ${isRTL ? 'slide-in-from-right-2' : 'slide-in-from-left-2'}`}>
              <h2 className="text-xl font-semibold text-white">{t('cart.myCart')}</h2>
              {restaurantName && (
                <p className="text-sm text-gray-400">{restaurantName}</p>
              )}
            </div>
            <button
              onClick={closeCart}
              className={`p-2 rounded-full hover:bg-gray-800 transition-all duration-200 hover:scale-110 active:scale-95 animate-in fade-in duration-300 ${isRTL ? 'slide-in-from-left-2' : 'slide-in-from-right-2'}`}
            >
              <MdClose size={24} className="text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {!hasItems() ? (
              /* Carrinho vazio */
              <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <div className="text-6xl mb-4">🛒</div>
                <h3 className="text-lg font-medium text-white mb-2">
                  {t('cart.cartIsEmpty')}
                </h3>
                <p className="text-gray-400">
                  {t('cart.startShopping')}
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
                <div className="bg-gray-800 rounded-lg p-4 mb-6 border border-gray-700">
                  <h3 className="font-medium text-white mb-3">{t('order.orderDetails')}</h3>
                  <div className="space-y-2">
                    <div className={`flex ${isRTL ? 'flex-row-reverse' : 'flex-row'} justify-between text-gray-300`}>
                      <span>{t('cart.subtotal')} ({getTotalItems()} {t('cart.itemsInCart')})</span>
                      <span dir="ltr">₪ {getSubtotal().toFixed(2)}</span>
                    </div>
                    <div className={`flex ${isRTL ? 'flex-row-reverse' : 'flex-row'} justify-between text-gray-300`}>
                      <span>{t('cart.deliveryFee')}</span>
                      <span dir="ltr">₪ {deliveryFee.toFixed(2)}</span>
                    </div>
                    <div className={`flex ${isRTL ? 'flex-row-reverse' : 'flex-row'} justify-between font-semibold text-lg text-green-400 border-t border-gray-700 pt-2`}>
                      <span>{t('cart.total')}</span>
                      <span dir="ltr">₪ {getTotal().toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Endereço de entrega */}
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-6">
                  <div className={`flex ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-center justify-between mb-3`}>
                    <h3 className={`font-medium text-white flex ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-center gap-2`}>
                      <MdLocationOn className="text-green-500" />
                      {t('order.deliveryAddress')}
                    </h3>
                    <button
                      onClick={() => setShowAddressForm(true)}
                      className={`text-green-400 hover:text-green-300 text-sm font-medium flex ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-center gap-1`}
                    >
                      <MdEdit size={16} />
                      {deliveryAddress ? t('common.edit') : t('common.add')}
                    </button>
                  </div>
                  
                  {deliveryAddress ? (
                    <div className="text-sm text-gray-300">
                      <p>{deliveryAddress.street}, {deliveryAddress.number}</p>
                      {deliveryAddress.complement && <p>{deliveryAddress.complement}</p>}
                      <p>{deliveryAddress.neighborhood}</p>
                      <p>{deliveryAddress.city} - {deliveryAddress.zipCode}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">
                      {t('address.addAddress')}
                    </p>
                  )}
                </div>

                {/* Forma de pagamento */}
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-6">
                  <h3 className={`font-medium text-white mb-3 flex ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-center gap-2`}>
                    <MdPayment className="text-green-500" />
                    {t('payment.paymentMethod')}
                  </h3>
                  
                  <div className="space-y-3">
                    <label className={`flex ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-center gap-3 cursor-pointer`}>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="card"
                        checked={paymentMethod === 'card'}
                        onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                        className="text-green-500 focus:ring-green-500"
                      />
                      <div className={`flex ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-center gap-2`}>
                        <MdPayment className="text-gray-400" />
                        <span className="text-sm font-medium text-gray-300">{t('payment.creditCard')}</span>
                      </div>
                    </label>
                    
                    <label className={`flex ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-center gap-3 cursor-pointer`}>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="cash"
                        checked={paymentMethod === 'cash'}
                        onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                        className="text-green-500 focus:ring-green-500"
                      />
                      <div className={`flex ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-center gap-2`}>
                        <MdMoney className="text-gray-400" />
                        <span className="text-sm font-medium text-gray-300">{t('payment.cash')}</span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer - Botão de checkout */}
          {hasItems() && (
            <div className="border-t border-gray-800 p-4 bg-gray-900">
              <button
                onClick={handleCheckout}
                disabled={!canCheckout() || isProcessing}
                className="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <span className={`flex ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-center justify-center gap-2`}>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    {t('common.loading')}
                  </span>
                ) : !deliveryAddress ? (
                  t('address.required')
                ) : (
                  <span className={`flex ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-center justify-center gap-2`}>
                    <span>{t('cart.checkout')}</span>
                    <span dir="ltr">• ₪ {getTotal().toFixed(2)}</span>
                  </span>
                )}
              </button>
              
              <button
                onClick={clearCart}
                className="w-full mt-2 text-gray-400 py-2 text-sm hover:text-gray-300 transition-all duration-200 hover:scale-105 active:scale-95"
              >
                {t('cart.clearCart')}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal de endereço */}
      {showAddressForm && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/50 z-60 flex items-center justify-center p-4 transition-all duration-300 ease-out">
          <div className="bg-gray-900 rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto animate-in zoom-in-95 fade-in duration-300 ease-out border border-gray-800">
            <div className="p-6">
              <div className={`flex ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-center justify-between mb-4`}>
                <h3 className={`text-lg font-semibold text-white animate-in fade-in duration-300 ${isRTL ? 'slide-in-from-right-2' : 'slide-in-from-left-2'}`}>
                  {t('order.deliveryAddress')}
                </h3>
                <button
                  onClick={() => setShowAddressForm(false)}
                  className={`text-gray-400 hover:text-gray-300 transition-all duration-200 hover:scale-110 active:scale-95 animate-in fade-in duration-300 ${isRTL ? 'slide-in-from-left-2' : 'slide-in-from-right-2'}`}
                >
                  <MdClose size={24} />
                </button>
              </div>

              {/* Botões de ação rápida */}
              <div className={`flex ${isRTL ? 'flex-row-reverse' : 'flex-row'} gap-2 mb-4 animate-in slide-in-from-bottom-2 fade-in duration-300 delay-100`}>
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  disabled={isLoadingLocation}
                  className={`flex-1 flex ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50`}
                >
                  {isLoadingLocation ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <MdMyLocation size={16} />
                  )}
                  {isLoadingLocation ? t('common.loading') : t('address.useCurrentLocation')}
                </button>
              </div>

              {/* Campo de busca */}
              <div className="relative mb-4 animate-in slide-in-from-bottom-2 fade-in duration-300 delay-150">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t('address.searchAddress')}
                </label>
                <div className="relative">
                  <MdSearch className={`absolute top-1/2 transform -translate-y-1/2 text-gray-400 ${isRTL ? 'right-3' : 'left-3'}`} size={16} />
                  <input
                    type="text"
                    value={addressSearchQuery}
                    onChange={(e) => setAddressSearchQuery(e.target.value)}
                    className={`w-full py-2 border border-gray-600 bg-gray-800 text-white rounded-md focus:ring-green-500 focus:border-green-500 transition-all duration-200 focus:scale-105 ${isRTL ? 'pr-10 pl-10' : 'pl-10 pr-10'}`}
                    placeholder={t('address.searchAddress')}
                  />
                  {addressSearchQuery && (
                    <button
                      type="button"
                      onClick={handleClearSearch}
                      className={`absolute top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 ${isRTL ? 'left-3' : 'right-3'}`}
                    >
                      <MdClose size={16} />
                    </button>
                  )}
                </div>

                {/* Lista de sugestões */}
                {showSuggestions && addressSuggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {isLoadingSuggestions && (
                      <div className="p-3 text-center text-gray-400">
                        <div className="inline-block w-4 h-4 border-2 border-gray-600 border-t-green-500 rounded-full animate-spin mr-2"></div>
                        {t('common.loading')}
                      </div>
                    )}
                    {addressSuggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleSelectSuggestion(suggestion)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-700 transition-colors border-b border-gray-700 last:border-0"
                      >
                        <div className="text-sm font-medium text-white">
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
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      {t('address.street')} *
                    </label>
                    <input
                      type="text"
                      value={addressForm.street}
                      onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-600 bg-gray-800 text-white rounded-md focus:ring-green-500 focus:border-green-500 transition-all duration-200 focus:scale-105"
                      placeholder={t('address.streetAddress')}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      {t('address.number')} *
                    </label>
                    <input
                      type="text"
                      value={addressForm.number}
                      onChange={(e) => setAddressForm({ ...addressForm, number: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-600 bg-gray-800 text-white rounded-md focus:ring-green-500 focus:border-green-500 transition-all duration-200 focus:scale-105"
                      placeholder="123"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    {t('address.complement')}
                  </label>
                  <input
                    type="text"
                    value={addressForm.complement}
                    onChange={(e) => setAddressForm({ ...addressForm, complement: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-600 bg-gray-800 text-white rounded-md focus:ring-green-500 focus:border-green-500"
                    placeholder={t('common.optional')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    {t('address.neighborhood')} *
                  </label>
                  <input
                    type="text"
                    value={addressForm.neighborhood}
                    onChange={(e) => setAddressForm({ ...addressForm, neighborhood: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-600 bg-gray-800 text-white rounded-md focus:ring-green-500 focus:border-green-500"
                    placeholder={t('address.neighborhood')}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      {t('address.city')} *
                    </label>
                    <input
                      type="text"
                      value={addressForm.city}
                      onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-600 bg-gray-800 text-white rounded-md focus:ring-green-500 focus:border-green-500 transition-all duration-200 focus:scale-105"
                      placeholder={t('address.city')}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      {t('address.zipCode')} *
                    </label>
                    <input
                      type="text"
                      value={addressForm.zipCode}
                      onChange={(e) => setAddressForm({ ...addressForm, zipCode: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-600 bg-gray-800 text-white rounded-md focus:ring-green-500 focus:border-green-500 transition-all duration-200 focus:scale-105"
                      placeholder="12345-678"
                      required
                    />
                  </div>
                </div>

                <div className={`flex ${isRTL ? 'flex-row-reverse' : 'flex-row'} gap-3 pt-4 animate-in slide-in-from-bottom-2 fade-in duration-300 delay-500`}>
                  <button
                    type="button"
                    onClick={() => setShowAddressForm(false)}
                    className="flex-1 px-4 py-2 border border-gray-600 text-gray-300 bg-gray-800 rounded-md hover:bg-gray-700 transition-all duration-200 hover:scale-105 active:scale-95"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-all duration-200 hover:scale-105 active:scale-95"
                  >
                    {t('address.saveAddress')}
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
