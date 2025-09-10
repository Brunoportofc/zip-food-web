'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '@/store/auth.store';
import AnimatedContainer from '@/components/AnimatedContainer';
import { restaurantConfigService } from '@/services/restaurant-config.service';

import { MdTrendingUp, MdTrendingDown, MdAccessTime, MdCheckCircle, MdAttachMoney, MdShoppingCart, MdRestaurantMenu, MdListAlt, MdSettings, MdAdd } from 'react-icons/md';

interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  revenue: number;
  todayOrders: number;
  averageOrderValue: number;
  growthRate: number;
}

interface RecentOrder {
  id: string;
  customer: string;
  value: number;
  status: 'pending' | 'preparing' | 'ready' | 'delivered';
  time: string;
}

interface TopItem {
  name: string;
  sold: number;
  price: number;
  revenue: number;
}

export default function RestaurantDashboard() {
  const { user } = useAuthStore();
  const router = useRouter();
  const restaurantService = restaurantConfigService;

  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    revenue: 0,
    todayOrders: 0,
    averageOrderValue: 0,
    growthRate: 0,
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [topItems, setTopItems] = useState<TopItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingConfig, setIsCheckingConfig] = useState(true);

  useEffect(() => {
    const checkRestaurantConfig = async () => {
      if (!user || user.type !== 'restaurant') {
        setIsCheckingConfig(false);
        return;
      }

      try {
        // Verifica se o restaurante já tem configuração completa
        const config = await restaurantService.getRestaurantConfig(user.id);
        
        if (!config) {
          // Se não tem configuração, redireciona para setup
          console.log('🏪 Restaurante sem configuração - redirecionando para setup');
          router.replace('/restaurant/setup');
          return;
        }

        // Verifica se a configuração está completa
        const progress = restaurantService.getConfigProgress(config);
        
        if (progress.percentage < 100) {
          // Se configuração incompleta, redireciona para setup
          console.log('🏪 Configuração incompleta - redirecionando para setup');
          router.replace('/restaurant/setup');
          return;
        }

        // Configuração completa, pode carregar o dashboard
        setIsCheckingConfig(false);
        loadDashboardData();
        
      } catch (error) {
        console.error('Erro ao verificar configuração do restaurante:', error);
        // Em caso de erro, redireciona para setup por segurança
        router.replace('/restaurant/setup');
      }
    };

    const loadDashboardData = () => {
      // Simulação de carregamento de dados do dashboard
      const timer = setTimeout(() => {
        setStats({
          totalOrders: 156,
          pendingOrders: 8,
          completedOrders: 148,
          revenue: 4350.75,
          todayOrders: 23,
          averageOrderValue: 67.50,
          growthRate: 12.5,
        });
        
        setRecentOrders([
          { id: '#1234', customer: 'João Silva', value: 75.90, status: 'pending', time: '14:30' },
          { id: '#1233', customer: 'Maria Oliveira', value: 45.50, status: 'preparing', time: '14:15' },
          { id: '#1232', customer: 'Carlos Mendes', value: 128.00, status: 'ready', time: '14:00' },
          { id: '#1231', customer: 'Ana Costa', value: 89.90, status: 'delivered', time: '13:45' },
        ]);
        
        setTopItems([
          { name: 'X-Burger Especial', sold: 42, price: 29.90, revenue: 1255.80 },
          { name: 'Batata Frita Grande', sold: 38, price: 15.90, revenue: 604.20 },
          { name: 'Milk Shake de Chocolate', sold: 27, price: 18.90, revenue: 510.30 },
        ]);
        
        setIsLoading(false);
      }, 1000);

      return () => clearTimeout(timer);
    };

    checkRestaurantConfig();
  }, [user, router]);

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    trend, 
    trendValue, 
    color = 'red' 
  }: { 
    title: string; 
    value: string | number; 
    icon: any; 
    trend?: 'up' | 'down';
    trendValue?: string;
    color?: string;
  }) => (
    <AnimatedContainer animationType="fadeInUp" delay={200}>
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-xl bg-${color}-100`}>
            <Icon className={`text-${color}-600`} size={24} />
          </div>
          {trend && (
            <div className={`flex items-center text-sm ${
              trend === 'up' ? 'text-green-600' : 'text-red-600'
            }`}>
              {trend === 'up' ? <MdTrendingUp size={16} /> : <MdTrendingDown size={16} />}
              <span className="ml-1 font-medium">{trendValue}</span>
            </div>
          )}
        </div>
        <div>
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </AnimatedContainer>
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'preparing': return 'bg-blue-100 text-blue-800';
      case 'ready': return 'bg-green-100 text-green-800';
      case 'delivered': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendente';
    case 'preparing': return 'Preparando';
    case 'ready': return 'Pronto';
    case 'delivered': return 'Entregue';
      default: return status;
    }
  };

  // Mostra loading quando estiver verificando configuração ou carregando dados
  if (isCheckingConfig || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="flex flex-col items-center space-y-6 p-8">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-red-600 border-t-transparent"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <MdRestaurantMenu className="text-red-600 text-xl" />
            </div>
          </div>
          <div className="text-center space-y-2">
            <p className="text-gray-800 text-xl font-semibold">
              {isCheckingConfig ? 'Verificando configuração...' : 'Carregando dashboard...'}
            </p>
            <p className="text-gray-600 text-sm">
              {isCheckingConfig ? 'Preparando seu ambiente de trabalho' : 'Buscando dados do seu restaurante'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <AnimatedContainer animationType="fadeInDown" delay={100}>
        <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-2xl p-8 text-white">
          <h1 className="text-4xl font-bold mb-2">Dashboard do Restaurante</h1>
          <p className="text-red-100 text-lg">Bem-vindo de volta, {user?.name}! 👋</p>
          <div className="mt-4 flex items-center text-red-100">
            <MdAccessTime className="mr-2" />
            <span>Última atualização: {new Date().toLocaleTimeString()}</span>
          </div>
        </div>
      </AnimatedContainer>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Pedidos Hoje"
          value={stats.todayOrders}
          icon={MdShoppingCart}
          trend="up"
          trendValue="+15%"
          color="blue"
        />
        <StatCard
          title="Pedidos Pendentes"
          value={stats.pendingOrders}
          icon={MdAccessTime}
          color="yellow"
        />
        <StatCard
          title="Receita Total"
          value={`R$ ${stats.revenue.toFixed(2)}`}
          icon={MdAttachMoney}
          trend="up"
          trendValue={`+${stats.growthRate}%`}
          color="green"
        />
        <StatCard
          title="Ticket Médio"
          value={`R$ ${stats.averageOrderValue.toFixed(2)}`}
          icon={MdTrendingUp}
          trend="up"
          trendValue="+8%"
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Orders */}
        <div className="lg:col-span-2">
          <AnimatedContainer animationType="fadeInUp" delay={300}>
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Pedidos Recentes</h2>
                <button className="text-red-600 hover:text-red-700 font-medium text-sm">
                  Ver Todos
                </button>
              </div>
              <div className="space-y-4">
                {recentOrders.map((order, index) => (
                  <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                        <MdShoppingCart className="text-red-600" size={20} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{order.id}</p>
                        <p className="text-sm text-gray-500">{order.customer}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">R$ {order.value.toFixed(2)}</p>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                        {getStatusText(order.status)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </AnimatedContainer>
        </div>

        {/* Top Items */}
        <div>
          <AnimatedContainer animationType="fadeInUp" delay={400}>
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Mais Vendidos</h2>
              <div className="space-y-4">
                {topItems.map((item, index) => (
                  <div key={item.name} className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-gradient-to-br from-red-100 to-red-200 rounded-xl flex items-center justify-center">
                        <span className="text-red-600 font-bold text-lg">#{index + 1}</span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{item.name}</p>
                      <p className="text-sm text-gray-500">{item.sold} vendidos</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">R$ {item.price.toFixed(2)}</p>
                      <p className="text-xs text-green-600">R$ {item.revenue.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </AnimatedContainer>
        </div>
      </div>

      {/* Quick Actions */}
      <AnimatedContainer animationType="fadeInUp" delay={500}>
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Ações Rápidas</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="p-4 bg-red-50 hover:bg-red-100 rounded-xl transition-colors text-left">
              <MdRestaurantMenu className="text-red-600 mb-2" size={24} />
              <h3 className="font-medium text-gray-900">Gerenciar Menu</h3>
            <p className="text-sm text-gray-500">Adicionar e editar itens</p>
            </button>
            <button className="p-4 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors text-left">
              <MdListAlt className="text-blue-600 mb-2" size={24} />
              <h3 className="font-medium text-gray-900">Ver Pedidos</h3>
            <p className="text-sm text-gray-500">Gerenciar pedidos ativos</p>
            </button>
            <button className="p-4 bg-green-50 hover:bg-green-100 rounded-xl transition-colors text-left">
              <MdSettings className="text-green-600 mb-2" size={24} />
              <h3 className="font-medium text-gray-900">Configurações</h3>
            <p className="text-sm text-gray-500">Ajustar preferências</p>
            </button>
          </div>
        </div>
      </AnimatedContainer>
    </div>
  );
}