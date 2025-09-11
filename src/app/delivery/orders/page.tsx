'use client';

import { useState, useEffect } from 'react';
import AnimatedContainer from '@/components/AnimatedContainer';
import { orderService, Order, OrderStatus } from '@/services/order.service';
import useAuthStore from '@/store/auth.store';
import { toast } from 'react-hot-toast';
import { 
  MdDeliveryDining, 
  MdLocationOn, 
  MdAccessTime,
  MdPhone,
  MdCheckCircle,
  MdCancel,
  MdDirections,
  MdAttachMoney,
  MdRestaurant,
  MdPerson,
  MdFilterList
} from 'react-icons/md';

export default function DeliveryOrders() {
  const [activeTab, setActiveTab] = useState<'current' | 'history'>('current');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();

  useEffect(() => {
    loadAvailableOrders();
    
    // Listener para novos pedidos disponíveis
    const orderCallback = (newOrder: Order) => {
      if (newOrder.status === 'ready' && !newOrder.deliveryDriverId) {
        setOrders(prev => [...prev, newOrder]);
        toast.success(`Novo pedido disponível: ${newOrder.id}`);
      }
    };
    
    orderService.onNewOrder(orderCallback);
    
    return () => orderService.removeOrderListener(orderCallback);
  }, []);

  const loadAvailableOrders = async () => {
    try {
      setLoading(true);
      const allOrders = await orderService.getAllOrders();
      // Filtrar pedidos prontos para entrega ou já atribuídos ao entregador atual
      const availableOrders = allOrders.filter(order => 
        (order.status === 'ready' && !order.deliveryDriverId) ||
        (order.deliveryDriverId === user?.id)
      );
      setOrders(availableOrders);
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
      toast.error('Não foi possível carregar os pedidos');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptOrder = async (orderId: string) => {
    if (!user) return;
    
    try {
      await orderService.assignDriverToOrder(orderId, user.id);
      await orderService.updateOrderStatus(orderId, 'delivering', 'driver');
      await loadAvailableOrders();
      toast.success('Pedido aceito com sucesso!');
    } catch (error) {
      console.error('Erro ao aceitar pedido:', error);
      toast.error('Não foi possível aceitar o pedido');
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await orderService.updateOrderStatus(orderId, newStatus, 'driver');
      await loadAvailableOrders();
      toast.success('Status atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast.error('Não foi possível atualizar o status');
    }
  };

  // Dados carregados via loadAvailableOrders no useEffect principal

  // Função handleUpdateStatus já definida acima com integração ao serviço

  const currentOrders = orders.filter(order => ['ready', 'delivering'].includes(order.status));
  const historyOrders = orders.filter(order => ['delivered', 'cancelled'].includes(order.status));

  const displayOrders = activeTab === 'current' ? currentOrders : historyOrders;

  const getStatusBadgeClass = (status: OrderStatus) => {
    switch (status) {
      case 'ready':
        return 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border-blue-300';
      case 'delivering':
        return 'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 border-yellow-300';
      case 'delivered':
        return 'bg-gradient-to-r from-green-100 to-green-200 text-green-800 border-green-300';
      case 'cancelled':
        return 'bg-gradient-to-r from-red-100 to-red-200 text-red-800 border-red-300';
      default:
        return 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border-gray-300';
    }
  };

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case 'ready':
        return MdAccessTime;
      case 'delivering':
        return MdDeliveryDining;
      case 'delivered':
        return MdCheckCircle;
      case 'cancelled':
        return MdCancel;
      default:
        return MdAccessTime;
    }
  };

  const getStatusText = (status: OrderStatus) => {
    switch (status) {
      case 'ready':
        return 'Pronto para Entrega';
      case 'delivering':
        return 'Em Entrega';
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
      case 'ready':
        return 'delivering';
      case 'delivering':
        return 'delivered';
      default:
        return null;
    }
  };

  const getNextStatusText = (currentStatus: OrderStatus): string => {
    switch (currentStatus) {
      case 'ready':
        return 'Aceitar Entrega';
      case 'delivering':
        return 'Confirmar Entrega';
      default:
        return '';
    }
  };

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
                <h1 className="text-2xl lg:text-3xl font-bold">Pedidos</h1>
                <p className="text-blue-100 mt-1 text-sm lg:text-base hidden sm:block">Gerencie seus pedidos de entrega</p>
              </div>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-blue-100 text-xs lg:text-sm">Total de Pedidos</p>
              <p className="text-white font-bold text-lg lg:text-xl">{orders.length}</p>
            </div>
          </div>
        </div>
      </AnimatedContainer>

      <div className="max-w-7xl mx-auto px-4 lg:px-6 pb-6 lg:pb-8">
        {/* Filter Buttons */}
        <AnimatedContainer animationType="fadeInUp" delay={100}>
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 lg:p-6 mb-6 lg:mb-8">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <MdFilterList size={18} className="text-blue-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Filtrar Pedidos</h2>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 hover:scale-105 flex items-center space-x-2 ${
                  activeTab === 'current' 
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg' 
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
                onClick={() => setActiveTab('current')}
              >
                <span>Pedidos Atuais</span>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  activeTab === 'current' ? 'bg-white/20' : 'bg-gray-200'
                }`}>
                  {currentOrders.length}
                </span>
              </button>
              <button
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 hover:scale-105 flex items-center space-x-2 ${
                  activeTab === 'history' 
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg' 
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
                onClick={() => setActiveTab('history')}
              >
                <span>Histórico</span>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  activeTab === 'history' ? 'bg-white/20' : 'bg-gray-200'
                }`}>
                  {historyOrders.length}
                </span>
              </button>
            </div>
          </div>
        </AnimatedContainer>

        {/* Orders List */}
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="lg:w-2/3">
            {displayOrders.length > 0 ? (
              <div className="space-y-4 lg:space-y-6">
                {displayOrders.map((order, index) => {
                  const StatusIcon = getStatusIcon(order.status);
                  return (
                    <AnimatedContainer key={order.id} animationType="fadeInUp" delay={200 + index * 100}>
                      <div 
                        className={`bg-white rounded-2xl shadow-lg border border-gray-100 p-4 lg:p-6 cursor-pointer hover:shadow-xl transition-all duration-300 ${
                          selectedOrder?.id === order.id ? 'border-2 border-blue-500 shadow-xl' : ''
                        }`}
                        onClick={() => setSelectedOrder(order)}
                      >
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                              <span className="text-white font-bold text-sm">{order.id}</span>
                            </div>
                            <div>
                              <div className="flex items-center space-x-3">
                                <h3 className="text-lg font-bold text-gray-900">{order.id}</h3>
                                <span className={`px-3 py-1 rounded-xl text-xs font-semibold border flex items-center space-x-1 ${getStatusBadgeClass(order.status)}`}>
                                  <StatusIcon size={14} />
                                  <span>{getStatusText(order.status)}</span>
                                </span>
                              </div>
                              <div className="flex items-center space-x-2 mt-2">
                                <MdRestaurant size={16} className="text-gray-400" />
                                <p className="text-sm text-gray-600">Restaurante #{order.restaurantId}</p>
                              </div>
                              <div className="flex items-center space-x-2 mt-1">
                                <MdPerson size={16} className="text-gray-400" />
                                <p className="text-sm text-gray-600">{order.customer.name}</p>
                              </div>
                            </div>
                          </div>
                          <div className="bg-gray-50 rounded-xl p-4 text-center">
                            <div className="flex items-center justify-center space-x-1 mb-1">
                              <MdAttachMoney size={16} className="text-green-600" />
                              <p className="font-bold text-green-600 text-lg">R$ {order.deliveryFee.toFixed(2)}</p>
                            </div>
                            <p className="text-xs text-gray-500 mb-2">Taxa de Entrega</p>
                            <div className="flex items-center justify-center space-x-1">
                              <MdDirections size={14} className="text-gray-400" />
                              <p className="text-sm font-medium text-gray-700">2.5 km</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </AnimatedContainer>
                  );
                })}
              </div>
            ) : (
              <AnimatedContainer animationType="fadeInUp" delay={200}>
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MdDeliveryDining size={32} className="text-gray-400" />
                  </div>
                  <p className="text-gray-500 text-lg font-medium">
                    {activeTab === 'current' ? 'Nenhum pedido atual' : 'Nenhum pedido no histórico'}
                  </p>
                  <p className="text-sm text-gray-400 mt-2">Os pedidos aparecerão aqui quando disponíveis</p>
                </div>
              </AnimatedContainer>
            )}
          </div>

        <div className="lg:w-1/3">
          {selectedOrder ? (
            <AnimatedContainer animationType="fadeIn" className="bg-white rounded-lg shadow p-6">
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
                <p className="text-sm">Restaurante #{selectedOrder.restaurantId}</p>
                <p className="text-sm text-gray-600">Endereço do restaurante</p>
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
                  <p className="font-medium">2.5 km</p>
                </div>
                <div>
                  <p className="text-sm">Tempo Estimado</p>
                  <p className="font-medium">{selectedOrder.estimatedDeliveryTime}</p>
                </div>
                <div>
                  <p className="text-sm">Taxa de Entrega</p>
                  <p className="font-medium">R$ {selectedOrder.deliveryFee.toFixed(2)}</p>
                </div>
              </div>

              {['available', 'accepted', 'picked_up'].includes(selectedOrder.status) && (
                <div className="mt-6">
                  <button
                    className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg flex items-center justify-center space-x-2"
                    onClick={() => handleUpdateStatus(selectedOrder.id, getNextStatus(selectedOrder.status)!)}
                  >
                    <MdCheckCircle size={18} />
                    <span>{getNextStatusText(selectedOrder.status)}</span>
                  </button>
                  
                  {selectedOrder.status !== 'ready' && (
                    <button
                      className="w-full mt-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg flex items-center justify-center space-x-2"
                      onClick={() => handleUpdateStatus(selectedOrder.id, 'cancelled')}
                    >
                      <MdCancel size={18} />
                      <span>Cancelar Entrega</span>
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
      </div>
    </div>
  );
}