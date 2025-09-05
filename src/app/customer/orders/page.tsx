'use client';

import React, { useState } from 'react';
import { MdReceipt, MdAccessTime, MdDeliveryDining, MdRestaurant, MdKeyboardArrowDown, MdKeyboardArrowUp } from 'react-icons/md';
import { useTranslation } from 'react-i18next';
import '@/i18n';

// Mock data para pedidos
const mockOrders = [
  {
    id: '1001',
    date: '15/05/2023',
    restaurant: 'Burger King',
    items: [
      { name: 'Whopper', quantity: 1, price: 29.90 },
      { name: 'Batata Grande', quantity: 1, price: 12.90 },
      { name: 'Refrigerante 500ml', quantity: 1, price: 8.90 }
    ],
    total: 51.70,
    status: 'Entregue',
    deliveryTime: '30 min',
    address: 'Rua das Flores, 123 - Centro'
  },
  {
    id: '1002',
    date: '10/05/2023',
    restaurant: 'Pizza Hut',
    items: [
      { name: 'Pizza Grande Pepperoni', quantity: 1, price: 59.90 },
      { name: 'Refrigerante 2L', quantity: 1, price: 12.90 }
    ],
    total: 72.80,
    status: 'Entregue',
    deliveryTime: '45 min',
    address: 'Rua das Flores, 123 - Centro'
  },
  {
    id: '1003',
    date: '05/05/2023',
    restaurant: 'Sushi Express',
    items: [
      { name: 'Combo 30 peças', quantity: 1, price: 89.90 },
      { name: 'Temaki Salmão', quantity: 2, price: 19.90 },
      { name: 'Refrigerante 500ml', quantity: 2, price: 7.90 }
    ],
    total: 145.50,
    status: 'Entregue',
    deliveryTime: '50 min',
    address: 'Rua das Flores, 123 - Centro'
  }
];

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
  const { t } = useTranslation();
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  const toggleOrderDetails = (orderId: string) => {
    if (expandedOrder === orderId) {
      setExpandedOrder(null);
    } else {
      setExpandedOrder(orderId);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">{t('customer.orders.title')}</h1>
      
      {mockOrders.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <MdReceipt className="mx-auto text-gray-400" size={64} />
          <h2 className="text-xl font-semibold mt-4 mb-2">{t('customer.orders.no_orders')}</h2>
          <p className="text-gray-600 mb-6">{t('customer.orders.explore_restaurants')}</p>
          <a 
            href="/customer" 
            className="inline-block bg-red-500 text-white px-6 py-2 rounded-md font-medium hover:bg-red-600 transition-colors"
          >
            {t('customer.orders.explore_button')}
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          {mockOrders.map((order) => (
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
                    <p className="text-sm text-gray-500 mt-1">{t('customer.orders.order_number', { number: order.id })}</p>
                  </div>
                </div>
              </div>
              
              {/* Resumo do pedido */}
              <div className="p-4 flex justify-between items-center cursor-pointer" onClick={() => toggleOrderDetails(order.id)}>
                <div className="flex items-center">
                  <MdRestaurant className="text-gray-600 mr-2" size={20} />
                  <span className="text-gray-800">
                    {order.items.length} {order.items.length === 1 ? t('customer.orders.item') : t('customer.orders.items')}
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
                    <h4 className="font-medium mb-2">{t('customer.orders.order_items')}</h4>
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
                      <span>{t('common.total')}</span>
                      <span>R$ {order.total.toFixed(2)}</span>
                    </div>
                  </div>
                  
                  <div className="mb-2">
                    <h4 className="font-medium mb-1">{t('customer.orders.delivery_address')}</h4>
                    <p className="text-gray-700">{order.address}</p>
                  </div>
                  
                  <div className="flex justify-end mt-4">
                    <button className="bg-red-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-600 transition-colors">
                      {t('customer.orders.order_again')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}