'use client';

import { useState } from 'react';
import AnimatedContainer from '@/components/AnimatedContainer';
import { useTranslation } from 'react-i18next';
import '@/i18n';

type OrderStatus = 'available' | 'accepted' | 'picked_up' | 'delivered' | 'cancelled';

interface DeliveryOrder {
  id: string;
  restaurant: {
    name: string;
    address: string;
  };
  customer: {
    name: string;
    address: string;
    phone: string;
  };
  items: Array<{
    name: string;
    quantity: number;
  }>;
  total: number;
  deliveryFee: number;
  status: OrderStatus;
  distance: number;
  estimatedTime: number;
  createdAt: Date;
}

export default function DeliveryOrders() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'current' | 'history'>('current');
  const [selectedOrder, setSelectedOrder] = useState<DeliveryOrder | null>(null);
  
  // Dados simulados de pedidos
  const [orders, setOrders] = useState<DeliveryOrder[]>([
    {
      id: '#5678',
      restaurant: {
        name: 'Burger King',
        address: 'Av. Paulista, 1000 - Bela Vista',
      },
      customer: {
        name: 'João Silva',
        address: 'Rua das Flores, 123 - Jardim Primavera',
        phone: '(11) 98765-4321',
      },
      items: [
        { name: 'Whopper', quantity: 2 },
        { name: 'Batata Grande', quantity: 1 },
        { name: 'Refrigerante 500ml', quantity: 2 },
      ],
      total: 89.70,
      deliveryFee: 8.90,
      status: 'accepted',
      distance: 3.2,
      estimatedTime: 25,
      createdAt: new Date(),
    },
    {
      id: '#5677',
      restaurant: {
        name: 'Pizza Hut',
        address: 'Rua Augusta, 500 - Consolação',
      },
      customer: {
        name: 'Maria Oliveira',
        address: 'Av. Principal, 456 - Centro',
        phone: '(11) 91234-5678',
      },
      items: [
        { name: 'Pizza Grande Calabresa', quantity: 1 },
        { name: 'Refrigerante 2L', quantity: 1 },
      ],
      total: 79.90,
      deliveryFee: 7.50,
      status: 'available',
      distance: 2.5,
      estimatedTime: 20,
      createdAt: new Date(),
    },
    {
      id: '#5676',
      restaurant: {
        name: 'McDonalds',
        address: 'Av. Brigadeiro Faria Lima, 1500 - Pinheiros',
      },
      customer: {
        name: 'Carlos Mendes',
        address: 'Rua dos Pinheiros, 789 - Pinheiros',
        phone: '(11) 97890-1234',
      },
      items: [
        { name: 'Big Mac', quantity: 2 },
        { name: 'McFritas Média', quantity: 2 },
        { name: 'Coca-Cola 500ml', quantity: 2 },
      ],
      total: 65.80,
      deliveryFee: 6.90,
      status: 'delivered',
      distance: 1.8,
      estimatedTime: 15,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 horas atrás
    },
  ]);

  const handleUpdateStatus = (orderId: string, newStatus: OrderStatus) => {
    setOrders(
      orders.map((order) =>
        order.id === orderId ? { ...order, status: newStatus } : order
      )
    );
    
    if (selectedOrder?.id === orderId) {
      setSelectedOrder({ ...selectedOrder, status: newStatus });
    }
  };

  const currentOrders = orders.filter(order => ['available', 'accepted', 'picked_up'].includes(order.status));
  const historyOrders = orders.filter(order => ['delivered', 'cancelled'].includes(order.status));

  const displayOrders = activeTab === 'current' ? currentOrders : historyOrders;

  const getStatusBadgeClass = (status: OrderStatus) => {
    switch (status) {
      case 'available':
        return 'bg-blue-100 text-blue-800';
      case 'accepted':
        return 'bg-yellow-100 text-yellow-800';
      case 'picked_up':
        return 'bg-indigo-100 text-indigo-800';
      case 'delivered':
        return 'bg-red-100 text-red-600';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: OrderStatus) => {
    switch (status) {
      case 'available':
        return 'Disponível';
      case 'accepted':
        return 'Aceito';
      case 'picked_up':
        return 'Retirado';
      case 'delivered':
        return 'Entregue';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status;
    }
  };

  const getNextStatus = (currentStatus: OrderStatus): OrderStatus | null => {
    switch (currentStatus) {
      case 'available':
        return 'accepted';
      case 'accepted':
        return 'picked_up';
      case 'picked_up':
        return 'delivered';
      default:
        return null;
    }
  };

  const getNextStatusText = (currentStatus: OrderStatus): string => {
    switch (currentStatus) {
      case 'available':
        return 'Aceitar Pedido';
      case 'accepted':
        return 'Confirmar Retirada';
      case 'picked_up':
        return 'Confirmar Entrega';
      default:
        return '';
    }
  };

  return (
    <AnimatedContainer animation="fadeIn" className="h-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Pedidos</h1>
        <p className="text-gray-600">Gerencie suas entregas</p>
      </div>

      <div className="flex space-x-2 mb-6">
        <button
          className={`px-4 py-2 rounded-md ${activeTab === 'current' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'}`}
          onClick={() => setActiveTab('current')}
        >
          Pedidos Atuais
        </button>
        <button
          className={`px-4 py-2 rounded-md ${activeTab === 'history' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'}`}
          onClick={() => setActiveTab('history')}
        >
          Histórico
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-2/3">
          {displayOrders.length > 0 ? (
            <div className="space-y-4">
              {displayOrders.map((order) => (
                <div 
                  key={order.id} 
                  className={`bg-white rounded-lg shadow p-4 cursor-pointer hover:bg-gray-50 ${selectedOrder?.id === order.id ? 'border-2 border-primary' : ''}`}
                  onClick={() => setSelectedOrder(order)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center">
                        <h3 className="font-medium">{order.id}</h3>
                        <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(order.status)}`}>
                          {getStatusText(order.status)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">Restaurante: {order.restaurant.name}</p>
                      <p className="text-sm text-gray-600">Cliente: {order.customer.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">R$ {order.deliveryFee.toFixed(2)}</p>
                      <p className="text-xs text-gray-500">Taxa de entrega</p>
                      <p className="text-sm mt-1">{order.distance.toFixed(1)} km</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-gray-500">
                {activeTab === 'current' ? 'Nenhum pedido disponível no momento' : 'Nenhum pedido no histórico'}
              </p>
            </div>
          )}
        </div>

        <div className="lg:w-1/3">
          {selectedOrder ? (
            <AnimatedContainer animation="fadeIn" className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-lg font-semibold">{selectedOrder.id}</h2>
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(selectedOrder.status)}`}>
                    {getStatusText(selectedOrder.status)}
                  </span>
                </div>
                <p className="text-sm text-gray-500">
                  {selectedOrder.createdAt.toLocaleTimeString()} - {selectedOrder.createdAt.toLocaleDateString()}
                </p>
              </div>

              <div className="border-t border-b py-4 my-4">
                <h3 className="font-medium mb-2">Restaurante</h3>
                <p className="text-sm">{selectedOrder.restaurant.name}</p>
                <p className="text-sm text-gray-600">{selectedOrder.restaurant.address}</p>
              </div>

              <div className="border-b py-4 mb-4">
                <h3 className="font-medium mb-2">Cliente</h3>
                <p className="text-sm">{selectedOrder.customer.name}</p>
                <p className="text-sm text-gray-600">{selectedOrder.customer.phone}</p>
                <p className="text-sm text-gray-600">{selectedOrder.customer.address}</p>
              </div>

              <div className="mb-4">
                <h3 className="font-medium mb-2">Itens do Pedido</h3>
                <ul className="space-y-2">
                  {selectedOrder.items.map((item, index) => (
                    <li key={index} className="text-sm">
                      {item.quantity}x {item.name}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex justify-between items-center mb-4">
                <div>
                  <p className="text-sm">Distância</p>
                  <p className="font-medium">{selectedOrder.distance.toFixed(1)} km</p>
                </div>
                <div>
                  <p className="text-sm">Tempo estimado</p>
                  <p className="font-medium">{selectedOrder.estimatedTime} min</p>
                </div>
                <div>
                  <p className="text-sm">Taxa de entrega</p>
                  <p className="font-medium">R$ {selectedOrder.deliveryFee.toFixed(2)}</p>
                </div>
              </div>

              {['available', 'accepted', 'picked_up'].includes(selectedOrder.status) && (
                <div className="mt-6">
                  <button
                    className="w-full bg-primary text-white py-3 rounded-md font-medium"
                    onClick={() => handleUpdateStatus(selectedOrder.id, getNextStatus(selectedOrder.status)!)}
                  >
                    {getNextStatusText(selectedOrder.status)}
                  </button>
                  
                  {selectedOrder.status !== 'available' && (
                    <button
                      className="w-full mt-2 border border-red-500 text-red-500 py-2 rounded-md font-medium"
                      onClick={() => handleUpdateStatus(selectedOrder.id, 'cancelled')}
                    >
                      Cancelar Entrega
                    </button>
                  )}
                </div>
              )}
            </AnimatedContainer>
          ) : (
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <p className="text-gray-500">Selecione um pedido para ver os detalhes</p>
            </div>
          )}
        </div>
      </div>
    </AnimatedContainer>
  );
}