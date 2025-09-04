'use client';

import { useState, useEffect } from 'react';
import { MdSearch, MdLocationOn, MdLocalOffer } from 'react-icons/md';
import RestaurantCarousel from '@/components/RestaurantCarousel';

// Mock data para restaurantes
const mockRestaurants = [
  {
    id: '1',
    name: 'Burger King',
    image: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400&h=300&fit=crop',
    rating: 4.5,
    deliveryTime: '25-35 min',
    deliveryFee: 5.99,
    category: 'Fast Food',
    isPromoted: true
  },
  {
    id: '2',
    name: 'Pizza Hut',
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&h=300&fit=crop',
    rating: 4.3,
    deliveryTime: '30-40 min',
    deliveryFee: 0,
    category: 'Pizza'
  },
  {
    id: '3',
    name: 'Sushi Express',
    image: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400&h=300&fit=crop',
    rating: 4.7,
    deliveryTime: '20-30 min',
    deliveryFee: 8.50,
    category: 'Japonesa'
  },
  {
    id: '4',
    name: 'Taco Bell',
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop',
    rating: 4.2,
    deliveryTime: '15-25 min',
    deliveryFee: 4.99,
    category: 'Mexicana'
  },
  {
    id: '5',
    name: 'Subway',
    image: 'https://images.unsplash.com/photo-1555072956-7758afb20e8f?w=400&h=300&fit=crop',
    rating: 4.1,
    deliveryTime: '20-30 min',
    deliveryFee: 3.99,
    category: 'Sanduíches'
  },
  {
    id: '6',
    name: 'McDonald\'s',
    image: 'https://images.unsplash.com/photo-1552566090-a4c64d6b6b2d?w=400&h=300&fit=crop',
    rating: 4.0,
    deliveryTime: '15-25 min',
    deliveryFee: 0,
    category: 'Fast Food',
    isPromoted: true
  },
  {
    id: '7',
    name: 'KFC',
    image: 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=400&h=300&fit=crop',
    rating: 4.4,
    deliveryTime: '20-30 min',
    deliveryFee: 4.50,
    category: 'Fast Food'
  },
  {
    id: '8',
    name: 'Domino\'s Pizza',
    image: 'https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=400&h=300&fit=crop',
    rating: 4.6,
    deliveryTime: '25-35 min',
    deliveryFee: 0,
    category: 'Pizza',
    isPromoted: true
  }
];

// Mock data para categorias
const mockCategories = [
  { id: '1', name: 'Pizza', icon: '🍕', color: 'bg-orange-100 text-orange-600' },
  { id: '2', name: 'Burger', icon: '🍔', color: 'bg-yellow-100 text-yellow-600' },
  { id: '3', name: 'Sushi', icon: '🍣', color: 'bg-red-100 text-red-500' },
  { id: '4', name: 'Mexicana', icon: '🌮', color: 'bg-red-100 text-red-600' },
  { id: '5', name: 'Doces', icon: '🍰', color: 'bg-pink-100 text-pink-600' },
  { id: '6', name: 'Bebidas', icon: '🥤', color: 'bg-blue-100 text-blue-600' }
];

export default function CustomerDashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentAddress] = useState('Rua das Flores, 123 - Centro');

  // Separar restaurantes por categoria
  const promotedRestaurants = mockRestaurants.filter(r => r.isPromoted);
  const fastFoodRestaurants = mockRestaurants.filter(r => r.category === 'Fast Food');
  const pizzaRestaurants = mockRestaurants.filter(r => r.category === 'Pizza');
  const allRestaurants = mockRestaurants;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-black mb-2">Olá! 👋</h1>
              <div className="flex items-center text-gray-600">
                <MdLocationOn className="mr-1" size={16} />
                <span className="text-sm">{currentAddress}</span>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="text-6xl">🍕</div>
            </div>
          </div>
          
          {/* Search Bar */}
          <div className="relative mb-8">
            <MdSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar restaurantes, pratos ou categorias..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent shadow-sm"
            />
          </div>

          {/* Categories */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-black mb-4">Categorias</h2>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
              {mockCategories.map((category) => (
                <button
                  key={category.id}
                  className={`flex flex-col items-center p-4 rounded-xl transition-transform hover:scale-105 ${category.color}`}
                >
                  <span className="text-3xl mb-2">{category.icon}</span>
                  <span className="text-sm font-semibold">{category.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Promotional Banner */}
          <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-2xl p-6 mb-8 text-white relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center mb-2">
                <MdLocalOffer className="mr-2" size={24} />
                <span className="font-semibold">Oferta Especial</span>
              </div>
              <h2 className="text-2xl font-bold mb-2">Frete Grátis em pedidos acima de R$ 30! 🚀</h2>
              <p className="text-red-100">Válido até o final do mês. Aproveite!</p>
            </div>
            <div className="absolute right-4 top-4 text-6xl opacity-20">🎉</div>
          </div>
        </div>
      </div>

      {/* Restaurant Carousels */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Promoted Restaurants */}
        {promotedRestaurants.length > 0 && (
          <RestaurantCarousel
            restaurants={promotedRestaurants}
            title="🔥 Promoções Imperdíveis"
          />
        )}

        {/* Fast Food */}
        {fastFoodRestaurants.length > 0 && (
          <RestaurantCarousel
            restaurants={fastFoodRestaurants}
            title="🍔 Fast Food"
          />
        )}

        {/* Pizza */}
        {pizzaRestaurants.length > 0 && (
          <RestaurantCarousel
            restaurants={pizzaRestaurants}
            title="🍕 Pizzarias"
          />
        )}

        {/* All Restaurants */}
        <RestaurantCarousel
          restaurants={allRestaurants}
          title="🍽️ Todos os Restaurantes"
        />

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="text-xl font-bold text-black mb-6">Ações Rápidas</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button className="flex flex-col items-center p-6 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
              <span className="text-3xl mb-3">📋</span>
              <span className="text-sm font-semibold text-gray-700">Meus Pedidos</span>
            </button>
            <button className="flex flex-col items-center p-6 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
              <span className="text-3xl mb-3">❤️</span>
              <span className="text-sm font-semibold text-gray-700">Favoritos</span>
            </button>
            <button className="flex flex-col items-center p-6 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
              <span className="text-3xl mb-3">🎯</span>
              <span className="text-sm font-semibold text-gray-700">Endereços</span>
            </button>
            <button className="flex flex-col items-center p-6 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
              <span className="text-3xl mb-3">💳</span>
              <span className="text-sm font-semibold text-gray-700">Pagamento</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}