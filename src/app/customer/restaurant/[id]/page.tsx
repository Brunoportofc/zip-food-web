'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

import { MdArrowBack, MdStar, MdAccessTime, MdAdd, MdRemove, MdShoppingCart } from 'react-icons/md';
import AnimatedContainer from '@/components/AnimatedContainer';
import Button from '@/components/ui/Button';
import { showSuccessAlert, showErrorAlert } from '@/components/AlertSystem';
import { orderService } from '@/services/order.service';
import useAuthStore from '@/store/auth.store';
import { toast } from 'react-hot-toast';

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

  const restaurantId = params.id as string;

  // Mock data - em produção viria de uma API
  useEffect(() => {
    const loadRestaurantData = async () => {
      setIsLoading(true);
      
      // Simular carregamento
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock restaurant data - será substituído por dados reais do sistema de cadastro
      const mockRestaurant: Restaurant = {
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
      
      // Mock menu items
      const mockMenuItems: MenuItem[] = [
        {
          id: '1',
          name: 'Pizza Margherita',
          description: 'Molho de tomate, mussarela, manjericão fresco e azeite',
          price: 32.90,
          image: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=400&h=300&fit=crop',
          category: 'Pizzas',
          available: true
        },
        {
          id: '2',
          name: 'Pizza Pepperoni',
          description: 'Molho de tomate, mussarela e pepperoni',
          price: 38.90,
          image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400&h=300&fit=crop',
          category: 'Pizzas',
          available: true
        },
        {
          id: '3',
          name: 'Lasanha Bolonhesa',
          description: 'Massa fresca, molho bolonhesa, queijo e molho branco',
          price: 28.90,
          image: 'https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?w=400&h=300&fit=crop',
          category: 'Massas',
          available: true
        },
        {
          id: '4',
          name: 'Refrigerante Lata',
          description: 'Coca-Cola, Guaraná ou Fanta - 350ml',
          price: 4.50,
          image: 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=400&h=300&fit=crop',
          category: 'Bebidas',
          available: true
        }
      ];
      
      setRestaurant(mockRestaurant);
      setMenuItems(mockMenuItems);
      setIsLoading(false);
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

    setIsPlacingOrder(true);

    try {
      const orderData = {
        restaurantId: restaurantId,
        customerId: user.id,
        customer: {
          id: user.id,
          name: user.name,
          phone: user.phone || '(11) 99999-9999',
          address: 'Endereço do cliente' // Em produção, viria do perfil do usuário
        },
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
        estimatedDeliveryTime: restaurant?.deliveryTime || '30-45 min'
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
    </div>
  );
}