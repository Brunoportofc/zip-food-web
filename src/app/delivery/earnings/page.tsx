'use client';

import { useState } from 'react';
import AnimatedContainer from '@/components/AnimatedContainer';
import { useTranslation } from 'react-i18next';
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
      case 'day':
        return 'Hoje';
      case 'week':
        return 'Esta Semana';
      case 'month':
        return 'Este Mês';
      default:
        return '';
    }
  };

  return (
    <AnimatedContainer animation="fadeIn" className="h-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Meus Ganhos</h1>
        <p className="text-gray-600">Acompanhe seus ganhos com entregas</p>
      </div>

      <div className="flex space-x-2 mb-6">
        <button
          className={`px-4 py-2 rounded-md ${activePeriod === 'day' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'}`}
          onClick={() => setActivePeriod('day')}
        >
          Hoje
        </button>
        <button
          className={`px-4 py-2 rounded-md ${activePeriod === 'week' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'}`}
          onClick={() => setActivePeriod('week')}
        >
          Semana
        </button>
        <button
          className={`px-4 py-2 rounded-md ${activePeriod === 'month' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'}`}
          onClick={() => setActivePeriod('month')}
        >
          Mês
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Total de Ganhos</p>
          <p className="text-2xl font-bold">R$ {summary.totalEarnings.toFixed(2)}</p>
          <p className="text-xs text-gray-500">{getPeriodTitle()}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Total de Entregas</p>
          <p className="text-2xl font-bold">{summary.totalDeliveries}</p>
          <p className="text-xs text-gray-500">{getPeriodTitle()}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Média por Entrega</p>
          <p className="text-2xl font-bold">R$ {summary.averagePerDelivery.toFixed(2)}</p>
          <p className="text-xs text-gray-500">{getPeriodTitle()}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Melhor Dia</p>
          <p className="text-2xl font-bold">R$ {summary.bestDay.amount.toFixed(2)}</p>
          <p className="text-xs text-gray-500">{formatDate(summary.bestDay.date)}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Ganhos por Dia</h2>
        
        {filteredData.length > 0 ? (
          <div className="flex items-end space-x-4 h-64">
            {filteredData.map((day, index) => (
              <div key={index} className="flex flex-col items-center flex-1">
                <div className="w-full flex justify-center mb-2">
                  <div 
                    className="w-full max-w-[40px] bg-primary rounded-t-md" 
                    style={{ height: getBarHeight(day.amount) }}
                  ></div>
                </div>
                <p className="text-xs font-medium">R$ {day.amount.toFixed(0)}</p>
                <p className="text-xs text-gray-500">{formatDate(day.date)}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-64 text-gray-500">
            Nenhum dado disponível para o período selecionado
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <h2 className="text-lg font-semibold p-4 border-b">Histórico de Ganhos</h2>
        
        {filteredData.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Entregas
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ganhos
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Média
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredData.map((day, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {day.date.toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {day.deliveries}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      R$ {day.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      R$ {(day.amount / day.deliveries).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 text-center text-gray-500">
            Nenhum dado disponível para o período selecionado
          </div>
        )}
      </div>
    </AnimatedContainer>
  );
}