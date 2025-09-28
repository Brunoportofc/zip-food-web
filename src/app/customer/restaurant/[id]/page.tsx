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

interface CartItem extends MenuItem {
  quantity: number;
}

export default function RestaurantPage({ params }: RestaurantPageProps) {
  const resolvedParams = use(params);
  const restaurantId = resolvedParams.id;
  
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isFavorite, setIsFavorite] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);

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
          throw new Error('Restaurante não encontrado');
        }
        
        const restaurantData = await restaurantResponse.json();
        const foundRestaurant = restaurantData.data;
        
        if (foundRestaurant) {
          console.log('🍔 [CUSTOMER RESTAURANT] Dados do restaurante carregados:', foundRestaurant);
          setRestaurant(foundRestaurant);
          
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

  // Funções do carrinho
  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existingItem = prev.find(cartItem => cartItem.id === item.id);
      if (existingItem) {
        return prev.map(cartItem =>
          cartItem.id === item.id 
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => {
      const existingItem = prev.find(cartItem => cartItem.id === itemId);
      if (existingItem && existingItem.quantity > 1) {
        return prev.map(cartItem =>
          cartItem.id === itemId 
            ? { ...cartItem, quantity: cartItem.quantity - 1 }
            : cartItem
        );
      }
      return prev.filter(cartItem => cartItem.id !== itemId);
    });
  };

  const getItemQuantity = (itemId: string) => {
    return cart.find(item => item.id === itemId)?.quantity || 0;
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handleCheckout = async () => {
    if (!restaurant) return;
    
    try {
      setCheckingOut(true);
      
      const orderData = {
        restaurantId: restaurant.id,
        items: cart.map(item => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price
        })),
        deliveryAddress: {
          street: 'Rua Exemplo',
          number: '123',
          neighborhood: 'Centro',
          city: 'São Paulo',
          zipCode: '01234-567'
        },
        paymentMethod: 'credit-card' as const,
        notes: ''
      };

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
        alert('Pedido realizado com sucesso! Número: ' + result.data.id);
        setCart([]);
        setShowCart(false);
      } else {
        const error = await response.json();
        alert(error.message || 'Erro ao realizar pedido');
      }
    } catch (error) {
      console.error('Erro ao realizar pedido:', error);
      alert('Erro ao realizar pedido');
    } finally {
      setCheckingOut(false);
    }
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-gray-200 animate-pulse rounded-full mr-4"></div>
              <div className="w-32 h-6 bg-gray-200 animate-pulse rounded"></div>
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="bg-gray-200 animate-pulse h-64 rounded-2xl mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 animate-pulse">
                <div className="bg-gray-200 h-32 rounded-lg mb-4"></div>
                <div className="bg-gray-200 h-4 rounded mb-2"></div>
                <div className="bg-gray-200 h-3 rounded mb-4"></div>
                <div className="bg-gray-200 h-6 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🏪</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Restaurante não encontrado</h1>
          <p className="text-gray-600 mb-4">O restaurante solicitado não existe ou foi removido.</p>
          <Link
            href="/customer"
            className="bg-red-600 text-white px-6 py-2 rounded-full font-medium hover:bg-red-700 transition-colors duration-200"
          >
            Voltar ao Início
          </Link>
        </div>
      </div>
    );
  }

  const MenuItemCard = ({ item }: { item: MenuItem }) => {
    const quantity = getItemQuantity(item.id);
    
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="relative">
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-40 object-cover"
          />
          {!item.available && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="bg-white text-gray-900 px-3 py-1 rounded-full text-sm font-bold">
                Indisponível
              </span>
            </div>
          )}
        </div>

        <div className="p-4">
          <h3 className="font-bold text-lg text-gray-900 mb-2">{item.name}</h3>
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">{item.description}</p>
          
          <div className="flex items-center justify-between">
            <span className="text-xl font-bold text-gray-900">
              R$ {item.price.toFixed(2)}
            </span>
            
            {item.available && (
              <div className="flex items-center">
                {quantity > 0 ? (
                  <div className="flex items-center bg-red-50 rounded-full">
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="p-2 text-red-600 hover:bg-red-100 rounded-full transition-colors duration-200"
                    >
                      <MdRemove size={16} />
                    </button>
                    <span className="px-3 py-1 font-bold text-red-600">{quantity}</span>
                    <button
                      onClick={() => addToCart(item)}
                      className="p-2 text-red-600 hover:bg-red-100 rounded-full transition-colors duration-200"
                    >
                      <MdAdd size={16} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => addToCart(item)}
                    className="bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition-colors duration-200"
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
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link 
                href="/customer"
                className="mr-4 p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
              >
                <MdArrowBack size={24} className="text-gray-700" />
              </Link>
              
              <div>
                <h1 className="text-xl font-bold text-gray-900">{restaurant.name}</h1>
                <p className="text-gray-600 text-sm flex items-center">
                  <span className="mr-2">{categoryConfig[restaurant.category].icon}</span>
                  {categoryDisplayNames[restaurant.category]}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsFavorite(!isFavorite)}
                className={`p-2 rounded-full transition-colors duration-200 ${
                  isFavorite ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-600'
                }`}
              >
                <MdFavorite size={20} />
              </button>
              
              <button className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-600 transition-colors duration-200">
                <MdShare size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Restaurant Info */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
          <div className="relative">
            <img
              src={restaurant.image}
              alt={restaurant.name}
              className="w-full h-64 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
            
            {/* Restaurant Info Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold mb-2">{restaurant.name}</h1>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center">
                      <MdStar className="mr-1 text-yellow-400" size={16} />
                      <span className="font-bold">{restaurant.rating.toFixed(1)}</span>
                      <span className="ml-1 opacity-80">(150+ avaliações)</span>
                    </div>
                    <div className="flex items-center">
                      <MdAccessTime className="mr-1" size={16} />
                      <span>{restaurant.estimatedDeliveryTime}</span>
                    </div>
                    <div className="flex items-center">
                      <MdDeliveryDining className="mr-1" size={16} />
                      <span>{restaurant.deliveryFee === 0 ? 'Grátis' : `R$ ${restaurant.deliveryFee.toFixed(2)}`}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Restaurant Details */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <h3 className="font-bold text-lg text-gray-900 mb-2">Sobre o restaurante</h3>
                <p className="text-gray-600 mb-4">
                  {restaurant.description || `Bem-vindos ao ${restaurant.name}! Oferecemos os melhores pratos de ${categoryDisplayNames[restaurant.category].toLowerCase()} da região.`}
                </p>
                
                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                  <div className="flex items-center">
                    <MdLocationOn className="mr-2 text-red-600" size={16} />
                    <span>{restaurant.address ? `${restaurant.address}, ${restaurant.city || ''}` : 'Entrega na região'}</span>
                  </div>
                  <div className="flex items-center">
                    <MdPhone className="mr-2 text-red-600" size={16} />
                    <span>{restaurant.phone || 'Telefone não informado'}</span>
                  </div>
                  <div className="flex items-center">
                    <MdInfo className="mr-2 text-red-600" size={16} />
                    <span>Pedido mínimo: R$ {restaurant.minimumOrder?.toFixed(2) || '0,00'}</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-bold text-gray-900 mb-3">Horário de funcionamento</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  {restaurant.operatingHours ? (
                    Object.entries(restaurant.operatingHours).map(([day, hours]) => {
                      const dayNames: Record<string, string> = {
                        monday: 'Segunda-feira',
                        tuesday: 'Terça-feira',
                        wednesday: 'Quarta-feira',
                        thursday: 'Quinta-feira',
                        friday: 'Sexta-feira',
                        saturday: 'Sábado',
                        sunday: 'Domingo'
                      };
                      
                      const dayName = dayNames[day] || day;
                      const hoursData = hours as any;
                      
                      if (hoursData?.closed) {
                        return (
                          <div key={day} className="flex justify-between">
                            <span>{dayName}</span>
                            <span className="text-red-600">Fechado</span>
                          </div>
                        );
                      }
                      
                      return (
                        <div key={day} className="flex justify-between">
                          <span>{dayName}</span>
                          <span>{hoursData?.open || '08:00'} - {hoursData?.close || '22:00'}</span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="flex justify-between">
                      <span>Todos os dias</span>
                      <span>08:00 - 22:00</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Menu */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Cardápio</h2>
            
            {/* Category Filter */}
            <div className="flex overflow-x-auto gap-2 pb-2">
              {menuCategories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-full whitespace-nowrap transition-colors duration-200 ${
                    selectedCategory === category
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-red-100 hover:text-red-600'
                  }`}
                >
                  {category === 'all' ? 'Todos' : category}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            {filteredMenuItems.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">🍽️</div>
                <p className="text-gray-600">Nenhum item encontrado nesta categoria.</p>
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

      {/* Cart Floating Button */}
      {getTotalItems() > 0 && (
        <div className="fixed bottom-6 right-6 z-50">
          <button 
            onClick={() => setShowCart(true)}
            className="bg-red-600 text-white rounded-full shadow-lg hover:bg-red-700 transition-all duration-200 p-4 flex items-center gap-3"
          >
            <div className="bg-white/20 rounded-full w-8 h-8 flex items-center justify-center">
              <span className="font-bold text-sm">{getTotalItems()}</span>
            </div>
            <div className="text-left">
              <div className="text-sm font-medium">Ver carrinho</div>
              <div className="text-xs opacity-90">R$ {getTotalPrice().toFixed(2)}</div>
            </div>
          </button>
        </div>
      )}

      {/* Cart Modal */}
      {showCart && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Seu pedido</h2>
                <button
                  onClick={() => setShowCart(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 max-h-96 overflow-y-auto">
              {cart.map((item) => (
                <div key={item.id} className="flex items-center gap-3 py-3 border-b border-gray-100 last:border-0">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-12 h-12 object-cover rounded-lg"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 truncate">{item.name}</h4>
                    <p className="text-red-600 font-semibold">R$ {item.price.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                    >
                      <MdRemove className="text-sm" />
                    </button>
                    <span className="font-medium text-gray-900 w-8 text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                    >
                      <MdAdd className="text-sm" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-6 border-t border-gray-200">
              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>R$ {getTotalPrice().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Taxa de entrega</span>
                  <span>R$ {restaurant?.deliveryFee.toFixed(2) || '0.00'}</span>
                </div>
                <div className="flex justify-between text-lg font-semibold text-gray-900 border-t pt-3">
                  <span>Total</span>
                  <span>R$ {(getTotalPrice() + (restaurant?.deliveryFee || 0)).toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                disabled={checkingOut || cart.length === 0}
                className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {checkingOut ? 'Processando...' : `Finalizar pedido • R$ ${(getTotalPrice() + (restaurant?.deliveryFee || 0)).toFixed(2)}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}