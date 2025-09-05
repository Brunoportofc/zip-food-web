'use client';

import { useEffect, useState } from 'react';
import useAuthStore from '@/store/auth.store';
import AnimatedContainer from '@/components/AnimatedContainer';
import { useTranslation } from 'react-i18next';
import { 
  MdDeliveryDining, 
  MdAttachMoney, 
  MdCheckCircle, 
  MdAccessTime,
  MdTrendingUp,
  MdLocationOn,
  MdStar,
  MdNotifications
} from 'react-icons/md';
import '@/i18n';

interface DeliveryStats {
  totalDeliveries: number;
  availableOrders: number;
  completedToday: number;
  earnings: number;
  status: 'online' | 'offline';
}

export default function DeliveryDashboard() {
  const { user } = useAuthStore();
  const { t } = useTranslation();
  const [stats, setStats] = useState<DeliveryStats>({
    totalDeliveries: 0,
    availableOrders: 0,
    completedToday: 0,
    earnings: 0,
    status: 'offline',
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulação de carregamento de dados
    const timer = setTimeout(() => {
      // Dados simulados para demonstração
      setStats({
        totalDeliveries: parseInt(t('delivery.dashboard.mock_data.total_deliveries', '128')),
        availableOrders: parseInt(t('delivery.dashboard.mock_data.available_orders', '5')),
        completedToday: parseInt(t('delivery.dashboard.mock_data.completed_today', '8')),
        earnings: parseFloat(t('delivery.dashboard.mock_data.earnings', '320.50')),
        status: 'offline',
      });
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const toggleStatus = () => {
    setStats({
      ...stats,
      status: stats.status === 'online' ? 'offline' : 'online',
    });
  };

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    color = 'blue',
    trend,
    trendValue 
  }: { 
    title: string; 
    value: string | number; 
    icon: any;
    color?: string;
    trend?: 'up' | 'down';
    trendValue?: string;
  }) => {
    const colorClasses = {
      blue: 'from-blue-500 to-blue-600',
      green: 'from-green-500 to-green-600',
      yellow: 'from-yellow-500 to-yellow-600',
      purple: 'from-purple-500 to-purple-600'
    };

    return (
      <AnimatedContainer animationType="fadeInUp" className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300">
        <div className="flex items-center justify-between mb-4">
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${colorClasses[color]} flex items-center justify-center`}>
            <Icon size={24} className="text-white" />
          </div>
          {trend && (
            <div className={`flex items-center text-sm ${
              trend === 'up' ? 'text-green-600' : 'text-red-600'
            }`}>
              <MdTrendingUp size={16} className={trend === 'down' ? 'rotate-180' : ''} />
              <span className="ml-1">{trendValue}</span>
            </div>
          )}
        </div>
        <div>
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <p className="text-2xl lg:text-3xl font-bold text-gray-900">{value}</p>
        </div>
      </AnimatedContainer>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <AnimatedContainer animationType="pulse">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </AnimatedContainer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <AnimatedContainer animationType="fadeInDown" delay={0}>
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 lg:p-8 rounded-b-3xl shadow-2xl mb-6 lg:mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-3 lg:space-x-4">
              <div className="w-12 h-12 lg:w-16 lg:h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                <MdDeliveryDining size={24} className="text-white lg:hidden" />
                <MdDeliveryDining size={32} className="text-white hidden lg:block" />
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold">{t('delivery.dashboard.title')}</h1>
                <p className="text-blue-100 mt-1 text-sm lg:text-base hidden sm:block">{t('delivery.dashboard.welcome', { name: user?.name })}</p>
              </div>
            </div>
            <div className="text-left sm:text-right w-full sm:w-auto">
              <p className="text-blue-100 text-xs lg:text-sm">{t('delivery.dashboard.current_status')}</p>
              <div className="flex items-center space-x-2 mt-1">
                <div className={`w-3 h-3 rounded-full ${stats.status === 'online' ? 'bg-green-400' : 'bg-red-400'}`}></div>
                <p className="text-white font-semibold text-sm lg:text-base">
                  {stats.status === 'online' ? t('delivery.dashboard.online') : t('delivery.dashboard.offline')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </AnimatedContainer>

      <div className="max-w-7xl mx-auto px-4 lg:px-6 pb-6 lg:pb-8">
        {/* Status Card */}
        <AnimatedContainer animationType="fadeInUp" delay={100}>
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6 lg:mb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
              <div className="flex items-center space-x-4">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                  stats.status === 'online' ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  <div className={`w-8 h-8 rounded-full ${
                    stats.status === 'online' ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{t('delivery.dashboard.delivery_status')}</h2>
                  <p className="text-gray-600">{stats.status === 'online' ? t('delivery.dashboard.available_for_deliveries') : t('delivery.dashboard.unavailable')}</p>
                </div>
              </div>
              <button
                onClick={toggleStatus}
                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 ${
                  stats.status === 'online' 
                    ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg' 
                    : 'bg-green-500 hover:bg-green-600 text-white shadow-lg'
                }`}
              >
                {stats.status === 'online' ? t('delivery.dashboard.go_offline') : t('delivery.dashboard.go_online')}
              </button>
            </div>
          </div>
        </AnimatedContainer>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
          <StatCard
            title={t('delivery.dashboard.total_deliveries')}
            value={stats.totalDeliveries}
            icon={MdDeliveryDining}
            color="blue"
            trend="up"
            trendValue="+12%"
          />
          <StatCard
            title={t('delivery.dashboard.available_orders')}
            value={stats.availableOrders}
            icon={MdNotifications}
            color="yellow"
          />
          <StatCard
            title={t('delivery.dashboard.deliveries_today')}
            value={stats.completedToday}
            icon={MdCheckCircle}
            color="green"
            trend="up"
            trendValue="+3"
          />
          <StatCard
            title={t('delivery.dashboard.earnings_today')}
            value={`${t('delivery.dashboard.mock_data.currency_symbol', 'R$')} ${stats.earnings.toFixed(2)}`}
            icon={MdAttachMoney}
            color="purple"
            trend="up"
            trendValue={`+${t('delivery.dashboard.mock_data.currency_symbol', 'R$')} 45`}
          />
        </div>

        {/* Available Orders */}
        <AnimatedContainer animationType="fadeInUp" delay={200}>
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6 lg:mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <MdNotifications size={20} className="text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">{t('delivery.dashboard.available_orders')}</h2>
              </div>
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                {stats.availableOrders} {t('delivery.dashboard.available')}
              </span>
            </div>
            
            {stats.availableOrders > 0 ? (
              <div className="space-y-4">
                {Array.from({ length: stats.availableOrders }).map((_, index) => (
                  <AnimatedContainer key={index} animationType="fadeInLeft" delay={300 + index * 100}>
                    <div className="border border-gray-200 rounded-xl p-4 lg:p-6 hover:border-blue-300 hover:shadow-md transition-all duration-300">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-3">
                            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                              <span className="text-white text-sm font-bold">#{1000 + index}</span>
                            </div>
                            <h3 className="font-semibold text-gray-900">{t('delivery.dashboard.order')} #{1000 + index}</h3>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                            <div className="flex items-center space-x-2">
                              <MdLocationOn size={16} className="text-gray-400" />
                              <span className="text-gray-600">{t('delivery.dashboard.restaurant')}: {['Burger King', 'McDonalds', 'Pizza Hut', 'Subway', 'KFC'][index % 5]}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <MdAccessTime size={16} className="text-gray-400" />
                              <span className="text-gray-600">{t('delivery.dashboard.distance')}: {(2 + index * 0.5).toFixed(1)} km</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                          <div className="text-center sm:text-right">
                            <p className="text-2xl font-bold text-green-600">{t('delivery.dashboard.mock_data.currency_symbol', 'R$')} {(15 + index * 2).toFixed(2)}</p>
                            <p className="text-xs text-gray-500">{t('delivery.dashboard.estimated_earnings')}</p>
                          </div>
                          <button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg">
                            {t('delivery.dashboard.accept_delivery')}
                          </button>
                        </div>
                      </div>
                    </div>
                  </AnimatedContainer>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MdDeliveryDining size={32} className="text-gray-400" />
                </div>
                <p className="text-gray-500 text-lg font-medium">{t('delivery.dashboard.no_orders_available')}</p>
                <p className="text-sm text-gray-400 mt-2">{t('delivery.dashboard.stay_online_message')}</p>
              </div>
            )}
          </div>
        </AnimatedContainer>

        {/* Weekly Summary */}
        <AnimatedContainer animationType="fadeInUp" delay={300}>
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <MdStar size={20} className="text-purple-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">{t('delivery.dashboard.week_summary')}</h2>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <MdDeliveryDining size={24} className="text-white" />
                </div>
                <p className="text-sm text-gray-600 mb-1">{t('delivery.dashboard.total_deliveries')}</p>
                <p className="text-2xl font-bold text-gray-900">32</p>
              </div>
              
              <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
                <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <MdAttachMoney size={24} className="text-white" />
                </div>
                <p className="text-sm text-gray-600 mb-1">{t('delivery.dashboard.weekly_earnings')}</p>
                <p className="text-2xl font-bold text-gray-900">{t('delivery.dashboard.mock_data.currency_symbol', 'R$')} 640,00</p>
              </div>
              
              <div className="text-center p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl">
                <div className="w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <MdTrendingUp size={24} className="text-white" />
                </div>
                <p className="text-sm text-gray-600 mb-1">{t('delivery.dashboard.average_per_delivery')}</p>
                <p className="text-2xl font-bold text-gray-900">{t('delivery.dashboard.mock_data.currency_symbol', 'R$')} 20,00</p>
              </div>
              
              <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
                <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <MdAccessTime size={24} className="text-white" />
                </div>
                <p className="text-sm text-gray-600 mb-1">{t('delivery.dashboard.hours_online')}</p>
                <p className="text-2xl font-bold text-gray-900">24h</p>
              </div>
            </div>
          </div>
        </AnimatedContainer>
      </div>
    </div>
  );
}