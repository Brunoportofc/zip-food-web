'use client';

import { useEffect, useState } from 'react';
import useAuthStore from '@/store/auth.store';
import AnimatedContainer from '@/components/AnimatedContainer';
import { useTranslation } from 'react-i18next';
import '@/i18n';

interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  revenue: number;
}

export default function RestaurantDashboard() {
  const { user } = useAuthStore();
  const { t } = useTranslation();
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    revenue: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulação de carregamento de dados
    const timer = setTimeout(() => {
      // Dados simulados para demonstração
      setStats({
        totalOrders: 156,
        pendingOrders: 8,
        completedOrders: 148,
        revenue: 4350.75,
      });
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const StatCard = ({ title, value, icon }: { title: string; value: string | number; icon: string }) => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-semibold mt-1">{value}</p>
        </div>
        <div className="text-3xl text-primary">{icon}</div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <AnimatedContainer animation="fadeIn" className="h-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-gray-600">Bem-vindo, {user?.name}!</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total de Pedidos"
          value={stats.totalOrders}
          icon="📊"
        />
        <StatCard
          title="Pedidos Pendentes"
          value={stats.pendingOrders}
          icon="⏳"
        />
        <StatCard
          title="Pedidos Concluídos"
          value={stats.completedOrders}
          icon="✅"
        />
        <StatCard
          title="Faturamento"
          value={`R$ ${stats.revenue.toFixed(2)}`}
          icon="💰"
        />
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Pedidos Recentes</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm">#1234</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">João Silva</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">R$ 75,90</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Pendente</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">Hoje, 14:30</td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm">#1233</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">Maria Oliveira</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">R$ 45,50</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-600">Entregue</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">Hoje, 13:15</td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm">#1232</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">Carlos Mendes</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">R$ 128,00</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-600">Entregue</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">Hoje, 12:45</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Itens Mais Vendidos</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gray-200 rounded-md mr-4"></div>
              <div>
                <p className="font-medium">X-Burger Especial</p>
                <p className="text-sm text-gray-500">42 vendidos</p>
              </div>
            </div>
            <p className="font-semibold">R$ 29,90</p>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gray-200 rounded-md mr-4"></div>
              <div>
                <p className="font-medium">Batata Frita Grande</p>
                <p className="text-sm text-gray-500">38 vendidos</p>
              </div>
            </div>
            <p className="font-semibold">R$ 15,90</p>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gray-200 rounded-md mr-4"></div>
              <div>
                <p className="font-medium">Milk Shake de Chocolate</p>
                <p className="text-sm text-gray-500">27 vendidos</p>
              </div>
            </div>
            <p className="font-semibold">R$ 18,90</p>
          </div>
        </div>
      </div>
    </AnimatedContainer>
  );
}