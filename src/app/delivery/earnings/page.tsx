'use client';

import { useState, useEffect } from 'react';
import AnimatedContainer from '@/components/AnimatedContainer';
import { useTranslation } from 'react-i18next';
import { 
  MdAttachMoney, 
  MdTrendingUp, 
  MdTrendingDown,
  MdCalendarToday,
  MdAccessTime,
  MdDeliveryDining,
  MdBarChart,
  MdPieChart,
  MdShowChart,
  MdDateRange,
  MdCheckCircle
} from 'react-icons/md';
import '@/i18n';

type Period = 'day' | 'week' | 'month';

interface EarningDay {
  date: Date;
  amount: number;
  deliveries: number;
}

interface EarningsSummary {
  totalEarnings: number;
  totalDeliveries: number;
  averagePerDelivery: number;
  bestDay: {
    date: Date;
    amount: number;
  };
}

export default function DeliveryEarnings() {
  const { t } = useTranslation();
  const [activePeriod, setActivePeriod] = useState<Period>('week');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);
  
  // Dados simulados de ganhos
  const currentDate = new Date();
  const [earningsData, setEarningsData] = useState<EarningDay[]>([
    // Dados para a semana atual
    {
      date: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 6),
      amount: 85.50,
      deliveries: 7,
    },
    {
      date: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 5),
      amount: 92.30,
      deliveries: 8,
    },
    {
      date: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 4),
      amount: 110.75,
      deliveries: 9,
    },
    {
      date: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 3),
      amount: 78.20,
      deliveries: 6,
    },
    {
      date: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 2),
      amount: 105.40,
      deliveries: 8,
    },
    {
      date: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 1),
      amount: 120.80,
      deliveries: 10,
    },
    {
      date: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()),
      amount: 65.90,
      deliveries: 5,
    },
  ]);

  // Filtrar dados com base no período selecionado
  const getFilteredData = (): EarningDay[] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    switch (activePeriod) {
      case 'day':
        return earningsData.filter(item => {
          const itemDate = new Date(item.date);
          itemDate.setHours(0, 0, 0, 0);
          return itemDate.getTime() === today.getTime();
        });
      
      case 'week': {
        const oneWeekAgo = new Date(today);
        oneWeekAgo.setDate(today.getDate() - 6);
        return earningsData.filter(item => {
          const itemDate = new Date(item.date);
          itemDate.setHours(0, 0, 0, 0);
          return itemDate >= oneWeekAgo && itemDate <= today;
        });
      }
      
      case 'month': {
        const oneMonthAgo = new Date(today);
        oneMonthAgo.setMonth(today.getMonth() - 1);
        return earningsData.filter(item => {
          const itemDate = new Date(item.date);
          itemDate.setHours(0, 0, 0, 0);
          return itemDate >= oneMonthAgo && itemDate <= today;
        });
      }
      
      default:
        return earningsData;
    }
  };

  const filteredData = getFilteredData();
  
  // Calcular resumo dos ganhos
  const calculateSummary = (): EarningsSummary => {
    if (filteredData.length === 0) {
      return {
        totalEarnings: 0,
        totalDeliveries: 0,
        averagePerDelivery: 0,
        bestDay: {
          date: new Date(),
          amount: 0,
        },
      };
    }
    
    const totalEarnings = filteredData.reduce((sum, day) => sum + day.amount, 0);
    const totalDeliveries = filteredData.reduce((sum, day) => sum + day.deliveries, 0);
    
    // Encontrar o melhor dia
    const bestDay = filteredData.reduce((best, current) => {
      return current.amount > best.amount ? current : best;
    }, filteredData[0]);
    
    return {
      totalEarnings,
      totalDeliveries,
      averagePerDelivery: totalDeliveries > 0 ? totalEarnings / totalDeliveries : 0,
      bestDay: {
        date: bestDay.date,
        amount: bestDay.amount,
      },
    };
  };

  const summary = calculateSummary();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <AnimatedContainer animationType="fadeIn">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </AnimatedContainer>
      </div>
    );
  }

  // Formatar data para exibição
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('pt-BR', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
    });
  };

  // Calcular altura da barra no gráfico
  const getBarHeight = (amount: number): string => {
    const maxAmount = Math.max(...filteredData.map(day => day.amount));
    const percentage = maxAmount > 0 ? (amount / maxAmount) * 100 : 0;
    return `${Math.max(percentage, 10)}%`; // Mínimo de 10% para visualização
  };

  // Obter título do período
  const getPeriodTitle = (): string => {
    switch (activePeriod) {
      case 'today':
        return t('delivery.earnings.today');
      case 'week':
        return t('delivery.earnings.this_week');
      case 'month':
        return t('delivery.earnings.this_month');
      default:
        return '';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <AnimatedContainer animationType="fadeInDown" delay={0}>
        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 lg:p-8 rounded-b-3xl shadow-2xl mb-6 lg:mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-3 lg:space-x-4">
              <div className="w-12 h-12 lg:w-16 lg:h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                <MdAttachMoney size={24} className="text-white lg:hidden" />
                <MdAttachMoney size={32} className="text-white hidden lg:block" />
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold">{t('delivery.earnings.title')}</h1>
            <p className="text-blue-100 mt-1 text-sm lg:text-base hidden sm:block">{t('delivery.earnings.subtitle')}</p>
              </div>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-blue-100 text-xs lg:text-sm">{t('delivery.earnings.total_accumulated')}</p>
              <p className="text-white font-bold text-lg lg:text-xl">{t('delivery.dashboard.mock_data.currency_symbol', 'R$')} {summary.totalEarnings.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </AnimatedContainer>

      <div className="max-w-7xl mx-auto px-4 lg:px-6 pb-6 lg:pb-8">
        {/* Period Filter */}
        <AnimatedContainer animationType="fadeInUp" delay={100}>
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 lg:p-6 mb-6 lg:mb-8">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <MdDateRange size={18} className="text-green-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">{t('delivery.earnings.analysis_period')}</h2>
            </div>
            <div className="flex flex-wrap gap-3">
              {[
                { key: 'day', label: t('delivery.earnings.today'), icon: MdCalendarToday },
                { key: 'week', label: t('delivery.earnings.week'), icon: MdBarChart },
                { key: 'month', label: t('delivery.earnings.month'), icon: MdShowChart }
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActivePeriod(key as Period)}
                  className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 hover:scale-105 flex items-center space-x-2 ${
                    activePeriod === key 
                      ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  <Icon size={18} />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>
        </AnimatedContainer>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
          <AnimatedContainer animationType="fadeInUp" delay={200}>
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center">
                  <MdAttachMoney size={24} className="text-white" />
                </div>
                <div className="flex items-center text-sm text-green-600">
                  <MdTrendingUp size={16} />
                  <span className="ml-1">+15%</span>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">{t('delivery.earnings.total_earnings')}</p>
                <p className="text-2xl lg:text-3xl font-bold text-gray-900">{t('delivery.dashboard.mock_data.currency_symbol', 'R$')} {summary.totalEarnings.toFixed(2)}</p>
                <p className="text-xs text-gray-500 mt-1">{getPeriodTitle()}</p>
              </div>
            </div>
          </AnimatedContainer>

          <AnimatedContainer animationType="fadeInUp" delay={300}>
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center">
                  <MdDeliveryDining size={24} className="text-white" />
                </div>
                <div className="flex items-center text-sm text-blue-600">
                  <MdTrendingUp size={16} />
                  <span className="ml-1">+8</span>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">{t('delivery.earnings.total_deliveries')}</p>
                <p className="text-2xl lg:text-3xl font-bold text-gray-900">{summary.totalDeliveries}</p>
                <p className="text-xs text-gray-500 mt-1">{getPeriodTitle()}</p>
              </div>
            </div>
          </AnimatedContainer>

          <AnimatedContainer animationType="fadeInUp" delay={400}>
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center">
                  <MdBarChart size={24} className="text-white" />
                </div>
                <div className="flex items-center text-sm text-purple-600">
                  <MdTrendingUp size={16} />
                  <span className="ml-1">+{t('delivery.dashboard.mock_data.currency_symbol', 'R$')} 2</span>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">{t('delivery.earnings.average_per_delivery')}</p>
                <p className="text-2xl lg:text-3xl font-bold text-gray-900">{t('delivery.dashboard.mock_data.currency_symbol', 'R$')} {summary.averagePerDelivery.toFixed(2)}</p>
                <p className="text-xs text-gray-500 mt-1">{getPeriodTitle()}</p>
              </div>
            </div>
          </AnimatedContainer>

          <AnimatedContainer animationType="fadeInUp" delay={500}>
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-yellow-500 to-yellow-600 flex items-center justify-center">
                  <MdShowChart size={24} className="text-white" />
                </div>
                <div className="flex items-center text-sm text-yellow-600">
                  <MdTrendingUp size={16} />
                  <span className="ml-1">Melhor</span>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">{t('delivery.earnings.best_day')}</p>
                <p className="text-2xl lg:text-3xl font-bold text-gray-900">{t('delivery.dashboard.mock_data.currency_symbol', 'R$')} {summary.bestDay.amount.toFixed(2)}</p>
                <p className="text-xs text-gray-500 mt-1">{formatDate(summary.bestDay.date)}</p>
              </div>
            </div>
          </AnimatedContainer>
        </div>

        {/* Charts Section */}
        <AnimatedContainer animationType="fadeInUp" delay={600}>
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6 lg:mb-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <MdShowChart size={20} className="text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">{t('delivery.earnings.earnings_by_day')}</h2>
            </div>
            
            {filteredData.length > 0 ? (
              <div className="flex items-end space-x-2 lg:space-x-4 h-64 overflow-x-auto">
                {filteredData.map((day, index) => (
                  <div key={index} className="flex flex-col items-center flex-1 min-w-[60px]">
                    <div className="w-full flex justify-center mb-2 relative group">
                      <div 
                        className="w-full max-w-[40px] bg-gradient-to-t from-green-500 to-green-400 rounded-t-lg transition-all duration-500 hover:from-green-600 hover:to-green-500 cursor-pointer" 
                        style={{ height: getBarHeight(day.amount) }}
                      >
                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                          {t('delivery.dashboard.mock_data.currency_symbol', 'R$')} {day.amount.toFixed(2)}
                        </div>
                      </div>
                    </div>
                    <p className="text-xs font-medium text-green-600">{t('delivery.dashboard.mock_data.currency_symbol', 'R$')} {day.amount.toFixed(0)}</p>
                    <p className="text-xs text-gray-500 text-center">{formatDate(day.date)}</p>
                    <p className="text-xs text-gray-400">{day.deliveries} entregas</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <MdBarChart size={48} className="text-gray-300 mb-4" />
                <p>{t('delivery.earnings.no_data_available')}</p>
              </div>
            )}
          </div>
        </AnimatedContainer>

        {/* Payment History */}
        <AnimatedContainer animationType="fadeInUp" delay={700}>
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="flex items-center space-x-3 p-6 border-b border-gray-200">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <MdAttachMoney size={20} className="text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">{t('delivery.earnings.earnings_history')}</h2>
            </div>
            
            {filteredData.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <tr>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        <div className="flex items-center space-x-2">
                          <MdCalendarToday size={16} />
                          <span>{t('delivery.earnings.date')}</span>
                        </div>
                      </th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        <div className="flex items-center space-x-2">
                          <MdDeliveryDining size={16} />
                          <span>{t('delivery.earnings.deliveries')}</span>
                        </div>
                      </th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        <div className="flex items-center space-x-2">
                          <MdAttachMoney size={16} />
                          <span>{t('delivery.earnings.earnings')}</span>
                        </div>
                      </th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        <div className="flex items-center space-x-2">
                          <MdBarChart size={16} />
                          <span>{t('delivery.earnings.average')}</span>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {filteredData.map((day, index) => (
                      <tr key={index} className="hover:bg-gray-50 transition-colors duration-200">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-sm font-medium text-gray-900">
                              {day.date.toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {day.deliveries}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-lg font-bold text-green-600">
                            {t('delivery.dashboard.mock_data.currency_symbol', 'R$')} {day.amount.toFixed(2)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-semibold text-purple-600">
                            {t('delivery.dashboard.mock_data.currency_symbol', 'R$')} {(day.amount / day.deliveries).toFixed(2)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center">
                <MdBarChart size={48} className="text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">{t('delivery.earnings.no_data_available')}</p>
              </div>
            )}
          </div>
        </AnimatedContainer>
      </div>
    </div>
  );
}