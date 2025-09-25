'use client';

import React, { useState, useEffect } from 'react';
import { 
  FaShoppingBag, FaTruck, FaClock, FaDollarSign, 
  FaStar, FaChartLine, FaUsers, FaBell,
  FaCalendarAlt, FaArrowUp, FaArrowDown, FaUtensils
} from 'react-icons/fa';
import { useAuth } from '@/hooks/useAuth';

interface DashboardMetrics {
  todayOrders: number;
  todayRevenue: number;
  averageDeliveryTime: number;
  activeDeliveries: number;
  customerRating: number;
  totalCustomers: number;
  conversionRate: number;
  peakHours: string;
}

interface Order {
  id: string;
  customer: {
    name: string;
    phone: string;
  };
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivering' | 'delivered' | 'cancelled';
  createdAt: Date;
  estimatedDeliveryTime?: Date;
}

export default function DashboardTab() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
    
    // Atualização automática a cada 30 segundos
    const interval = setInterval(() => {
      refreshData();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Carregar métricas simuladas (em produção viriam da API)
      const mockMetrics: DashboardMetrics = {
        todayOrders: Math.floor(Math.random() * 50) + 10,
        todayRevenue: Math.floor(Math.random() * 2000) + 500,
        averageDeliveryTime: Math.floor(Math.random() * 20) + 25,
        activeDeliveries: Math.floor(Math.random() * 8) + 2,
        customerRating: 4.2 + Math.random() * 0.7,
        totalCustomers: Math.floor(Math.random() * 500) + 200,
        conversionRate: 8 + Math.random() * 8,
        peakHours: '19:00 - 21:00'
      };
      setMetrics(mockMetrics);

      // Carregar pedidos simulados
      const mockOrders: Order[] = [
        {
          id: `ORD-${Date.now()}-1`,
          customer: { name: 'João Silva', phone: '(11) 99999-9999' },
          items: [{ name: 'Pizza Margherita', quantity: 1, price: 35.90 }],
          total: 41.89,
          status: 'preparing',
          estimatedDeliveryTime: new Date(Date.now() + 35 * 60 * 1000),
          createdAt: new Date(Date.now() - 15 * 60 * 1000)
        },
        {
          id: `ORD-${Date.now()}-2`,
          customer: { name: 'Maria Santos', phone: '(11) 88888-8888' },
          items: [{ name: 'Hambúrguer Artesanal', quantity: 2, price: 28.50 }],
          total: 61.99,
          status: 'delivering',
          estimatedDeliveryTime: new Date(Date.now() + 20 * 60 * 1000),
          createdAt: new Date(Date.now() - 45 * 60 * 1000)
        }
      ];
      setRecentOrders(mockOrders);
      
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    try {
      // Atualizar apenas métricas para não sobrecarregar
      const mockMetrics: DashboardMetrics = {
        todayOrders: Math.floor(Math.random() * 50) + 10,
        todayRevenue: Math.floor(Math.random() * 2000) + 500,
        averageDeliveryTime: Math.floor(Math.random() * 20) + 25,
        activeDeliveries: Math.floor(Math.random() * 8) + 2,
        customerRating: 4.2 + Math.random() * 0.7,
        totalCustomers: Math.floor(Math.random() * 500) + 200,
        conversionRate: 8 + Math.random() * 8,
        peakHours: '19:00 - 21:00'
      };
      setMetrics(mockMetrics);
    } catch (error) {
      console.error('Erro ao atualizar dados:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'bg-gray-100 text-gray-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'preparing': return 'bg-yellow-100 text-yellow-800';
      case 'ready': return 'bg-orange-100 text-orange-800';
      case 'delivering': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'Pendente';
      case 'confirmed': return 'Confirmado';
      case 'preparing': return 'Preparando';
      case 'ready': return 'Pronto';
      case 'delivering': return 'Saiu para Entrega';
      case 'delivered': return 'Entregue';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-gray-600 mt-1">
            Visão geral do seu restaurante
            {refreshing && (
              <span className="ml-2 text-blue-600 text-sm">
                • Atualizando dados...
              </span>
            )}
          </p>
        </div>
        <button 
          onClick={refreshData}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          disabled={refreshing}
        >
          <FaArrowUp className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pedidos Hoje</p>
              <p className="text-3xl font-bold text-gray-900">{metrics?.todayOrders}</p>
              <p className="text-sm text-green-600 flex items-center mt-1">
                <FaArrowUp className="w-3 h-3 mr-1" />
                +12% vs ontem
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FaShoppingBag className="text-blue-600 text-xl" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Faturamento Hoje</p>
              <p className="text-3xl font-bold text-gray-900">
                R$ {metrics?.todayRevenue.toFixed(2)}
              </p>
              <p className="text-sm text-green-600 flex items-center mt-1">
                <FaArrowUp className="w-3 h-3 mr-1" />
                +8% vs ontem
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <FaDollarSign className="text-green-600 text-xl" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tempo Médio Entrega</p>
              <p className="text-3xl font-bold text-gray-900">{metrics?.averageDeliveryTime}min</p>
              <p className="text-sm text-red-600 flex items-center mt-1">
                <FaArrowDown className="w-3 h-3 mr-1" />
                -3min vs ontem
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <FaClock className="text-orange-600 text-xl" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Entregas Ativas</p>
              <p className="text-3xl font-bold text-gray-900">{metrics?.activeDeliveries}</p>
              <p className="text-sm text-blue-600 flex items-center mt-1">
                <FaTruck className="w-3 h-3 mr-1" />
                Em tempo real
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <FaTruck className="text-purple-600 text-xl" />
            </div>
          </div>
        </div>
      </div>

      {/* Entregas Ativas e Pedidos Recentes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900">Entregas Ativas</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentOrders.filter(order => ['preparing', 'ready', 'delivering'].includes(order.status)).map((order) => (
                <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <FaTruck className="text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">#{order.id.slice(-6)}</p>
                      <p className="text-sm text-gray-600">{order.customer.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {getStatusText(order.status)}
                    </span>
                    <p className="text-sm text-gray-600 mt-1">
                      {order.estimatedDeliveryTime ? new Date(order.estimatedDeliveryTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '-'}
                    </p>
                  </div>
                </div>
              ))}
              {recentOrders.filter(order => ['preparing', 'ready', 'delivering'].includes(order.status)).length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <FaTruck className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Nenhuma entrega ativa no momento</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900">Pedidos Recentes</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentOrders.slice(0, 5).map((order) => (
                <div key={order.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <FaShoppingBag className="text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">#{order.id.slice(-6)}</p>
                      <p className="text-sm text-gray-600">{order.customer.name}</p>
                      <p className="text-xs text-gray-500">
                        {order.createdAt.toLocaleTimeString('pt-BR', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">R$ {order.total.toFixed(2)}</p>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {getStatusText(order.status)}
                    </span>
                  </div>
                </div>
              ))}
              {recentOrders.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <FaShoppingBag className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Nenhum pedido encontrado</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Métricas Adicionais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avaliação dos Clientes</p>
              <p className="text-3xl font-bold text-gray-900">{metrics?.customerRating.toFixed(1)}</p>
              <div className="flex items-center mt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <FaStar 
                    key={star} 
                    className={`w-4 h-4 ${star <= Math.floor(metrics?.customerRating || 0) ? 'text-yellow-400' : 'text-gray-300'}`} 
                  />
                ))}
              </div>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <FaStar className="text-yellow-600 text-xl" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total de Clientes</p>
              <p className="text-3xl font-bold text-gray-900">{metrics?.totalCustomers}</p>
              <p className="text-sm text-blue-600 flex items-center mt-1">
                <FaUsers className="w-3 h-3 mr-1" />
                Base ativa
              </p>
            </div>
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
              <FaUsers className="text-indigo-600 text-xl" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Taxa de Conversão</p>
              <p className="text-3xl font-bold text-gray-900">{metrics?.conversionRate.toFixed(1)}%</p>
              <p className="text-sm text-green-600 flex items-center mt-1">
                <FaChartLine className="w-3 h-3 mr-1" />
                +2.1% vs mês anterior
              </p>
            </div>
            <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
              <FaChartLine className="text-teal-600 text-xl" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Horário de Pico</p>
              <p className="text-2xl font-bold text-gray-900">{metrics?.peakHours}</p>
              <p className="text-sm text-orange-600 flex items-center mt-1">
                <FaCalendarAlt className="w-3 h-3 mr-1" />
                Maior movimento
              </p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <FaCalendarAlt className="text-red-600 text-xl" />
            </div>
          </div>
        </div>
      </div>

      {/* Ações Rápidas */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">Ações Rápidas</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button className="flex flex-col items-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors group">
              <FaUtensils className="w-8 h-8 text-gray-400 group-hover:text-blue-500 mb-3" />
              <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700">
                Gerenciar Cardápio
              </span>
            </button>

            <button className="flex flex-col items-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors group">
              <FaShoppingBag className="w-8 h-8 text-gray-400 group-hover:text-green-500 mb-3" />
              <span className="text-sm font-medium text-gray-700 group-hover:text-green-700">
                Ver Todos os Pedidos
              </span>
            </button>

            <button className="flex flex-col items-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors group">
              <FaBell className="w-8 h-8 text-gray-400 group-hover:text-purple-500 mb-3" />
              <span className="text-sm font-medium text-gray-700 group-hover:text-purple-700">
                Notificações
              </span>
            </button>

            <button className="flex flex-col items-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors group">
              <FaChartLine className="w-8 h-8 text-gray-400 group-hover:text-orange-500 mb-3" />
              <span className="text-sm font-medium text-gray-700 group-hover:text-orange-700">
                Relatórios
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}