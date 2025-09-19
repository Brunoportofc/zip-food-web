'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FaStore, FaShoppingBag, FaTruck, FaClock, FaDollarSign, 
  FaStar, FaChartLine, FaUsers, FaMapMarkerAlt, FaBell,
  FaCalendarAlt, FaArrowUp, FaArrowDown, FaUtensils, FaPhone,
  FaEnvelope, FaEdit, FaCheck, FaTimes, FaInfoCircle, FaTachometerAlt,
  FaSave, FaSpinner
} from 'react-icons/fa';
import useAuthStore from '@/store/auth.store';
import { restaurantConfigService } from '@/services/restaurant-config.service';
import { restaurantService } from '@/services/restaurant.service';
import { orderService, Order } from '@/services/order.service';
import { RestaurantConfiguration } from '@/types/restaurant-config';
import { Restaurant } from '@/types/restaurant';

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

type TabType = 'dashboard' | 'restaurant-info';

const RestaurantDashboard = () => {
  const router = useRouter();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [config, setConfig] = useState<RestaurantConfiguration | null>(null);
  const [restaurantData, setRestaurantData] = useState<Restaurant | null>(null);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Estados para edição das informações do restaurante
  const [isEditing, setIsEditing] = useState(false);
  const [editingData, setEditingData] = useState<Partial<Restaurant>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user || user.type !== 'restaurant') {
      router.push('/auth/sign-in');
      return;
    }

    loadDashboardData();
    
    // Atualização automática a cada 30 segundos
    const interval = setInterval(() => {
      refreshData();
    }, 30000);

    return () => clearInterval(interval);
  }, [user, router]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Carregar configuração do restaurante
      const restaurantConfig = await restaurantConfigService.getRestaurantConfig(user!.id);
      setConfig(restaurantConfig);
      
      // Buscar dados reais do restaurante na API
      try {
        const restaurants = await restaurantService.getRestaurants();
        const currentRestaurant = restaurants.find(r => r.ownerId === user!.id);
        setRestaurantData(currentRestaurant || null);
      } catch (error) {
        console.log('Restaurante ainda não cadastrado na API principal');
      }
      
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

      // Carregar pedidos simulados (em produção viriam da API)
      const mockOrders: Order[] = [
        {
          id: `ORD-${Date.now()}-1`,
          restaurantId: user!.id,
          customerId: 'customer-1',
          customer: { id: 'customer-1', name: 'João Silva', phone: '(11) 99999-9999', address: 'Rua A, 123' },
          items: [{ id: '1', name: 'Pizza Margherita', quantity: 1, price: 35.90 }],
          subtotal: 35.90,
          deliveryFee: 5.99,
          total: 41.89,
          status: 'preparing' as const,
          estimatedDeliveryTime: '35 min',
          createdAt: new Date(Date.now() - 15 * 60 * 1000),
          updatedAt: new Date(),
          statusHistory: []
        },
        {
          id: `ORD-${Date.now()}-2`,
          restaurantId: user!.id,
          customerId: 'customer-2',
          customer: { id: 'customer-2', name: 'Maria Santos', phone: '(11) 88888-8888', address: 'Rua B, 456' },
          items: [{ id: '2', name: 'Hambúrguer Artesanal', quantity: 2, price: 28.50 }],
          subtotal: 57.00,
          deliveryFee: 4.99,
          total: 61.99,
          status: 'delivering' as const,
          estimatedDeliveryTime: '20 min',
          confirmationCode: '1234',
          createdAt: new Date(Date.now() - 45 * 60 * 1000),
          updatedAt: new Date(),
          statusHistory: []
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
      // Atualizar apenas métricas e pedidos para não sobrecarregar
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

  // Funções para edição das informações do restaurante
  const handleEditStart = () => {
    const dataToEdit = restaurantData || {
      name: config?.name || '',
      description: config?.description || '',
      category: config?.category || '',
      phone: config?.phone || '',
      email: config?.email || '',
      address: config?.address || '',
      deliveryFee: config?.deliveryFee || 0,
      minimumOrder: config?.minimumOrder || 0,
      status: 'active'
    };
    setEditingData(dataToEdit);
    setIsEditing(true);
  };

  const handleEditCancel = () => {
    setIsEditing(false);
    setEditingData({});
  };

  const handleEditSave = async () => {
    try {
      setSaving(true);
      
      // Atualizar configuração local
      if (config) {
        const updatedConfig = {
          ...config,
          name: editingData.name || config.name,
          description: editingData.description || config.description,
          category: editingData.category || config.category,
          phone: editingData.phone || config.phone,
          email: editingData.email || config.email,
          address: editingData.address || config.address,
          deliveryFee: editingData.deliveryFee || config.deliveryFee,
          minimumOrder: editingData.minimumOrder || config.minimumOrder
        };
        
        await restaurantConfigService.updateRestaurantConfig(user!.id, updatedConfig);
        setConfig(updatedConfig);
      }

      // Se o restaurante já existe na API principal, atualizar também
      if (restaurantData && editingData.id) {
        const updatedRestaurant = { ...restaurantData, ...editingData };
        await restaurantService.updateRestaurant(editingData.id, updatedRestaurant);
        setRestaurantData(updatedRestaurant);
      }

      setIsEditing(false);
      setEditingData({});
      
      // Recarregar dados para garantir sincronização
      await loadDashboardData();
      
    } catch (error) {
      console.error('Erro ao salvar informações:', error);
      alert('Erro ao salvar informações. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof Restaurant, value: any) => {
    setEditingData(prev => ({
      ...prev,
      [field]: value
    }));
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {restaurantData?.name || config?.businessName || 'Dashboard'}
              </h1>
              <p className="text-gray-600 mt-1">
                Painel de controle operacional
                {refreshing && (
                  <span className="ml-2 text-blue-600 text-sm">
                    • Atualizando dados...
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                onClick={refreshData}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={refreshing}
              >
                <FaArrowUp className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              <button className="relative p-2 text-gray-600 hover:text-gray-900">
                <FaBell className="w-6 h-6" />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  3
                </span>
              </button>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                  <FaStore className="text-white text-sm" />
                </div>
                <span className="text-sm font-medium text-green-700">Online</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sistema de Abas */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'dashboard'
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <FaTachometerAlt className="w-4 h-4" />
                  <span>Dashboard</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('restaurant-info')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'restaurant-info'
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <FaInfoCircle className="w-4 h-4" />
                  <span>Informações do Restaurante</span>
                </div>
              </button>
            </nav>
          </div>
        </div>

        {/* Conteúdo das Abas */}
        {activeTab === 'restaurant-info' && (
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Dados do Restaurante</h2>
                {!isEditing ? (
                  <button 
                    onClick={handleEditStart}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <FaEdit className="w-4 h-4" />
                    <span>Editar</span>
                  </button>
                ) : (
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={handleEditCancel}
                      className="flex items-center space-x-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                      disabled={saving}
                    >
                      <FaTimes className="w-4 h-4" />
                      <span>Cancelar</span>
                    </button>
                    <button 
                      onClick={handleEditSave}
                      className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      disabled={saving}
                    >
                      {saving ? (
                        <FaSpinner className="w-4 h-4 animate-spin" />
                      ) : (
                        <FaSave className="w-4 h-4" />
                      )}
                      <span>{saving ? 'Salvando...' : 'Salvar'}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {/* Informações Básicas */}
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900 border-b pb-2">Informações Básicas</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Nome do Restaurante</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editingData.name || ''}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                          placeholder="Nome do restaurante"
                        />
                      ) : (
                        <p className="font-medium text-gray-900 py-2">
                          {restaurantData?.name || config?.businessName || 'Não informado'}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Descrição</label>
                      {isEditing ? (
                        <textarea
                          value={editingData.description || ''}
                          onChange={(e) => handleInputChange('description', e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                          placeholder="Descrição do restaurante"
                        />
                      ) : (
                        <p className="text-gray-900 py-2">
                          {restaurantData?.description || config?.description || 'Não informado'}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Categoria</label>
                      {isEditing ? (
                        <select
                          value={editingData.category || ''}
                          onChange={(e) => handleInputChange('category', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        >
                          <option value="">Selecione uma categoria</option>
                          <option value="Pizzaria">Pizzaria</option>
                          <option value="Hamburgueria">Hamburgueria</option>
                          <option value="Japonesa">Japonesa</option>
                          <option value="Italiana">Italiana</option>
                          <option value="Brasileira">Brasileira</option>
                          <option value="Mexicana">Mexicana</option>
                          <option value="Chinesa">Chinesa</option>
                          <option value="Vegetariana">Vegetariana</option>
                          <option value="Doces e Sobremesas">Doces e Sobremesas</option>
                          <option value="Lanches">Lanches</option>
                        </select>
                      ) : (
                        <p className="text-gray-900 py-2">
                          {restaurantData?.category || config?.category || 'Não informado'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Contato */}
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900 border-b pb-2">Contato</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Telefone</label>
                      {isEditing ? (
                        <input
                          type="tel"
                          value={editingData.phone || ''}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                          placeholder="(11) 99999-9999"
                        />
                      ) : (
                        <div className="flex items-center space-x-2 py-2">
                          <FaPhone className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-900">
                            {restaurantData?.phone || config?.phone || 'Não informado'}
                          </span>
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">E-mail</label>
                      {isEditing ? (
                        <input
                          type="email"
                          value={editingData.email || ''}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                          placeholder="contato@restaurante.com"
                        />
                      ) : (
                        <div className="flex items-center space-x-2 py-2">
                          <FaEnvelope className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-900">
                            {restaurantData?.email || config?.email || 'Não informado'}
                          </span>
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Endereço</label>
                      {isEditing ? (
                        <textarea
                          value={editingData.address || ''}
                          onChange={(e) => handleInputChange('address', e.target.value)}
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                          placeholder="Rua, número, bairro, cidade"
                        />
                      ) : (
                        <div className="flex items-start space-x-2 py-2">
                          <FaMapMarkerAlt className="w-4 h-4 text-gray-500 mt-1" />
                          <span className="text-gray-900">
                            {restaurantData?.address || config?.address || 'Não informado'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Configurações */}
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900 border-b pb-2">Configurações</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Taxa de Entrega</label>
                      {isEditing ? (
                        <div className="relative">
                          <span className="absolute left-3 top-2 text-gray-500">R$</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={editingData.deliveryFee || ''}
                            onChange={(e) => handleInputChange('deliveryFee', parseFloat(e.target.value) || 0)}
                            className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                            placeholder="0.00"
                          />
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2 py-2">
                          <FaDollarSign className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-900">
                            R$ {(restaurantData?.deliveryFee || config?.deliveryFee || 0).toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Pedido Mínimo</label>
                      {isEditing ? (
                        <div className="relative">
                          <span className="absolute left-3 top-2 text-gray-500">R$</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={editingData.minimumOrder || ''}
                            onChange={(e) => handleInputChange('minimumOrder', parseFloat(e.target.value) || 0)}
                            className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                            placeholder="0.00"
                          />
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2 py-2">
                          <FaShoppingBag className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-900">
                            R$ {(restaurantData?.minimumOrder || config?.minimumOrder || 0).toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Status</label>
                      {isEditing ? (
                        <select
                          value={editingData.status || 'active'}
                          onChange={(e) => handleInputChange('status', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        >
                          <option value="active">Ativo</option>
                          <option value="inactive">Inativo</option>
                          <option value="pending">Pendente</option>
                        </select>
                      ) : (
                        <div className="py-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            (restaurantData?.status || 'active') === 'active' 
                              ? 'bg-green-100 text-green-800' 
                              : (restaurantData?.status || 'active') === 'inactive'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {(restaurantData?.status || 'active') === 'active' ? 'Ativo' : 
                             (restaurantData?.status || 'active') === 'inactive' ? 'Inativo' : 'Pendente'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'dashboard' && (
          <>
            {/* Métricas Principais */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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

            {/* Entregas Ativas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-sm">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">Entregas Ativas</h2>
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
                          <p className="text-sm text-gray-600 mt-1">{order.estimatedDeliveryTime}</p>
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

              {/* Pedidos Recentes */}
              <div className="bg-white rounded-lg shadow-sm">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">Pedidos Recentes</h2>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
                <h2 className="text-xl font-semibold text-gray-900">Ações Rápidas</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <button 
                    onClick={() => router.push('/restaurant/menu')}
                    className="flex flex-col items-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors group"
                  >
                    <FaUtensils className="w-8 h-8 text-gray-400 group-hover:text-blue-500 mb-3" />
                    <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700">
                      Gerenciar Cardápio
                    </span>
                  </button>

                  <button 
                    onClick={() => router.push('/restaurant/orders')}
                    className="flex flex-col items-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors group"
                  >
                    <FaShoppingBag className="w-8 h-8 text-gray-400 group-hover:text-green-500 mb-3" />
                    <span className="text-sm font-medium text-gray-700 group-hover:text-green-700">
                      Ver Todos os Pedidos
                    </span>
                  </button>

                  <button 
                    onClick={() => router.push('/restaurant/settings')}
                    className="flex flex-col items-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors group"
                  >
                    <FaStore className="w-8 h-8 text-gray-400 group-hover:text-purple-500 mb-3" />
                    <span className="text-sm font-medium text-gray-700 group-hover:text-purple-700">
                      Configurações
                    </span>
                  </button>

                  <button 
                    onClick={() => router.push('/restaurant/reports')}
                    className="flex flex-col items-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors group"
                  >
                    <FaChartLine className="w-8 h-8 text-gray-400 group-hover:text-orange-500 mb-3" />
                    <span className="text-sm font-medium text-gray-700 group-hover:text-orange-700">
                      Relatórios
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default RestaurantDashboard;