'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

import { MdArrowBack, MdStar, MdAccessTime, MdAdd, MdRemove, MdShoppingCart, MdLocationOn } from 'react-icons/md';
import AnimatedContainer from '@/components/AnimatedContainer';
import Button from '@/components/ui/Button';
import { showSuccessAlert, showErrorAlert } from '@/components/AlertSystem';
import { orderService } from '@/services/order.service';
import { restaurantService } from '@/services/restaurant.service';
import { menuService } from '@/services/menu.service';
import { useAuthStore } from '@/store/auth.store';
import { toast } from 'react-hot-toast';
import AddressSelector, { Address } from '@/components/AddressSelector';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  available: boolean;
}

interface Restaurant {
  id: string;
  name: string;
  image: string;
  rating: number;
  deliveryTime: string;
  deliveryFee: number;
  category: string;
  description: string;
  address: string;
  phone: string;
}

interface CartItem extends MenuItem {
  quantity: number;
}

export default function RestaurantPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [showAddressSelector, setShowAddressSelector] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);

  const restaurantId = params.id as string;

  // Carregar dados reais do restaurante e menu
  useEffect(() => {
    const loadRestaurantData = async () => {
      setIsLoading(true);
      
      try {
        // Carregar dados do restaurante
        const restaurantData = await restaurantService.getRestaurantById(restaurantId);
        
        if (restaurantData) {
          // Mapear dados do restaurante para o formato da interface
          const mappedRestaurant: Restaurant = {
            id: restaurantData.id,
            name: restaurantData.name,
            image: restaurantData.image || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop',
            rating: restaurantData.rating || 0,
            deliveryTime: restaurantData.estimatedDeliveryTime || '30-45 min',
            deliveryFee: restaurantData.deliveryFee || 0,
            category: restaurantData.category,
            description: restaurantData.description,
            address: restaurantData.address,
            phone: restaurantData.phone
          };
          
          setRestaurant(mappedRestaurant);
          
          // Carregar itens do menu
          const menuData = await menuService.getMenuItems(restaurantId);
          
          // Mapear dados do menu para o formato da interface
          const mappedMenuItems: MenuItem[] = menuData.map(item => ({
            id: item.id,
            name: item.name,
            description: item.description,
            price: item.price,
            image: item.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop',
            category: item.category,
            available: item.available
          }));
          
          setMenuItems(mappedMenuItems);
        } else {
          // Fallback para dados de desenvolvimento se restaurante não encontrado
          const fallbackRestaurant: Restaurant = {
            id: restaurantId,
            name: 'Restaurante em Configuração',
            image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop',
            rating: 0,
            deliveryTime: 'A definir',
            deliveryFee: 0,
            category: 'Geral',
            description: 'Este restaurante está sendo configurado. Em breve estará disponível com cardápio completo.',
            address: 'Endereço a ser definido',
            phone: 'Telefone a ser definido'
          };
          
          setRestaurant(fallbackRestaurant);
          setMenuItems([]);
        }
      } catch (error) {
        console.error('Erro ao carregar dados do restaurante:', error);
        toast.error('Erro ao carregar dados do restaurante');
      } finally {
        setIsLoading(false);
      }
    };

    loadRestaurantData();
  }, [restaurantId]);

  const categories = ['all', ...Array.from(new Set(menuItems.map(item => item.category)))];
  
  const filteredItems = selectedCategory === 'all' 
    ? menuItems 
    : menuItems.filter(item => item.category === selectedCategory);

  const addToCart = (item: MenuItem) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(cartItem => cartItem.id === item.id);
      if (existingItem) {
        return prevCart.map(cartItem => 
          cartItem.id === item.id 
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      } else {
        return [...prevCart, { ...item, quantity: 1 }];
      }
    });
    showSuccessAlert('Item adicionado', `${item.name} foi adicionado ao carrinho`);
  };

  const removeFromCart = (itemId: string) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(cartItem => cartItem.id === itemId);
      if (existingItem && existingItem.quantity > 1) {
        return prevCart.map(cartItem => 
          cartItem.id === itemId 
            ? { ...cartItem, quantity: cartItem.quantity - 1 }
            : cartItem
        );
      } else {
        return prevCart.filter(cartItem => cartItem.id !== itemId);
      }
    });
  };

  const getItemQuantity = (itemId: string) => {
    const item = cart.find(cartItem => cartItem.id === itemId);
    return item ? item.quantity : 0;
  };

  const getTotalPrice = () => {
    const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    return subtotal + (restaurant?.deliveryFee || 0);
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const handlePlaceOrder = async () => {
    if (!user) {
      toast.error('Você precisa estar logado para fazer um pedido');
      router.push('/auth/sign-in');
      return;
    }

    if (cart.length === 0) {
      toast.error('Adicione itens ao carrinho antes de finalizar o pedido');
      return;
    }

    if (!selectedAddress) {
      setShowAddressSelector(true);
      return;
    }

    setIsPlacingOrder(true);

    try {
      const orderData = {
        restaurantId: restaurantId,
        customerId: user.id,
        customer: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone || '(11) 99999-9999',
          address: selectedAddress?.formattedAddress || 'Endereço não informado'
        },
        deliveryAddress: {
          street: selectedAddress?.street || 'Rua não informada',
          number: selectedAddress?.number || 'S/N',
          neighborhood: selectedAddress?.neighborhood || 'Bairro não informado',
          city: selectedAddress?.city || 'Cidade não informada',
          state: selectedAddress?.state || 'Estado não informado',
          zipCode: selectedAddress?.zipCode || '00000-000',
          complement: selectedAddress?.complement || ''
        },
        paymentMethod: 'credit-card' as const,
        items: cart.map(item => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price
        })),
        subtotal: cart.reduce((total, item) => total + (item.price * item.quantity), 0),
        deliveryFee: restaurant?.deliveryFee || 0,
        total: getTotalPrice(),
        status: 'pending' as const,
        estimatedDeliveryTime: new Date(Date.now() + 45 * 60 * 1000) // 45 minutos a partir de agora
      };

      const newOrder = await orderService.createOrder(orderData);
      
      // Limpar carrinho
      setCart([]);
      
      toast.success(`Pedido ${newOrder.id} realizado com sucesso!`);
      showSuccessAlert('Pedido Confirmado', `Seu pedido ${newOrder.id} foi enviado para o restaurante. Acompanhe o status na página de pedidos.`);
      
      // Redirecionar para página de pedidos
      router.push('/customer/orders');
      
    } catch (error) {
      console.error('Erro ao criar pedido:', error);
      toast.error('Não foi possível finalizar o pedido. Tente novamente.');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando restaurante...</p>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Restaurante não encontrado</p>
          <Button
            onClick={() => router.back()}
            variant="primary"
          >
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => router.back()}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <MdArrowBack size={24} className="mr-2" />
              Voltar
            </button>
            
            {getTotalItems() > 0 && (
              <button
                onClick={() => showSuccessAlert('Carrinho', 'Funcionalidade em desenvolvimento')}
                className="flex items-center bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                <MdShoppingCart size={20} className="mr-2" />
                {getTotalItems()} itens - R$ {getTotalPrice().toFixed(2)}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Restaurant Info */}
      <AnimatedContainer animationType="fadeInUp">
        <div className="bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col md:flex-row gap-6">
              <img
                src={restaurant.image}
                alt={restaurant.name}
                className="w-full md:w-48 h-48 object-cover rounded-xl"
              />
              <div className="flex-1">
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                  {restaurant.name}
                </h1>
                <p className="text-gray-600 mb-4">{restaurant.description}</p>
                
                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                  <div className="flex items-center">
                    <MdStar className="text-yellow-400 mr-1" />
                    {restaurant.rating.toFixed(1)}
                  </div>
                  <div className="flex items-center">
                    <MdAccessTime className="mr-1" />
                    {restaurant.deliveryTime}
                  </div>
                  <div className="text-red-600 font-medium">
                    Taxa de entrega: R$ {restaurant.deliveryFee.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AnimatedContainer>

      {/* Categories */}
      <div className="bg-white border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-2 py-4 overflow-x-auto">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
                  selectedCategory === category
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category === 'all' ? 'Todos' : category}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item, index) => (
            <AnimatedContainer key={item.id} animationType="fadeInUp" delay={index * 100}>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <h3 className="font-semibold text-lg text-gray-900 mb-2">
                    {item.name}
                  </h3>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {item.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-red-600">
                      R$ {item.price.toFixed(2)}
                    </span>
                    
                    {getItemQuantity(item.id) === 0 ? (
                      <Button
                        onClick={() => addToCart(item)}
                        variant="primary"
                        disabled={!item.available}
                      >
                        Adicionar
                      </Button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center hover:bg-red-200 transition-colors"
                        >
                          <MdRemove size={16} />
                        </button>
                        <span className="font-medium text-gray-900 min-w-[20px] text-center">
                          {getItemQuantity(item.id)}
                        </span>
                        <button
                          onClick={() => addToCart(item)}
                          className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-700 transition-colors"
                        >
                          <MdAdd size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </AnimatedContainer>
          ))}
        </div>
        
        {filteredItems.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">Nenhum item encontrado nesta categoria.</p>
          </div>
        )}
      </div>

      {/* Fixed Cart Button */}
      {getTotalItems() > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-50 md:hidden">
          <button
            onClick={handlePlaceOrder}
            disabled={isPlacingOrder}
            className="w-full bg-red-600 text-white py-4 rounded-xl font-semibold text-lg shadow-lg hover:bg-red-700 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <MdShoppingCart size={24} className="mr-2" />
            {isPlacingOrder ? 'Finalizando...' : `${getTotalItems()} itens - R$ ${getTotalPrice().toFixed(2)}`}
          </button>
        </div>
      )}

      {/* Address Selector Modal */}
      {showAddressSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <MdLocationOn size={28} />
                  <h2 className="text-xl font-bold">Selecionar Endereço de Entrega</h2>
                </div>
                <button
                  onClick={() => setShowAddressSelector(false)}
                  className="text-white hover:text-red-200 transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-6">
              <AddressSelector
                onAddressSelect={(address) => {
                  setSelectedAddress(address);
                  setShowAddressSelector(false);
                  // Após selecionar o endereço, finalizar o pedido
                  setTimeout(() => {
                    handlePlaceOrder();
                  }, 100);
                }}
                placeholder="Digite seu endereço de entrega..."
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}