'use client';

import React, { useState, useEffect } from 'react';
import { MdReceipt, MdAccessTime, MdDeliveryDining, MdRestaurant, MdKeyboardArrowDown, MdKeyboardArrowUp, MdLocationOn } from 'react-icons/md';
import { orderService } from '@/services/order.service';
import useAuthStore from '@/store/auth.store';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import DeliveryTracking from '@/components/DeliveryTracking';



interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  date: string;
  restaurant: string;
  items: OrderItem[];
  total: number;
  status: string;
  deliveryTime: string;
  address: string;
}

export default function OrdersPage() {
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [trackingOrderId, setTrackingOrderId] = useState<string | null>(null);
  const { user } = useAuthStore();

  // Carregar pedidos do usuário
  useEffect(() => {
    const loadUserOrders = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const userOrders = await orderService.getOrdersByCustomer(user.id);
        
        // Mapear dados dos pedidos para o formato da interface
        const mappedOrders: Order[] = userOrders.map(order => ({
          id: order.id,
          date: new Date(order.createdAt).toLocaleDateString('pt-BR'),
          restaurant: order.restaurantName || 'Restaurante',
          items: order.items.map(item => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price
          })),
          total: order.total,
          status: order.status === 'delivered' ? 'Entregue' : 
                 order.status === 'preparing' ? 'Preparando' :
                 order.status === 'in_delivery' ? 'Em entrega' :
                 order.status === 'cancelled' ? 'Cancelado' : 'Pendente',
          deliveryTime: order.estimatedDeliveryTime || '30-45 min',
          address: order.deliveryAddress
        }));
        
        setOrders(mappedOrders);
      } catch (error) {
        console.error('Erro ao carregar pedidos:', error);
        toast.error('Erro ao carregar seus pedidos');
        
        // Fallback para dados de desenvolvimento
        const fallbackOrders: Order[] = [
          {
            id: 'dev-1001',
            date: new Date().toLocaleDateString('pt-BR'),
            restaurant: 'Restaurante Demo',
            items: [
              { name: 'Item Demo 1', quantity: 1, price: 25.90 },
              { name: 'Item Demo 2', quantity: 1, price: 15.90 }
            ],
            total: 41.80,
            status: 'Entregue',
            deliveryTime: '30 min',
            address: 'Endereço de desenvolvimento'
          }
        ];
        setOrders(fallbackOrders);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserOrders();
  }, [user]);

  const toggleOrderDetails = (orderId: string) => {
    if (expandedOrder === orderId) {
      setExpandedOrder(null);
    } else {
      setExpandedOrder(orderId);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Meus Pedidos</h1>
      
      {isLoading ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando seus pedidos...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <MdReceipt className="mx-auto text-gray-400" size={64} />
          <h2 className="text-xl font-semibold mt-4 mb-2">Nenhum pedido encontrado</h2>
          <p className="text-gray-600 mb-6">Explore nossos restaurantes e faça seu primeiro pedido!</p>
          <Link 
            href="/customer" 
            className="inline-block bg-red-500 text-white px-6 py-2 rounded-md font-medium hover:bg-red-600 transition-colors"
          >
            Explorar Restaurantes
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              {/* Cabeçalho do pedido */}
              <div className="p-4 border-b border-gray-100">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-500">{order.date}</p>
                    <h3 className="font-semibold text-lg">{order.restaurant}</h3>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                      {order.status}
                    </span>
                    <p className="text-sm text-gray-500 mt-1">Pedido #{order.id}</p>
                  </div>
                </div>
              </div>
              
              {/* Resumo do pedido */}
              <div className="p-4 flex justify-between items-center cursor-pointer" onClick={() => toggleOrderDetails(order.id)}>
                <div className="flex items-center">
                  <MdRestaurant className="text-gray-600 mr-2" size={20} />
                  <span className="text-gray-800">
                    {order.items.length} {order.items.length === 1 ? 'item' : 'itens'}
                  </span>
                  <span className="mx-2">•</span>
                  <MdAccessTime className="text-gray-600 mr-2" size={20} />
                  <span className="text-gray-800">{order.deliveryTime}</span>
                </div>
                <div className="flex items-center">
                  <span className="font-medium mr-2">R$ {order.total.toFixed(2)}</span>
                  {expandedOrder === order.id ? (
                    <MdKeyboardArrowUp size={24} className="text-gray-600" />
                  ) : (
                    <MdKeyboardArrowDown size={24} className="text-gray-600" />
                  )}
                </div>
              </div>
              
              {/* Detalhes do pedido (expandível) */}
              {expandedOrder === order.id && (
                <div className="p-4 bg-gray-50 border-t border-gray-100">
                  <div className="mb-4">
                    <h4 className="font-medium mb-2">Itens do Pedido</h4>
                    <div className="space-y-2">
                      {order.items.map((item, index) => (
                        <div key={index} className="flex justify-between">
                          <span className="text-gray-800">{item.quantity}x {item.name}</span>
                          <span className="text-gray-800">R$ {item.price.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-3 mb-3">
                    <div className="flex justify-between font-medium">
                      <span>Total</span>
                      <span>R$ {order.total.toFixed(2)}</span>
                    </div>
                  </div>
                  
                  <div className="mb-2">
                    <h4 className="font-medium mb-1">Endereço de Entrega</h4>
                    <p className="text-gray-700">{order.address}</p>
                  </div>
                  
                  <div className="flex justify-end mt-4 space-x-3">
                    {(order.status === 'Em entrega' || order.status === 'Preparando') && (
                      <button 
                        onClick={() => setTrackingOrderId(order.id)}
                        className="bg-blue-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-600 transition-colors flex items-center"
                      >
                        <MdLocationOn className="mr-1" size={16} />
                        Acompanhar Entrega
                      </button>
                    )}
                    <button className="bg-red-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-600 transition-colors">
                      Pedir Novamente
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      {/* Modal de Tracking de Entrega */}
      {trackingOrderId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-semibold">Acompanhar Entrega - Pedido #{trackingOrderId}</h2>
              <button 
                onClick={() => setTrackingOrderId(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="p-4">
              <DeliveryTracking orderId={trackingOrderId} />
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}