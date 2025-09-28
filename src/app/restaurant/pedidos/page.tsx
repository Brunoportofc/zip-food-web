'use client';

import React, { useState, useEffect } from 'react';
import { 
  MdRefresh, 
  MdFilterList, 
  MdSearch,
  MdCheckCircle,
  MdAccessTime,
  MdLocalShipping,
  MdCancel,
  MdPhone,
  MdLocationOn,
  MdArrowForward,
  MdReceipt,
  MdTimer
} from 'react-icons/md';
import { FaMotorcycle, FaClock, FaEye } from 'react-icons/fa';

// Tipos
interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  observations?: string;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
}

interface DeliveryAddress {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  zipCode: string;
}

interface Order {
  id: string;
  customer: Customer;
  items: OrderItem[];
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'cancelled';
  total: number;
  deliveryFee: number;
  deliveryAddress: DeliveryAddress;
  paymentMethod: string;
  notes?: string;
  estimatedTime: number; // em minutos
  createdAt: Date;
  updatedAt: Date;
}

const OrderManagement = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);

  // Dados simulados - depois conectar com API real
  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/orders', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Transformar dados da API para o formato esperado
        const transformedOrders: Order[] = data.data.map((order: any) => ({
          id: order.id,
          customer: {
            id: order.customer?.id || '',
            name: order.customer?.displayName || 'Cliente',
            phone: order.customer?.phone || 'Não informado',
            email: order.customer?.email || 'Não informado'
          },
          items: order.order_items?.map((item: any) => ({
            id: item.product_id,
            name: item.product_name,
            quantity: item.quantity,
            price: item.unit_price,
            observations: item.notes
          })) || [],
          status: order.status,
          total: order.total,
          deliveryFee: order.delivery_fee,
          deliveryAddress: order.delivery_address,
          paymentMethod: order.payment_method,
          notes: order.notes,
          estimatedTime: 30, // Padrão por enquanto
          createdAt: new Date(order.created_at.seconds * 1000),
          updatedAt: new Date(order.updated_at.seconds * 1000)
        }));
        
        setOrders(transformedOrders);
      } else {
        console.error('Erro ao carregar pedidos:', response.statusText);
        setOrders([]);
      }
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // Status em português
  const statusLabels = {
    pending: 'Aguardando',
    confirmed: 'Confirmado',
    preparing: 'Preparando',
    ready: 'Pronto',
    out_for_delivery: 'Saiu para entrega',
    delivered: 'Entregue',
    cancelled: 'Cancelado'
  };

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    preparing: 'bg-orange-100 text-orange-800',
    ready: 'bg-green-100 text-green-800',
    out_for_delivery: 'bg-purple-100 text-purple-800',
    delivered: 'bg-gray-100 text-gray-800',
    cancelled: 'bg-red-100 text-red-800'
  };

  // Filtrar pedidos
  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Atualizar status do pedido
  const updateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        // Atualizar localmente
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order.id === orderId 
              ? { ...order, status: newStatus, updatedAt: new Date() }
              : order
          )
        );
      } else {
        const error = await response.json();
        alert(error.message || 'Erro ao atualizar status do pedido');
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      alert('Erro ao atualizar status do pedido');
    }
  };

  // Calcular tempo decorrido
  const getElapsedTime = (createdAt: Date) => {
    const elapsed = Date.now() - createdAt.getTime();
    const minutes = Math.floor(elapsed / (1000 * 60));
    return minutes;
  };

  // Ações rápidas por status
  const getStatusActions = (order: Order) => {
    switch (order.status) {
      case 'pending':
        return [
          { label: 'Confirmar', action: () => updateOrderStatus(order.id, 'confirmed'), color: 'bg-blue-500' },
          { label: 'Cancelar', action: () => updateOrderStatus(order.id, 'cancelled'), color: 'bg-red-500' }
        ];
      case 'confirmed':
        return [
          { label: 'Iniciar Preparo', action: () => updateOrderStatus(order.id, 'preparing'), color: 'bg-orange-500' }
        ];
      case 'preparing':
        return [
          { label: 'Marcar Pronto', action: () => updateOrderStatus(order.id, 'ready'), color: 'bg-green-500' }
        ];
      case 'ready':
        return [
          { label: 'Saiu p/ Entrega', action: () => updateOrderStatus(order.id, 'out_for_delivery'), color: 'bg-purple-500' }
        ];
      case 'out_for_delivery':
        return [
          { label: 'Marcar Entregue', action: () => updateOrderStatus(order.id, 'delivered'), color: 'bg-gray-500' }
        ];
      default:
        return [];
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
          <MdReceipt className="mr-3 text-red-500" />
          Gestão de Pedidos
        </h1>
        <p className="text-gray-600">
          Acompanhe e gerencie os pedidos do seu restaurante em tempo real
        </p>
      </div>

      {/* Filtros e Busca */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          {/* Busca */}
          <div className="relative flex-1 max-w-md">
            <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl" />
            <input
              type="text"
              placeholder="Buscar por cliente ou pedido..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900 placeholder-gray-400"
            />
          </div>

          {/* Filtros */}
          <div className="flex gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 text-gray-900 bg-white"
            >
              <option value="all">Todos os status</option>
              <option value="pending">Aguardando</option>
              <option value="confirmed">Confirmado</option>
              <option value="preparing">Preparando</option>
              <option value="ready">Pronto</option>
              <option value="out_for_delivery">Saiu para entrega</option>
              <option value="delivered">Entregue</option>
              <option value="cancelled">Cancelado</option>
            </select>

            <button
              onClick={loadOrders}
              className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
            >
              <MdRefresh className="text-xl" />
              Atualizar
            </button>
          </div>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Total de Pedidos</h3>
          <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Aguardando</h3>
          <p className="text-2xl font-bold text-yellow-600">{orders.filter(o => o.status === 'pending').length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Em Preparo</h3>
          <p className="text-2xl font-bold text-orange-600">{orders.filter(o => o.status === 'preparing').length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Valor Total</h3>
          <p className="text-2xl font-bold text-green-600">
            R$ {orders.reduce((sum, order) => sum + order.total, 0).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Lista de Pedidos */}
      <div className="space-y-4">
        {filteredOrders.map(order => {
          const elapsedTime = getElapsedTime(order.createdAt);
          const actions = getStatusActions(order);

          return (
            <div key={order.id} className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Informações Principais */}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Pedido #{order.id}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[order.status]}`}>
                        {statusLabels[order.status]}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <MdTimer />
                      {elapsedTime}min atrás
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {/* Cliente */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Cliente</h4>
                      <p className="text-gray-700">{order.customer.name}</p>
                      <p className="text-gray-500 text-sm flex items-center gap-1">
                        <MdPhone className="text-xs" />
                        {order.customer.phone}
                      </p>
                    </div>

                    {/* Entrega */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Endereço</h4>
                      <p className="text-gray-700 text-sm flex items-center gap-1">
                        <MdLocationOn className="text-xs" />
                        {order.deliveryAddress.street}, {order.deliveryAddress.number}
                      </p>
                      <p className="text-gray-500 text-sm">
                        {order.deliveryAddress.neighborhood} - {order.deliveryAddress.city}
                      </p>
                    </div>
                  </div>

                  {/* Itens do Pedido */}
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-900 mb-2">Itens</h4>
                    <div className="space-y-2">
                      {order.items.map(item => (
                        <div key={item.id} className="flex justify-between items-center text-sm">
                          <span className="text-gray-700">
                            {item.quantity}x {item.name}
                          </span>
                          <span className="font-medium text-gray-900">
                            R$ {(item.quantity * item.price).toFixed(2)}
                          </span>
                        </div>
                      ))}
                      {order.deliveryFee > 0 && (
                        <div className="flex justify-between items-center text-sm border-t pt-2">
                          <span className="text-gray-700">Taxa de entrega</span>
                          <span className="font-medium text-gray-900">
                            R$ {order.deliveryFee.toFixed(2)}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between items-center font-semibold border-t pt-2">
                        <span>Total</span>
                        <span className="text-red-600">R$ {order.total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Observações */}
                  {order.notes && (
                    <div className="mb-4">
                      <h4 className="font-medium text-gray-900 mb-2">Observações</h4>
                      <p className="text-gray-700 text-sm bg-gray-50 p-3 rounded-lg">
                        {order.notes}
                      </p>
                    </div>
                  )}
                </div>

                {/* Ações */}
                <div className="lg:w-64">
                  <div className="space-y-3">
                    {actions.map((action, index) => (
                      <button
                        key={index}
                        onClick={action.action}
                        className={`w-full px-4 py-3 ${action.color} text-white rounded-lg hover:opacity-90 transition-opacity font-medium`}
                      >
                        {action.label}
                      </button>
                    ))}
                    
                    <button
                      onClick={() => {
                        setSelectedOrder(order);
                        setShowOrderModal(true);
                      }}
                      className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center justify-center gap-2"
                    >
                      <FaEye />
                      Ver Detalhes
                    </button>

                    {/* Tempo Estimado */}
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Tempo Estimado</p>
                      <p className="font-semibold text-gray-900 flex items-center justify-center gap-1">
                        <FaClock className="text-xs" />
                        {order.estimatedTime}min
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {filteredOrders.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <MdReceipt className="text-gray-300 text-6xl mb-4 mx-auto" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhum pedido encontrado</h3>
            <p className="text-gray-600">
              {orders.length === 0 
                ? 'Ainda não há pedidos para exibir' 
                : 'Tente ajustar os filtros de busca'
              }
            </p>
          </div>
        )}
      </div>

      {/* Modal de Detalhes do Pedido */}
      {showOrderModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Detalhes do Pedido #{selectedOrder.id}
              </h2>
            </div>

            <div className="p-6">
              {/* Conteúdo detalhado do pedido aqui */}
              <div className="space-y-6">
                {/* Status e Tempo */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${statusColors[selectedOrder.status]}`}>
                      {statusLabels[selectedOrder.status]}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tempo Decorrido</label>
                    <p className="text-gray-900">{getElapsedTime(selectedOrder.createdAt)} minutos</p>
                  </div>
                </div>

                {/* Detalhes completos aqui... */}
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setShowOrderModal(false)}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderManagement;
