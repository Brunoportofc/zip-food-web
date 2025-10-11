'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { 
  MdArrowBack,
  MdStar, 
  MdAccessTime, 
  MdDeliveryDining,
  MdFavorite,
  MdShare,
  MdLocationOn,
  MdPhone,
  MdInfo,
  MdAdd,
  MdRemove
} from 'react-icons/md';
import { Restaurant, RestaurantCategory, categoryDisplayNames } from '@/types';
import restaurantService from '@/services/restaurant.service';
import { categoryConfig } from '@/constants';
import { useCartStore, PaymentMethod } from '@/store/cart.store';
import CartDrawer from '@/components/cart/CartDrawer';
import CartIcon from '@/components/cart/CartIcon';
import { toast, Toaster } from 'react-hot-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { getCategoryName } from '@/utils/translation-helper';

interface RestaurantPageProps {
  params: Promise<{ id: string }>;
}

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  available: boolean;
}

export default function RestaurantPage({ params }: RestaurantPageProps) {
  const { t } = useLanguage();
  const resolvedParams = use(params);
  const restaurantId = resolvedParams.id;
  
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isFavorite, setIsFavorite] = useState(false);
  
  // Zustand store do carrinho
  const { 
    addItem, 
    getItemQuantity, 
    setRestaurantInfo,
    hasItems 
  } = useCartStore();

  // Carregar dados do restaurante
  useEffect(() => {
    const loadRestaurant = async () => {
      try {
        setLoading(true);
        // Buscar dados específicos do restaurante via API
        const restaurantResponse = await fetch(`/api/restaurants/${restaurantId}`, {
          credentials: 'include'
        });
        
        if (!restaurantResponse.ok) {
          throw new Error(t('restaurant.notFound'));
        }
        
        const restaurantData = await restaurantResponse.json();
        const foundRestaurant = restaurantData.data;
        
        if (foundRestaurant) {
          console.log('🍔 [CUSTOMER RESTAURANT] Dados do restaurante carregados:', foundRestaurant);
          setRestaurant(foundRestaurant);
          
          // Configurar informações do restaurante no carrinho
          setRestaurantInfo(
            foundRestaurant.id, 
            foundRestaurant.name, 
            foundRestaurant.deliveryFee || 5.00
          );
          
          // Carregar menu real da API
          try {
            const menuResponse = await fetch(`/api/menu?restaurantId=${restaurantId}`, {
              credentials: 'include'
            });
            
            if (menuResponse.ok) {
              const menuData = await menuResponse.json();
              // Transformar dados da API para o formato esperado
              const items = menuData.data.items.map((item: any) => ({
                id: item.id,
                name: item.name,
                description: item.description,
                price: item.price,
                image: item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&h=200&fit=crop',
                category: item.category,
                available: item.is_available
              }));
              setMenuItems(items.filter((item: MenuItem) => item.available));
            } else {
              setMenuItems([]);
            }
          } catch (menuError) {
            console.error('Erro ao carregar menu:', menuError);
            setMenuItems([]);
          }
        }
      } catch (error) {
        console.error('Erro ao carregar restaurante:', error);
      } finally {
        setLoading(false);
      }
    };

    if (restaurantId) {
      loadRestaurant();
    }
  }, [restaurantId]);

  // Categorias do menu
  const menuCategories = ['all', ...Array.from(new Set(menuItems.map(item => item.category)))];
  const filteredMenuItems = selectedCategory === 'all' 
    ? menuItems 
    : menuItems.filter(item => item.category === selectedCategory);

  // Função para adicionar item ao carrinho
  const handleAddToCart = (item: MenuItem) => {
    if (!restaurant) return;
    
    addItem({
      id: item.id,
      name: item.name,
      description: item.description,
      price: item.price,
      image: item.image,
      restaurantId: restaurant.id,
      category: item.category
    });
    
    toast.success(t('cart.itemAdded', { item: item.name }));
  };

  // Função de checkout integrada com Stripe
  const handleCheckout = async (paymentMethod: PaymentMethod) => {
    if (!restaurant) {
      toast.error(t('restaurant.infoNotFound'));
      return;
    }

    const { 
      items, 
      deliveryAddress, 
      getSubtotal, 
      deliveryFee,
      clearCart 
    } = useCartStore.getState();

    if (!deliveryAddress) {
      toast.error(t('address.required'));
      return;
    }

    try {
      const orderData = {
        restaurantId: restaurant.id,
        items: items.map(item => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price
        })),
        deliveryAddress,
        paymentMethod: paymentMethod === 'cash' ? 'cash' : 'credit-card',
        notes: ''
      };

      if (paymentMethod === 'cash') {
        // Pagamento em dinheiro - criar pedido diretamente
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(orderData)
      });

      if (response.ok) {
        const result = await response.json();
          toast.success(t('order.successWithNumber', { number: result.data.id }));
          clearCart();
        } else {
          const error = await response.json();
          toast.error(error.message || t('order.errorPlacing'));
        }
      } else {
        // Pagamento com cartão - redirecionar para Stripe Checkout
        const totalAmount = Math.round((getSubtotal() + deliveryFee) * 100); // Converter para centavos

        const checkoutResponse = await fetch('/api/stripe/payment/create-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            restaurantId: restaurant.id,
            amount: totalAmount,
            description: `Pedido - ${restaurant.name}`,
            orderData
          })
        });

        if (checkoutResponse.ok) {
          const { clientSecret } = await checkoutResponse.json();
          
          // Aqui você integraria com o Stripe Elements ou redirecionaria para checkout
          // Por enquanto, vamos simular sucesso
          toast.success(t('payment.redirecting'));
          
          // TODO: Implementar integração completa com Stripe Elements
          console.log('Client Secret:', clientSecret);
        } else {
          const error = await checkoutResponse.json();
          toast.error(error.message || t('payment.errorProcessing'));
        }
      }
    } catch (error) {
      console.error('Erro ao realizar pedido:', error);
      toast.error(t('order.errorProcessing'));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#101828]">
        <div className="bg-gray-900 shadow-sm border-b border-gray-800">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-gray-700 animate-pulse rounded-full mr-4"></div>
              <div className="w-32 h-6 bg-gray-700 animate-pulse rounded"></div>
            </div>
          </div>
        </div>
        
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="bg-gray-700 animate-pulse h-64 rounded-xl mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-gray-900 rounded-xl p-4 animate-pulse border border-gray-800">
                <div className="bg-gray-700 h-32 rounded-lg mb-4"></div>
                <div className="bg-gray-700 h-4 rounded mb-2"></div>
                <div className="bg-gray-700 h-3 rounded mb-4"></div>
                <div className="bg-gray-700 h-6 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-[#101828] flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🏪</div>
          <h1 className="text-2xl font-bold text-white mb-2">{t('restaurant.notFound')}</h1>
          <p className="text-gray-400 mb-4">{t('restaurant.notFoundMessage')}</p>
          <Link
            href="/customer"
            className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors duration-200"
          >
            {t('common.backToHome')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#101828]">
      {/* Header */}
      <div className="bg-gray-900 shadow-lg sticky top-0 z-40 border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link 
                href="/customer"
                className="mr-4 p-2 rounded-lg hover:bg-gray-800 transition-colors duration-200"
              >
                <MdArrowBack size={24} className="text-gray-300" />
              </Link>
              
              <div>
                <h1 className="text-xl font-bold text-white">{restaurant.name}</h1>
                <p className="text-gray-400 text-sm flex items-center">
                  <span className="mr-2">{categoryConfig[restaurant.category].icon}</span>
                  {getCategoryName(restaurant.category, t)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsFavorite(!isFavorite)}
                className={`p-2 rounded-lg transition-colors duration-200 ${
                  isFavorite ? 'bg-red-900 text-red-400' : 'bg-gray-800 text-gray-400 hover:bg-red-900 hover:text-red-400'
                }`}
              >
                <MdFavorite size={20} />
              </button>
              
              <button className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:bg-blue-900 hover:text-blue-400 transition-colors duration-200">
                <MdShare size={20} />
              </button>
              
              <CartIcon size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* Restaurant Hero */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="bg-gray-900 rounded-xl shadow-lg border border-gray-800 overflow-hidden mb-6">
          <div className="relative">
            <img
              src={restaurant.image}
              alt={restaurant.name}
              className="w-full h-64 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
            
            <div className="absolute bottom-4 left-4 right-4 text-white">
              <h1 className="text-2xl font-bold mb-2">{restaurant.name}</h1>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center bg-white/20 backdrop-blur-sm rounded-full px-3 py-1">
                  <MdStar className="mr-1 text-yellow-400" size={16} />
                  <span className="font-bold">{restaurant.rating.toFixed(1)}</span>
                </div>
                <div className="flex items-center bg-white/20 backdrop-blur-sm rounded-full px-3 py-1">
                  <MdAccessTime className="mr-1" size={16} />
                  <span>{restaurant.estimatedDeliveryTime}</span>
                </div>
                <div className="flex items-center bg-white/20 backdrop-blur-sm rounded-full px-3 py-1">
                  <MdDeliveryDining className="mr-1" size={16} />
                  <span>{restaurant.deliveryFee === 0 ? t('common.free') : `₪ ${restaurant.deliveryFee.toFixed(2)}`}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <h3 className="font-bold text-lg text-white mb-2">{t('restaurant.aboutRestaurant')}</h3>
                <p className="text-gray-300 mb-4">
                  {restaurant.description || t('restaurant.defaultDescription', { name: restaurant.name, category: getCategoryName(restaurant.category, t).toLowerCase() })}
                </p>
                
                <div className="flex flex-wrap gap-4 text-sm text-gray-300">
                  <div className="flex items-center">
                    <MdLocationOn className="mr-2 text-green-500" size={16} />
                    <span>{restaurant.address || t('restaurant.deliveryInRegion')}</span>
                  </div>
                  <div className="flex items-center">
                    <MdPhone className="mr-2 text-green-500" size={16} />
                    <span>{restaurant.phone || t('restaurant.phoneNotProvided')}</span>
                  </div>
                  <div className="flex items-center">
                    <MdInfo className="mr-2 text-green-500" size={16} />
                    <span>{t('restaurant.minimumOrder')}: ₪ {restaurant.minimumOrder?.toFixed(2) || '0.00'}</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <h4 className="font-bold text-white mb-3">{t('restaurant.openingHours')}</h4>
                <div className="space-y-2 text-sm text-gray-300">
                  <div className="flex justify-between">
                    <span>{t('restaurant.mondayToSunday')}</span>
                    <span>08:00 - 22:00</span>
                  </div>
                  <div className="flex items-center mt-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-green-400 font-medium">{t('restaurant.openNow')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Menu */}
        <div className="bg-gray-900 rounded-xl shadow-lg border border-gray-800 overflow-hidden">
          <div className="p-6 border-b border-gray-800">
            <h2 className="text-2xl font-bold text-white mb-4">{t('menu.menu')}</h2>
            
            {/* Category Filter */}
            <div className="flex overflow-x-auto gap-2 pb-2">
              {menuCategories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors duration-200 ${
                    selectedCategory === category
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-green-700 hover:text-white'
                  }`}
                >
                  {category === 'all' ? t('common.all') : category}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            {filteredMenuItems.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">🍽️</div>
                <p className="text-gray-400">{t('menu.noItemsInCategory')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredMenuItems.map((item) => (
                  <MenuItemCard key={item.id} item={item} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cart Drawer */}
      <CartDrawer onCheckout={handleCheckout} />
      
      {/* Toast Notifications */}
      <Toaster 
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#333',
            color: '#fff',
          },
          success: {
            style: {
              background: '#10B981',
            },
          },
          error: {
            style: {
              background: '#EF4444',
            },
          },
        }}
      />
    </div>
  );

  function MenuItemCard({ item }: { item: MenuItem }) {
    const quantity = getItemQuantity(item.id);
    
    return (
      <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 overflow-hidden hover:shadow-xl hover:border-gray-600 transition-all duration-200">
        <div className="relative">
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-40 object-cover"
          />
          {!item.available && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <span className="bg-gray-900 text-white px-3 py-1 rounded-lg text-sm font-bold border border-gray-700">
                {t('menu.unavailable')}
              </span>
            </div>
          )}
        </div>

        <div className="p-4">
          <h3 className="font-bold text-lg text-white mb-2">{item.name}</h3>
          <p className="text-gray-300 text-sm mb-3 line-clamp-2">{item.description}</p>
          
          <div className="flex items-center justify-between">
            <span className="text-xl font-bold text-green-400">
              ₪ {item.price.toFixed(2)}
            </span>
            
            {item.available && (
              <div className="flex items-center">
                {quantity > 0 ? (
                  <div className="flex items-center bg-green-900/30 rounded-lg border border-green-700">
                    <button
                      onClick={() => useCartStore.getState().updateQuantity(item.id, quantity - 1)}
                      className="p-2 text-green-400 hover:bg-green-800 rounded-lg transition-colors duration-200"
                    >
                      <MdRemove size={16} />
                    </button>
                    <span className="px-3 py-1 font-bold text-green-400">{quantity}</span>
                    <button
                      onClick={() => handleAddToCart(item)}
                      className="p-2 text-green-400 hover:bg-green-800 rounded-lg transition-colors duration-200"
                    >
                      <MdAdd size={16} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleAddToCart(item)}
                    className="bg-green-600 text-white p-2 rounded-lg hover:bg-green-700 transition-colors duration-200 shadow-lg"
                  >
                    <MdAdd size={16} />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
}