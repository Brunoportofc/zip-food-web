'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { 
  FaTachometerAlt, FaUtensils, FaShoppingBag, FaCog, 
  FaStore, FaBell, FaSignOutAlt 
} from 'react-icons/fa';
import DashboardTab from '@/components/restaurant/DashboardTab';
import MenuTab from '@/components/restaurant/MenuTab';
import OrdersTab from '@/components/restaurant/OrdersTab';

type TabType = 'dashboard' | 'menu' | 'orders' | 'settings';

export default function RestaurantPage() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/auth/sign-in');
      return;
    }

    if (user.userRole !== 'restaurant') {
      router.push('/auth/sign-in');
      return;
    }

    setLoading(false);
  }, [user, router]);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/auth/sign-in');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const tabs = [
    {
      id: 'dashboard' as TabType,
      label: 'Dashboard',
      icon: FaTachometerAlt,
      description: 'Visão geral do restaurante'
    },
    {
      id: 'menu' as TabType,
      label: 'Cardápio',
      icon: FaUtensils,
      description: 'Gerenciar itens do cardápio'
    },
    {
      id: 'orders' as TabType,
      label: 'Pedidos',
      icon: FaShoppingBag,
      description: 'Acompanhar pedidos'
    },
    {
      id: 'settings' as TabType,
      label: 'Configurações',
      icon: FaCog,
      description: 'Configurações do restaurante'
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
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
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
                <FaStore className="text-white text-xl" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Painel do Restaurante
                </h1>
                <p className="text-gray-600">
                  Bem-vindo, {user?.userData?.displayName || user?.user?.displayName || 'Restaurante'}!
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                <FaBell className="w-6 h-6" />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  3
                </span>
              </button>
              
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
                <span className="text-sm font-medium text-green-700">Online</span>
              </div>
              
              <button
                onClick={handleSignOut}
                className="flex items-center space-x-2 text-gray-600 hover:text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors"
              >
                <FaSignOutAlt className="w-4 h-4" />
                <span>Sair</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-red-500 text-red-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Icon className="w-4 h-4" />
                      <span>{tab.label}</span>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          {activeTab === 'dashboard' && <DashboardTab />}
          {activeTab === 'menu' && <MenuTab />}
          {activeTab === 'orders' && <OrdersTab />}
          {activeTab === 'settings' && (
            <div className="text-center py-12">
              <FaCog className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Configurações</h3>
              <p className="text-gray-600">
                Esta seção está em desenvolvimento.
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Em breve você poderá configurar horários de funcionamento, formas de pagamento e muito mais.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}