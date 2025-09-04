'use client';

import { useState } from 'react';
import AnimatedContainer from '@/components/AnimatedContainer';
import { useTranslation } from 'react-i18next';
import '@/i18n';

type OrderStatus = 'pending' | 'preparing' | 'ready' | 'delivering' | 'delivered' | 'cancelled';

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  customer: {
    name: string;
    address: string;
    phone: string;
  };
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  createdAt: Date;
  deliveryPerson?: string;
}

export default function RestaurantOrders() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<OrderStatus | 'all'>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  
  // Dados simulados de pedidos
  const [orders, setOrders] = useState<Order[]>([
    {
      id: '#1234',
      customer: {
        name: 'João Silva',
        address: 'Rua das Flores, 123 - Jardim Primavera',
        phone: '(11) 98765-4321',
      },
      items: [
        { id: '1', name: 'X-Burger Especial', quantity: 2, price: 29.9 },
        { id: '2', name: 'Batata Frita Grande', quantity: 1, price: 15.9 },
        { id: '3', name: 'Milk Shake de Chocolate', quantity: 2, price: 18.9 },
      ],
      total: 113.5,
      status: 'pending',
      createdAt: new Date(),
    },
    {
      id: '#1233',
      customer: {
        name: 'Maria Oliveira',
        address: 'Av. Principal, 456 - Centro',
        phone: '(11) 91234-5678',
      },
      items: [
        { id: '2', name: 'Batata Frita Grande', quantity: 1, price: 15.9 },
        { id: '4', name: 'Pizza Média Margherita', quantity: 1, price: 45.9 },
      ],
      total: 61.8,
      status: 'preparing',
      createdAt: new Date(Date.now() - 30 * 60000), // 30 minutos atrás
    },
    {
      id: '#1232',
      customer: {
        name: 'Carlos Mendes',
        address: 'Rua dos Pinheiros, 789 - Pinheiros',
        phone: '(11) 97890-1234',
      },
      items: [
        { id: '5', name: 'Combo Família', quantity: 1, price: 89.9 },
        { id: '6', name: 'Refrigerante 2L', quantity: 1, price: 12.9 },
      ],
      total: 102.8,
      status: 'delivered',
      createdAt: new Date(Date.now() - 120 * 60000), // 2 horas atrás
      deliveryPerson: 'Pedro Alves',
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

  const filteredOrders = activeTab === 'all' 
    ? orders 
    : orders.filter(order => order.status === activeTab);

  const getStatusBadgeClass = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'preparing':
        return 'bg-blue-100 text-blue-800';
      case 'ready':
        return 'bg-indigo-100 text-indigo-800';
      case 'delivering':
        return 'bg-purple-100 text-purple-800';
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
      case 'pending':
        return 'Pendente';
      case 'preparing':
        return 'Preparando';
      case 'ready':
        return 'Pronto';
      case 'delivering':
        return 'Em entrega';
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
      case 'pending':
        return 'preparing';
      case 'preparing':
        return 'ready';
      case 'ready':
        return 'delivering';
      case 'delivering':
        return 'delivered';
      default:
        return null;
    }
  };

  return (
    <AnimatedContainer animation="fadeIn" className="h-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Pedidos</h1>
        <p className="text-gray-600">Gerencie os pedidos do seu restaurante</p>
      </div>

      <div className="flex space-x-2 mb-6 overflow-x-auto pb-2">
        <button
          className={`px-4 py-2 rounded-md ${activeTab === 'all' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'}`}
          onClick={() => setActiveTab('all')}
        >
          Todos
        </button>
        <button
          className={`px-4 py-2 rounded-md ${activeTab === 'pending' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'}`}
          onClick={() => setActiveTab('pending')}
        >
          Pendentes
        </button>
        <button
          className={`px-4 py-2 rounded-md ${activeTab === 'preparing' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'}`}
          onClick={() => setActiveTab('preparing')}
        >
          Preparando
        </button>
        <button
          className={`px-4 py-2 rounded-md ${activeTab === 'ready' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'}`}
          onClick={() => setActiveTab('ready')}
        >
          Prontos
        </button>
        <button
          className={`px-4 py-2 rounded-md ${activeTab === 'delivering' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'}`}
          onClick={() => setActiveTab('delivering')}
        >
          Em entrega
        </button>
        <button
          className={`px-4 py-2 rounded-md ${activeTab === 'delivered' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'}`}
          onClick={() => setActiveTab('delivered')}
        >
          Entregues
        </button>
        <button
          className={`px-4 py-2 rounded-md ${activeTab === 'cancelled' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'}`}
          onClick={() => setActiveTab('cancelled')}
        >
          Cancelados
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-2/3">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pedido</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Horário</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.length > 0 ? (
                  filteredOrders.map((order) => (
                    <tr 
                      key={order.id} 
                      className={`hover:bg-gray-50 cursor-pointer ${selectedOrder?.id === order.id ? 'bg-blue-50' : ''}`}
                      onClick={() => setSelectedOrder(order)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.customer.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">R$ {order.total.toFixed(2)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(order.status)}`}>
                          {getStatusText(order.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order.createdAt.toLocaleTimeString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                      Nenhum pedido encontrado
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
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
                <h3 className="font-medium mb-2">Cliente</h3>
                <p className="text-sm">{selectedOrder.customer.name}</p>
                <p className="text-sm text-gray-600">{selectedOrder.customer.phone}</p>
                <p className="text-sm text-gray-600">{selectedOrder.customer.address}</p>
              </div>

              <div className="mb-4">
                <h3 className="font-medium mb-2">Itens do Pedido</h3>
                <ul className="space-y-2">
                  {selectedOrder.items.map((item) => (
                    <li key={item.id} className="flex justify-between text-sm">
                      <span>
                        {item.quantity}x {item.name}
                      </span>
                      <span>R$ {(item.price * item.quantity).toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
                <div className="border-t mt-4 pt-2 flex justify-between font-semibold">
                  <span>Total</span>
                  <span>R$ {selectedOrder.total.toFixed(2)}</span>
                </div>
              </div>

              {selectedOrder.status !== 'delivered' && selectedOrder.status !== 'cancelled' && (
                <div className="mt-6">
                  <div className="flex space-x-2">
                    {getNextStatus(selectedOrder.status) && (
                      <button
                        className="bg-primary text-white px-4 py-2 rounded-md text-sm font-medium flex-1"
                        onClick={() => handleUpdateStatus(selectedOrder.id, getNextStatus(selectedOrder.status)!)}
                      >
                        {selectedOrder.status === 'pending' && 'Iniciar Preparo'}
                        {selectedOrder.status === 'preparing' && 'Marcar como Pronto'}
                        {selectedOrder.status === 'ready' && 'Enviar para Entrega'}
                        {selectedOrder.status === 'delivering' && 'Confirmar Entrega'}
                      </button>
                    )}
                    {selectedOrder.status !== 'cancelled' && (
                      <button
                        className="bg-red-500 text-white px-4 py-2 rounded-md text-sm font-medium"
                        onClick={() => handleUpdateStatus(selectedOrder.id, 'cancelled')}
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
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