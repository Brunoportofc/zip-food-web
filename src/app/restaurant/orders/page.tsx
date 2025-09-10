'use client';

import { useState, useEffect } from 'react';

import AnimatedContainer from '@/components/AnimatedContainer';
import { toast } from 'react-hot-toast';
import { showSuccessAlert, showConfirmAlert } from '@/components/AlertSystem';
import useRealTimeNotifications from '@/hooks/useRealTimeNotifications';
import { 
  MdShoppingCart, 
  MdPerson, 
  MdLocationOn, 
  MdPhone, 
  MdAccessTime, 
  MdPlayArrow, 
  MdCheck, 
  MdCancel,
  MdRefresh,
  MdFilterList,
  MdSearch,
  MdTrendingUp,
  MdRestaurant,
  MdDeliveryDining
} from 'react-icons/md';

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
}

export default function RestaurantOrders() {

  const [activeTab, setActiveTab] = useState<OrderStatus | 'all'>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const { notifyOrderStatusChange } = useRealTimeNotifications();
  
  const [orders, setOrders] = useState<Order[]>([]);

  // Initialize orders after translations are ready
  useEffect(() => {
    const initialOrders: Order[] = [
      {
        id: '#1234',
        customer: {
          name: 'João Ferreira',
          address: 'Rua das Flores, 123',
          phone: '(11) 98765-4321',
        },
        items: [
          { id: '1', name: 'Big Burger', quantity: 2, price: 29.9 },
          { id: '2', name: 'Batata Frita', quantity: 1, price: 15.9 },
        ],
        total: 75.7,
        status: 'pending',
        createdAt: new Date(),
      },
      {
        id: '#1233',
        customer: {
          name: 'Maria Oliveira',
          address: 'Av. Paulista, 456',
          phone: '(11) 91234-5678',
        },
        items: [
            { id: '3', name: 'Chicken Burger', quantity: 1, price: 45.9 },
          ],
         total: 45.9,
         status: 'preparing',
         createdAt: new Date(Date.now() - 30 * 60000),
       },
     ];
     setOrders(initialOrders);
   }, []);

  useEffect(() => {
    if (!isAutoRefresh) return;

    const interval = setInterval(() => {
      if (Math.random() < 0.1) {
        const newOrder: Order = {
          id: `#${Math.floor(Math.random() * 9000) + 1000}`,
          customer: {
            name: `Cliente ${Math.floor(Math.random() * 100)}`,
            address: `Endereço ${Math.floor(Math.random() * 100)}`,
            phone: '(11) 99999-9999',
          },
          items: [
            {
              id: Math.random().toString(),
              name: 'Produto Exemplo',
              quantity: 1,
              price: 25.0,
            },
          ],
          total: 25.0,
          status: 'pending',
          createdAt: new Date(),
        };
        setOrders(prev => [newOrder, ...prev]);
        toast.success(`Novo pedido: ${newOrder.id}`);
      }
      setLastUpdate(new Date());
    }, 30000);

    return () => clearInterval(interval);
  }, [isAutoRefresh]);

  const handleUpdateStatus = (orderId: string, newStatus: OrderStatus) => {
    setOrders(
      orders.map((order) =>
        order.id === orderId ? { ...order, status: newStatus } : order
      )
    );
    
    if (selectedOrder?.id === orderId) {
      setSelectedOrder({ ...selectedOrder, status: newStatus });
    }

    const statusMessages: Record<string, string> = {
      pending: 'Pedido recebido',
      preparing: 'Preparando pedido',
      ready: 'Pedido pronto',
      delivering: 'Saiu para entrega',
      delivered: 'Pedido entregue',
      cancelled: 'Pedido cancelado'
    };

    if (statusMessages[newStatus]) {
      toast.success(`${statusMessages[newStatus]}: ${orderId}`);
      notifyOrderStatusChange(orderId, newStatus);
    }
  };

  const handleCancelOrder = (orderId: string) => {
    showConfirmAlert(
      'Cancelar Pedido',
      `Tem certeza que deseja cancelar o pedido ${orderId}?`,
      () => {
        setOrders(prev => prev.filter(order => order.id !== orderId));
        setSelectedOrder(null);
        showSuccessAlert('Pedido Cancelado', `O pedido ${orderId} foi cancelado com sucesso.`);
        notifyOrderStatusChange(orderId, 'cancelled');
      },
      () => {}
    );
  };

  const handleRefresh = () => {
    setLastUpdate(new Date());
    toast.success('Pedidos atualizados');
  };

  const filteredOrders = orders
    .filter(order => {
      const matchesTab = activeTab === 'all' || order.status === activeTab;
      const matchesSearch = searchTerm === '' || 
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesTab && matchesSearch;
    })
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const getOrderStats = () => {
    return {
      total: orders.length,
      pending: orders.filter(o => o.status === 'pending').length,
      preparing: orders.filter(o => o.status === 'preparing').length,
      ready: orders.filter(o => o.status === 'ready').length,
      delivering: orders.filter(o => o.status === 'delivering').length,
      delivered: orders.filter(o => o.status === 'delivered').length,
      cancelled: orders.filter(o => o.status === 'cancelled').length,
    };
  };

  const stats = getOrderStats();

  const getStatusBadgeClass = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      case 'preparing':
        return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'ready':
        return 'bg-green-100 text-green-800 border border-green-200';
      case 'delivering':
        return 'bg-purple-100 text-purple-800 border border-purple-200';
      case 'delivered':
        return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  const getStatusText = (status: OrderStatus) => {
    switch (status) {
      case 'pending': return 'Pendente';
      case 'preparing': return 'Preparando';
      case 'ready': return 'Pronto';
      case 'delivering': return 'Em entrega';
      case 'delivered': return 'Entregue';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case 'pending': return <MdAccessTime className="w-4 h-4" />;
      case 'preparing': return <MdRestaurant className="w-4 h-4" />;
      case 'ready': return <MdCheck className="w-4 h-4" />;
      case 'delivering': return <MdDeliveryDining className="w-4 h-4" />;
      case 'delivered': return <MdCheck className="w-4 h-4" />;
      case 'cancelled': return <MdCancel className="w-4 h-4" />;
      default: return <MdShoppingCart className="w-4 h-4" />;
    }
  };

  const getNextStatus = (currentStatus: OrderStatus): OrderStatus | null => {
    switch (currentStatus) {
      case 'pending': return 'preparing';
      case 'preparing': return 'ready';
      case 'ready': return 'delivering';
      case 'delivering': return 'delivered';
      default: return null;
    }
  };

  return (
    <AnimatedContainer animationType="fadeIn" delay={100}>
      <AnimatedContainer animationType="fadeInDown" delay={200}>
        <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-2xl shadow-lg p-6 lg:p-8 text-white mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="mb-4 lg:mb-0">
              <h1 className="text-2xl lg:text-3xl font-bold flex items-center space-x-3 mb-2">
                <MdShoppingCart size={32} />
                <span>Pedidos</span>
              </h1>
              <p className="text-red-100">Gerencie todos os pedidos do seu restaurante</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-red-100">Última atualização</p>
                <p className="font-semibold">{lastUpdate.toLocaleTimeString()}</p>
              </div>
              <button
                onClick={handleRefresh}
                className="p-3 bg-white bg-opacity-20 rounded-xl hover:bg-white hover:bg-opacity-30 transition-colors"
              >
                <MdRefresh size={20} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-7 gap-4 mt-6">
            <div className="bg-white bg-opacity-10 rounded-xl p-4 backdrop-blur-sm">
              <div className="flex items-center space-x-2 mb-2">
                <MdTrendingUp className="text-white" size={20} />
                <span className="text-sm font-medium">Total</span>
              </div>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <div className="bg-yellow-500 bg-opacity-20 rounded-xl p-4 backdrop-blur-sm">
              <div className="flex items-center space-x-2 mb-2">
                <MdAccessTime className="text-yellow-200" size={20} />
                <span className="text-sm font-medium">Pendentes</span>
              </div>
              <p className="text-2xl font-bold">{stats.pending}</p>
            </div>
            <div className="bg-blue-500 bg-opacity-20 rounded-xl p-4 backdrop-blur-sm">
              <div className="flex items-center space-x-2 mb-2">
                <MdRestaurant className="text-blue-200" size={20} />
                <span className="text-sm font-medium">Preparando</span>
              </div>
              <p className="text-2xl font-bold">{stats.preparing}</p>
            </div>
            <div className="bg-green-500 bg-opacity-20 rounded-xl p-4 backdrop-blur-sm">
              <div className="flex items-center space-x-2 mb-2">
                <MdCheck className="text-green-200" size={20} />
                <span className="text-sm font-medium">Prontos</span>
              </div>
              <p className="text-2xl font-bold">{stats.ready}</p>
            </div>
            <div className="bg-purple-500 bg-opacity-20 rounded-xl p-4 backdrop-blur-sm">
              <div className="flex items-center space-x-2 mb-2">
                <MdDeliveryDining className="text-purple-200" size={20} />
                <span className="text-sm font-medium">Em entrega</span>
              </div>
              <p className="text-2xl font-bold">{stats.delivering}</p>
            </div>
            <div className="bg-emerald-500 bg-opacity-20 rounded-xl p-4 backdrop-blur-sm">
              <div className="flex items-center space-x-2 mb-2">
                <MdCheck className="text-emerald-200" size={20} />
                <span className="text-sm font-medium">Entregues</span>
              </div>
              <p className="text-2xl font-bold">{stats.delivered}</p>
            </div>
            <div className="bg-red-500 bg-opacity-20 rounded-xl p-4 backdrop-blur-sm">
              <div className="flex items-center space-x-2 mb-2">
                <MdCancel className="text-red-200" size={20} />
                <span className="text-sm font-medium">Cancelados</span>
              </div>
              <p className="text-2xl font-bold">{stats.cancelled}</p>
            </div>
          </div>
        </div>
      </AnimatedContainer>

      <AnimatedContainer animationType="fadeInUp" delay={250}>
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 lg:p-6 mb-6">
          <div className="flex flex-col space-y-4">
            <div className="w-full">
              <div className="relative">
                <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Buscar por ID ou nome do cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MdFilterList className="text-gray-500" size={20} />
                <span className="text-sm font-medium text-gray-700">Filtros:</span>
              </div>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAutoRefresh}
                  onChange={(e) => setIsAutoRefresh(e.target.checked)}
                  className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
                <span>Atualização automática</span>
              </label>
            </div>
          </div>
        </div>
      </AnimatedContainer>

      <AnimatedContainer animationType="fadeInUp" delay={300}>
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 lg:p-6 mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-xl font-medium transition-all flex items-center space-x-2 ${
                activeTab === 'all'
                  ? 'bg-red-500 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <MdTrendingUp size={18} />
              <span>Todos ({stats.total})</span>
            </button>
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-4 py-2 rounded-xl font-medium transition-all flex items-center space-x-2 ${
                activeTab === 'pending'
                  ? 'bg-yellow-500 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <MdAccessTime size={18} />
              <span>Pendentes ({stats.pending})</span>
            </button>
            <button
              onClick={() => setActiveTab('preparing')}
              className={`px-4 py-2 rounded-xl font-medium transition-all flex items-center space-x-2 ${
                activeTab === 'preparing'
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <MdRestaurant size={18} />
              <span>Preparando ({stats.preparing})</span>
            </button>
            <button
              onClick={() => setActiveTab('ready')}
              className={`px-4 py-2 rounded-xl font-medium transition-all flex items-center space-x-2 ${
                activeTab === 'ready'
                  ? 'bg-green-500 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <MdCheck size={18} />
              <span>Prontos ({stats.ready})</span>
            </button>
            <button
              onClick={() => setActiveTab('delivering')}
              className={`px-4 py-2 rounded-xl font-medium transition-all flex items-center space-x-2 ${
                activeTab === 'delivering'
                  ? 'bg-purple-500 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <MdDeliveryDining size={18} />
              <span>Em entrega ({stats.delivering})</span>
            </button>
            <button
              onClick={() => setActiveTab('delivered')}
              className={`px-4 py-2 rounded-xl font-medium transition-all flex items-center space-x-2 ${
                activeTab === 'delivered'
                  ? 'bg-emerald-500 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <MdCheck size={18} />
              <span>Entregues ({stats.delivered})</span>
            </button>
            <button
              onClick={() => setActiveTab('cancelled')}
              className={`px-4 py-2 rounded-xl font-medium transition-all flex items-center space-x-2 ${
                activeTab === 'cancelled'
                  ? 'bg-red-500 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <MdCancel size={18} />
              <span>Cancelados ({stats.cancelled})</span>
            </button>
          </div>
        </div>
      </AnimatedContainer>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-2/3">
          <AnimatedContainer animationType="fadeInUp" delay={300}>
            <div className="space-y-4">
              {filteredOrders.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
                  <MdShoppingCart size={64} className="mx-auto text-gray-300 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">Nenhum pedido encontrado</h3>
                  <p className="text-gray-500">
                    {activeTab === 'all' 
                      ? 'Não há pedidos no momento' 
                      : `Não há pedidos com status ${getStatusText(activeTab as OrderStatus)}`
                    }
                  </p>
                </div>
              ) : (
                filteredOrders.map((order) => (
                  <div 
                    key={order.id} 
                    className={`bg-white rounded-2xl shadow-lg border border-gray-100 p-4 lg:p-6 hover:shadow-xl transition-all duration-300 cursor-pointer ${
                      selectedOrder?.id === order.id ? 'ring-2 ring-red-500 bg-red-50' : ''
                    }`}
                    onClick={() => setSelectedOrder(order)}
                  >
                    <div className="flex flex-col space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-r from-red-500 to-red-600 rounded-xl flex items-center justify-center text-white font-bold text-xs lg:text-sm">
                              {order.id}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-base lg:text-lg font-semibold text-gray-900 flex items-center space-x-2">
                              <MdPerson size={16} className="text-gray-500 lg:w-5 lg:h-5" />
                              <span className="truncate">{order.customer.name}</span>
                            </h3>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-lg lg:text-xl font-bold text-gray-900">R$ {order.total.toFixed(2)}</div>
                          <div className="text-xs lg:text-sm text-gray-500">{order.items.length} {order.items.length === 1 ? 'item' : 'itens'}</div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                        <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 text-xs lg:text-sm text-gray-500">
                          <span className="flex items-center space-x-1">
                            <MdLocationOn size={14} className="lg:w-4 lg:h-4" />
                            <span className="truncate">{order.customer.address}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <MdAccessTime size={14} className="lg:w-4 lg:h-4" />
                            <span>{order.createdAt.toLocaleTimeString()}</span>
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <span className={`px-3 py-1.5 text-xs lg:text-sm font-semibold rounded-lg flex items-center space-x-1 ${getStatusBadgeClass(order.status)}`}>
                            {getStatusIcon(order.status)}
                            <span>{getStatusText(order.status)}</span>
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                        {order.status !== 'delivered' && order.status !== 'cancelled' && getNextStatus(order.status) && (
                          <button
                            className="bg-green-100 text-green-700 px-3 lg:px-4 py-2 rounded-xl font-medium hover:bg-green-200 transition-all flex items-center justify-center space-x-2 text-sm lg:text-base"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUpdateStatus(order.id, getNextStatus(order.status)!);
                            }}
                          >
                            <MdPlayArrow size={16} />
                            <span>Avançar</span>
                          </button>
                        )}
                        {order.status !== 'cancelled' && order.status !== 'delivered' && (
                          <button
                            className="bg-red-100 text-red-700 px-3 lg:px-4 py-2 rounded-xl font-medium hover:bg-red-200 transition-all flex items-center justify-center space-x-2 text-sm lg:text-base"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCancelOrder(order.id);
                            }}
                          >
                            <MdCancel size={16} />
                            <span>Cancelar</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </AnimatedContainer>
        </div>

        <div className="lg:w-1/3">
          {selectedOrder ? (
            <AnimatedContainer animationType="slideIn" delay={100}>
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 text-white">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-xl font-bold flex items-center space-x-2">
                        <MdShoppingCart size={24} />
                        <span>Pedido {selectedOrder.id}</span>
                      </h3>
                      <p className="text-red-100 mt-1">
                        {selectedOrder.createdAt.toLocaleString()}
                      </p>
                    </div>
                    <button
                      className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-xl transition-all"
                      onClick={() => setSelectedOrder(null)}
                    >
                      <MdCancel size={24} />
                    </button>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  <div className="text-center">
                    <span className={`px-6 py-3 text-lg font-semibold rounded-2xl flex items-center justify-center space-x-2 ${getStatusBadgeClass(selectedOrder.status)}`}>
                      {getStatusIcon(selectedOrder.status)}
                      <span>{getStatusText(selectedOrder.status)}</span>
                    </span>
                  </div>

                  <div className="bg-gray-50 rounded-2xl p-4">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                      <MdPerson size={20} className="text-red-500" />
                      <span>Cliente</span>
                    </h4>
                    <div className="space-y-2">
                      <p className="text-gray-700 font-medium">{selectedOrder.customer.name}</p>
                      <p className="text-gray-600 flex items-center space-x-2">
                        <MdLocationOn size={16} className="text-gray-400" />
                        <span>{selectedOrder.customer.address}</span>
                      </p>
                      <p className="text-gray-600 flex items-center space-x-2">
                        <MdPhone size={16} className="text-gray-400" />
                        <span>{selectedOrder.customer.phone}</span>
                      </p>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                      <MdRestaurant size={20} className="text-red-500" />
                      <span>Itens do Pedido</span>
                    </h4>
                    <div className="space-y-3">
                      {selectedOrder.items.map((item) => (
                        <div key={item.id} className="bg-gray-50 rounded-xl p-4 flex justify-between items-center">
                          <div>
                            <p className="font-medium text-gray-900">{item.name}</p>
                            <p className="text-sm text-gray-500">Quantidade: {item.quantity}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-gray-900">R$ {(item.price * item.quantity).toFixed(2)}</p>
                <p className="text-sm text-gray-500">R$ {item.price.toFixed(2)} cada</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xl font-bold text-gray-900">Total</span>
                      <span className="text-2xl font-bold text-red-600">R$ {selectedOrder.total.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {selectedOrder.status !== 'delivered' && selectedOrder.status !== 'cancelled' && getNextStatus(selectedOrder.status) && (
                      <button
                        className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-4 rounded-2xl font-semibold hover:from-green-600 hover:to-green-700 transition-all flex items-center justify-center space-x-2 shadow-lg"
                        onClick={() => {
                          handleUpdateStatus(selectedOrder.id, getNextStatus(selectedOrder.status)!);
                          setSelectedOrder(null);
                        }}
                      >
                        <MdPlayArrow size={20} />
                        <span>Avançar para {getStatusText(getNextStatus(selectedOrder.status)!)}</span>
                      </button>
                    )}
                    {selectedOrder.status !== 'cancelled' && selectedOrder.status !== 'delivered' && (
                      <button
                        className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-4 rounded-2xl font-semibold hover:from-red-600 hover:to-red-700 transition-all flex items-center justify-center space-x-2 shadow-lg"
                        onClick={() => {
                          handleCancelOrder(selectedOrder.id);
                        }}
                      >
                        <MdCancel size={20} />
                        <span>Cancelar Pedido</span>
                      </button>
                    )}
                    <button
                      className="w-full bg-gray-100 text-gray-700 px-6 py-4 rounded-2xl font-semibold hover:bg-gray-200 transition-all flex items-center justify-center space-x-2"
                      onClick={() => setSelectedOrder(null)}
                    >
                      <MdCancel size={20} />
                      <span>Fechar</span>
                    </button>
                  </div>
                </div>
              </div>
            </AnimatedContainer>
          ) : (
            <AnimatedContainer animationType="fadeIn" delay={100}>
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
                <MdShoppingCart size={64} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">Detalhes do Pedido</h3>
                <p className="text-gray-500">Selecione um pedido para ver os detalhes</p>
              </div>
            </AnimatedContainer>
          )}
        </div>
      </div>
    </AnimatedContainer>
  );
}