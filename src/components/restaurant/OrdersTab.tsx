'use client';

import React, { useState, useEffect } from 'react';
import { 
  FaShoppingBag, FaClock, FaUser, FaPhone, FaMapMarkerAlt,
  FaCheck, FaTimes, FaEye, FaFilter, FaSearch, FaArrowUp
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  notes?: string;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
}

interface DeliveryAddress {
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  zipCode: string;
  complement?: string;
}

interface Order {
  id: string;
  customer: Customer;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivering' | 'delivered' | 'cancelled';
  paymentMethod: 'credit-card' | 'debit-card' | 'pix' | 'cash';
  deliveryAddress: DeliveryAddress;
  notes?: string;
  estimatedDeliveryTime?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const statusOptions = [
  { value: '', label: 'Todos os status' },
  { value: 'pending', label: 'Pendente' },
  { value: 'confirmed', label: 'Confirmado' },
  { value: 'preparing', label: 'Preparando' },
  { value: 'ready', label: 'Pronto' },
  { value: 'delivering', label: 'Saiu para Entrega' },
  { value: 'delivered', label: 'Entregue' },
  { value: 'cancelled', label: 'Cancelado' }
];

export default function OrdersTab() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);

  useEffect(() => {
    loadOrders();
    
    // Atualização automática a cada 30 segundos
    const interval = setInterval(loadOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      
      // Dados simulados - em produção viria da API
      const mockOrders: Order[] = [
        {
          id: `ORD-${Date.now()}-1`,
          customer: {
            id: 'customer-1',
            name: 'João Silva',
            phone: '(11) 99999-9999',
            email: 'joao@email.com'
          },
          items: [
            { id: '1', name: 'Pizza Margherita', quantity: 1, price: 35.90 },
            { id: '2', name: 'Refrigerante Lata', quantity: 2, price: 5.50 }
          ],
          subtotal: 46.90,
          deliveryFee: 5.99,
          total: 52.89,
          status: 'preparing',
          paymentMethod: 'credit-card',
          deliveryAddress: {
            street: 'Rua das Flores',
            number: '123',
            neighborhood: 'Centro',
            city: 'São Paulo',
            zipCode: '01000-000',
            complement: 'Apto 45'
          },
          notes: 'Sem cebola na pizza',
          estimatedDeliveryTime: new Date(Date.now() + 35 * 60 * 1000),
          createdAt: new Date(Date.now() - 15 * 60 * 1000),
          updatedAt: new Date()
        },
        {
          id: `ORD-${Date.now()}-2`,
          customer: {
            id: 'customer-2',
            name: 'Maria Santos',
            phone: '(11) 88888-8888'
          },
          items: [
            { id: '3', name: 'Hambúrguer Artesanal', quantity: 2, price: 28.50 },
            { id: '4', name: 'Batata Frita', quantity: 1, price: 12.90 }
          ],
          subtotal: 69.90,
          deliveryFee: 4.99,
          total: 74.89,
          status: 'ready',
          paymentMethod: 'pix',
          deliveryAddress: {
            street: 'Av. Paulista',
            number: '1000',
            neighborhood: 'Bela Vista',
            city: 'São Paulo',
            zipCode: '01310-000'
          },
          estimatedDeliveryTime: new Date(Date.now() + 20 * 60 * 1000),
          createdAt: new Date(Date.now() - 25 * 60 * 1000),
          updatedAt: new Date()
        },
        {
          id: `ORD-${Date.now()}-3`,
          customer: {
            id: 'customer-3',
            name: 'Pedro Costa',
            phone: '(11) 77777-7777'
          },
          items: [
            { id: '5', name: 'Salada Caesar', quantity: 1, price: 22.90 }
          ],
          subtotal: 22.90,
          deliveryFee: 6.99,
          total: 29.89,
          status: 'delivered',
          paymentMethod: 'cash',
          deliveryAddress: {
            street: 'Rua Augusta',
            number: '500',
            neighborhood: 'Consolação',
            city: 'São Paulo',
            zipCode: '01305-000'
          },
          createdAt: new Date(Date.now() - 120 * 60 * 1000),
          updatedAt: new Date(Date.now() - 60 * 60 * 1000)
        }
      ];
      
      setOrders(mockOrders);
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
      toast.error('Erro ao carregar pedidos');
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customer.phone.includes(searchTerm);
    const matchesStatus = !selectedStatus || order.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'bg-gray-100 text-gray-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'preparing': return 'bg-yellow-100 text-yellow-800';
      case 'ready': return 'bg-orange-100 text-orange-800';
      case 'delivering': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: Order['status']) => {
    const statusMap = {
      'pending': 'Pendente',
      'confirmed': 'Confirmado',
      'preparing': 'Preparando',
      'ready': 'Pronto',
      'delivering': 'Saiu para Entrega',
      'delivered': 'Entregue',
      'cancelled': 'Cancelado'
    };
    return statusMap[status] || status;
  };

  const getPaymentMethodText = (method: Order['paymentMethod']) => {
    const methodMap = {
      'credit-card': 'Cartão de Crédito',
      'debit-card': 'Cartão de Débito',
      'pix': 'PIX',
      'cash': 'Dinheiro'
    };
    return methodMap[method] || method;
  };

  const updateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      setOrders(prev => prev.map(order => 
        order.id === orderId 
          ? { ...order, status: newStatus, updatedAt: new Date() }
          : order
      ));
      
      toast.success(`Pedido ${getStatusText(newStatus).toLowerCase()}`);
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar status do pedido');
    }
  };

  const viewOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
  };

  const getNextStatus = (currentStatus: Order['status']): Order['status'] | null => {
    const statusFlow: Record<Order['status'], Order['status'] | null> = {
      'pending': 'confirmed',
      'confirmed': 'preparing',
      'preparing': 'ready',
      'ready': 'delivering',
      'delivering': 'delivered',
      'delivered': null,
      'cancelled': null
    };
    return statusFlow[currentStatus];
  };

  const getNextStatusText = (currentStatus: Order['status']): string => {
    const nextStatus = getNextStatus(currentStatus);
    return nextStatus ? getStatusText(nextStatus) : '';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando pedidos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Pedidos</h2>
          <p className="text-gray-600 mt-1">Gerencie todos os pedidos do seu restaurante</p>
        </div>
        <button
          onClick={loadOrders}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-3 py-2 rounded-lg transition-colors"
        >
          <FaArrowUp className="w-4 h-4" />
          <span>Atualizar</span>
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex-1">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por ID, cliente ou telefone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <FaFilter className="text-gray-400" />
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500"
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Pedidos */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Pedidos ({filteredOrders.length})
          </h3>
        </div>
        
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <FaShoppingBag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">
              {searchTerm || selectedStatus ? 'Nenhum pedido encontrado' : 'Nenhum pedido ainda'}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              {searchTerm || selectedStatus ? 'Tente ajustar os filtros' : 'Os pedidos aparecerão aqui'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredOrders.map((order) => (
              <div key={order.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="text-lg font-semibold text-gray-900">#{order.id.slice(-6)}</h4>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {getStatusText(order.status)}
                      </span>
                      <span className="text-sm text-gray-500">
                        {order.createdAt.toLocaleString('pt-BR')}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center space-x-2">
                        <FaUser className="text-gray-400" />
                        <span className="text-gray-700">{order.customer.name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <FaPhone className="text-gray-400" />
                        <span className="text-gray-700">{order.customer.phone}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <FaMapMarkerAlt className="text-gray-400" />
                        <span className="text-gray-700 text-sm">
                          {order.deliveryAddress.street}, {order.deliveryAddress.number} - {order.deliveryAddress.neighborhood}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <FaClock className="text-gray-400" />
                        <span className="text-gray-700 text-sm">
                          {order.estimatedDeliveryTime 
                            ? `Entrega: ${order.estimatedDeliveryTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
                            : 'Sem previsão'
                          }
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-2xl font-bold text-green-600">
                          R$ {order.total.toFixed(2)}
                        </span>
                        <span className="text-sm text-gray-500 ml-2">
                          ({order.items.length} {order.items.length === 1 ? 'item' : 'itens'})
                        </span>
                        <span className="text-sm text-gray-500 ml-2">
                          • {getPaymentMethodText(order.paymentMethod)}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => viewOrderDetails(order)}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                          title="Ver detalhes"
                        >
                          <FaEye />
                        </button>
                        
                        {getNextStatus(order.status) && (
                          <button
                            onClick={() => updateOrderStatus(order.id, getNextStatus(order.status)!)}
                            className="flex items-center space-x-2 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors"
                          >
                            <FaCheck className="w-4 h-4" />
                            <span>{getNextStatusText(order.status)}</span>
                          </button>
                        )}
                        
                        {order.status !== 'cancelled' && order.status !== 'delivered' && (
                          <button
                            onClick={() => updateOrderStatus(order.id, 'cancelled')}
                            className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                            title="Cancelar pedido"
                          >
                            <FaTimes />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Detalhes do Pedido */}
      {showOrderModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">
                Detalhes do Pedido #{selectedOrder.id.slice(-6)}
              </h3>
              <button
                onClick={() => setShowOrderModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimes className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Status e Informações Básicas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Status</h4>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedOrder.status)}`}>
                    {getStatusText(selectedOrder.status)}
                  </span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Pagamento</h4>
                  <p className="text-gray-700">{getPaymentMethodText(selectedOrder.paymentMethod)}</p>
                </div>
              </div>

              {/* Cliente */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Cliente</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="font-medium">{selectedOrder.customer.name}</p>
                  <p className="text-gray-600">{selectedOrder.customer.phone}</p>
                  {selectedOrder.customer.email && (
                    <p className="text-gray-600">{selectedOrder.customer.email}</p>
                  )}
                </div>
              </div>

              {/* Endereço de Entrega */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Endereço de Entrega</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p>{selectedOrder.deliveryAddress.street}, {selectedOrder.deliveryAddress.number}</p>
                  <p>{selectedOrder.deliveryAddress.neighborhood} - {selectedOrder.deliveryAddress.city}</p>
                  <p>CEP: {selectedOrder.deliveryAddress.zipCode}</p>
                  {selectedOrder.deliveryAddress.complement && (
                    <p className="text-gray-600">Complemento: {selectedOrder.deliveryAddress.complement}</p>
                  )}
                </div>
              </div>

              {/* Itens do Pedido */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Itens do Pedido</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-gray-600">Quantidade: {item.quantity}</p>
                        {item.notes && (
                          <p className="text-sm text-gray-500">Obs: {item.notes}</p>
                        )}
                      </div>
                      <p className="font-semibold">R$ {(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  ))}
                  
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal:</span>
                      <span>R$ {selectedOrder.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Taxa de entrega:</span>
                      <span>R$ {selectedOrder.deliveryFee.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg mt-2">
                      <span>Total:</span>
                      <span>R$ {selectedOrder.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Observações */}
              {selectedOrder.notes && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Observações</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-700">{selectedOrder.notes}</p>
                  </div>
                </div>
              )}

              {/* Horários */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Horários</h4>
                <div className="bg-gray-50 p-4 rounded-lg text-sm">
                  <p><strong>Pedido realizado:</strong> {selectedOrder.createdAt.toLocaleString('pt-BR')}</p>
                  <p><strong>Última atualização:</strong> {selectedOrder.updatedAt.toLocaleString('pt-BR')}</p>
                  {selectedOrder.estimatedDeliveryTime && (
                    <p><strong>Previsão de entrega:</strong> {selectedOrder.estimatedDeliveryTime.toLocaleString('pt-BR')}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Ações */}
            <div className="flex items-center justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={() => setShowOrderModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Fechar
              </button>
              
              {getNextStatus(selectedOrder.status) && (
                <button
                  onClick={() => {
                    updateOrderStatus(selectedOrder.id, getNextStatus(selectedOrder.status)!);
                    setShowOrderModal(false);
                  }}
                  className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                >
                  <FaCheck className="w-4 h-4" />
                  <span>{getNextStatusText(selectedOrder.status)}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}