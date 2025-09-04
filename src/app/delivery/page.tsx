'use client';

import { useEffect, useState } from 'react';
import useAuthStore from '@/store/auth.store';
import AnimatedContainer from '@/components/AnimatedContainer';
import { useTranslation } from 'react-i18next';
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
        totalDeliveries: 128,
        availableOrders: 5,
        completedToday: 8,
        earnings: 320.50,
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

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Status</h2>
            <p className="text-gray-600">Você está {stats.status === 'online' ? 'online' : 'offline'}</p>
          </div>
          <button
            onClick={toggleStatus}
            className={`px-6 py-2 rounded-full font-medium ${stats.status === 'online' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}
          >
            {stats.status === 'online' ? 'Ficar Offline' : 'Ficar Online'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total de Entregas"
          value={stats.totalDeliveries}
          icon="🚚"
        />
        <StatCard
          title="Pedidos Disponíveis"
          value={stats.availableOrders}
          icon="📦"
        />
        <StatCard
          title="Entregas Hoje"
          value={stats.completedToday}
          icon="✅"
        />
        <StatCard
          title="Ganhos"
          value={`R$ ${stats.earnings.toFixed(2)}`}
          icon="💰"
        />
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Pedidos Disponíveis</h2>
        {stats.availableOrders > 0 ? (
          <div className="space-y-4">
            {Array.from({ length: stats.availableOrders }).map((_, index) => (
              <div key={index} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">Pedido #{1000 + index}</h3>
                    <p className="text-sm text-gray-600 mt-1">Restaurante: {['Burger King', 'McDonalds', 'Pizza Hut', 'Subway', 'KFC'][index % 5]}</p>
                    <p className="text-sm text-gray-600">Distância: {(2 + index * 0.5).toFixed(1)} km</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">R$ {(15 + index * 2).toFixed(2)}</p>
                    <p className="text-xs text-gray-500">Estimativa de ganho</p>
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <button className="bg-primary text-white px-4 py-2 rounded-md text-sm font-medium">
                    Aceitar Entrega
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">Nenhum pedido disponível no momento</p>
            <p className="text-sm text-gray-400 mt-2">Fique online para receber novos pedidos</p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Resumo da Semana</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Total de Entregas</p>
            <p className="text-xl font-semibold">32</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Ganhos da Semana</p>
            <p className="text-xl font-semibold">R$ 640,00</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Média por Entrega</p>
            <p className="text-xl font-semibold">R$ 20,00</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Horas Online</p>
            <p className="text-xl font-semibold">24h</p>
          </div>
        </div>
      </div>
    </AnimatedContainer>
  );
}