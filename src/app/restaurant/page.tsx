'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import StripeConnectionDashboard from '@/components/restaurant/StripeConnectionDashboard';
import { 
  FaTachometerAlt, FaCog, 
  FaStore, FaCreditCard
} from 'react-icons/fa';
import DashboardTab from '@/components/restaurant/DashboardTab';
import { useLanguage } from '@/contexts/LanguageContext';

type TabType = 'dashboard' | 'settings' | 'payments';

export default function RestaurantPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const { user, userData, userRole, loading: authLoading, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [loading, setLoading] = useState(true);
  const [restaurantData, setRestaurantData] = useState<any>(null);

  useEffect(() => {
    console.log('[RestaurantPage] 🔄 Estado da autenticação:', {
      authLoading,
      hasUser: !!user,
      userRole,
      hasUserData: !!userData,
      timestamp: new Date().toISOString()
    });

    // ✨ CORREÇÃO: Se chegou aqui, o middleware já validou tudo
    // Não fazer redirecionamentos desnecessários
    if (authLoading) {
      console.log('[RestaurantPage] ⏳ Aguardando carregamento da autenticação...');
      return;
    }

    // Se não tem usuário após o loading, algo deu errado
    if (!user && !authLoading) {
      console.log('[RestaurantPage] ❌ Usuário não encontrado após carregamento, redirecionando...');
      router.push('/auth/sign-in');
      return;
    }

    // Se tem usuário mas papel não é restaurante
    if (user && userRole && userRole !== 'restaurant') {
      console.log('[RestaurantPage] ❌ Papel do usuário não é restaurante:', userRole);
      router.push('/auth/sign-in');
      return;
    }

    // Se chegou aqui, está tudo OK
    if (user && (userRole === 'restaurant' || !userRole)) {
      console.log('[RestaurantPage] ✅ Usuário válido, carregando dashboard...');
      loadRestaurantData();
      setLoading(false);
    }
  }, [user, userData, userRole, authLoading, router]);

  const loadRestaurantData = async () => {
    try {
      console.log('[RestaurantPage] 🔄 Carregando dados do restaurante...');
      
      // Buscar dados do restaurante via API
      const response = await fetch('/api/restaurant/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.uid })
      });

      console.log('[RestaurantPage] 📡 Resposta da API:', {
        status: response.status,
        ok: response.ok
      });

      if (response.ok) {
        const data = await response.json();
        console.log('[RestaurantPage] 📋 Dados recebidos:', data);
        
        if (data.hasRestaurant) {
          console.log('[RestaurantPage] ✅ Restaurante encontrado, carregando dashboard');
          setRestaurantData(data.restaurantData);
        } else {
          console.log('[RestaurantPage] ⚠️ Restaurante não encontrado, redirecionando para cadastro');
          router.replace('/restaurant/cadastro');
          return;
        }
      } else {
        console.log('[RestaurantPage] ❌ Erro na API de verificação, redirecionando para cadastro');
        router.replace('/restaurant/cadastro');
        return;
      }
    } catch (error) {
      console.error('[RestaurantPage] ❌ Erro ao carregar dados:', error);
      console.log('[RestaurantPage] ❌ Redirecionando para cadastro devido ao erro');
      router.replace('/restaurant/cadastro');
    }
  };

  const tabs = [
    {
      id: 'dashboard' as TabType,
      label: t('dashboard.dashboard'),
      icon: FaTachometerAlt,
      description: t('dashboard.overview')
    },
    {
      id: 'payments' as TabType,
      label: t('payment.payments'),
      icon: FaCreditCard,
      description: t('payment.connectStripe')
    },
    {
      id: 'settings' as TabType,
      label: t('common.settings'),
      icon: FaCog,
      description: t('restaurant.restaurantSettings')
    }
  ];

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-[#101828] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-300">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#101828]">
      {/* Header */}
      <div className="bg-[#101828] shadow-sm border-b border-green-500">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                <FaStore className="text-white text-xl" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  {restaurantData?.name || t('dashboard.restaurantPanel')}
                </h1>
                <p className="text-gray-300">
                  {t('dashboard.welcomeBack')}, {userData?.displayName || user?.displayName || t('restaurant.restaurant')}!
                </p>
                {restaurantData && (
                  <p className="text-sm text-gray-400">
                    {t('dashboard.status')}: {restaurantData.is_active ? `🟢 ${t('common.active')}` : `🔴 ${t('common.inactive')}`}
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
                <span className="text-sm font-medium text-green-400">{t('dashboard.online')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Navigation Tabs */}
        <div className="bg-[#101828] rounded-lg shadow-sm mb-6 border border-green-500">
          <div className="border-b border-green-500">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-green-500 text-green-400'
                        : 'border-transparent text-gray-300 hover:text-white hover:border-green-300'
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
        <div className="bg-[#101828] rounded-lg shadow-sm p-6 border border-green-500">
          {activeTab === 'dashboard' && <DashboardTab restaurantData={restaurantData} />}
          {activeTab === 'payments' && (
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">🔗 {t('payment.stripeConnection')}</h2>
                <p className="text-gray-300">
                  {t('payment.stripeConnectionDesc')}
                </p>
              </div>
              <StripeConnectionDashboard />
            </div>
          )}
          {activeTab === 'settings' && (
            <div className="text-center py-12">
              <FaCog className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">{t('common.settings')}</h3>
              <p className="text-gray-300">
                {t('dashboard.sectionInDevelopment')}
              </p>
              <p className="text-sm text-gray-400 mt-2">
                {t('dashboard.comingSoonFeatures')}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}