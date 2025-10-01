'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { 
  MdArrowBack,
  MdSearch, 
  MdStar, 
  MdAccessTime, 
  MdDeliveryDining,
  MdFilterList,
  MdFavorite,
  MdSort
} from 'react-icons/md';
import { Restaurant, RestaurantCategory, categoryDisplayNames } from '@/types';
import restaurantService from '@/services/restaurant.service';
import { categoryConfig, getCategoryIcon } from '@/constants';

interface CategoryPageProps {
  params: Promise<{ category: string }>;
}

export default function CategoryPage({ params }: CategoryPageProps) {
  const resolvedParams = use(params);
  const category = resolvedParams.category as RestaurantCategory;
  
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'rating' | 'deliveryTime' | 'deliveryFee' | 'name'>('rating');
  const [showFilters, setShowFilters] = useState(false);

  // Carregar restaurantes da categoria
  useEffect(() => {
    const loadRestaurants = async () => {
      try {
        setLoading(true);
        const allRestaurants = await restaurantService.getAll();
        const categoryRestaurants = allRestaurants.filter(r => r.category === category);
        setRestaurants(categoryRestaurants);
      } catch (error) {
        console.error('Erro ao carregar restaurantes:', error);
      } finally {
        setLoading(false);
      }
    };

    if (category && categoryDisplayNames[category]) {
      loadRestaurants();
    }
  }, [category]);

  // Filtrar e ordenar restaurantes
  const filteredRestaurants = restaurants
    .filter(restaurant => {
      if (!searchTerm) return true;
      return restaurant.name.toLowerCase().includes(searchTerm.toLowerCase());
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return b.rating - a.rating;
        case 'deliveryTime':
          return parseInt(a.estimatedDeliveryTime) - parseInt(b.estimatedDeliveryTime);
        case 'deliveryFee':
          return a.deliveryFee - b.deliveryFee;
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

  if (!categoryDisplayNames[category]) {
    return (
      <div className="min-h-screen bg-[#101828] flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Categoria não encontrada</h1>
          <p className="text-gray-600 mb-4">A categoria solicitada não existe.</p>
          <Link
            href="/customer"
            className="bg-primary-600 text-white px-6 py-2 rounded-full font-medium hover:bg-primary-700 transition-colors duration-200"
          >
            Voltar ao Início
          </Link>
        </div>
      </div>
    );
  }

  const RestaurantCard = ({ restaurant }: { restaurant: Restaurant }) => (
    <Link href={`/customer/restaurant/${restaurant.id}`} className="block">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg hover:border-primary-200 transition-all duration-300 group">
        <div className="relative">
          <img
            src={restaurant.image}
            alt={restaurant.name}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
          />
          
          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {restaurant.isPromoted && (
              <span className="bg-gradient-to-r from-primary-500 to-primary-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                🔥 Promoção
              </span>
            )}
            {restaurant.deliveryFee === 0 && (
              <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                Entrega Grátis
              </span>
            )}
          </div>

          {/* Rating */}
          <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm rounded-full px-2 py-1 flex items-center shadow-lg">
            <MdStar className="text-yellow-500 mr-1" size={14} />
            <span className="text-xs font-bold text-gray-900">{restaurant.rating.toFixed(1)}</span>
          </div>

          {/* Favorite Button */}
          <button className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm rounded-full p-2 hover:bg-white transition-colors duration-200 shadow-lg">
            <MdFavorite className="text-gray-400 hover:text-primary-500" size={16} />
          </button>
        </div>

        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-bold text-lg text-gray-900 group-hover:text-primary-600 transition-colors duration-200 line-clamp-1">
              {restaurant.name}
            </h3>
          </div>
          
          <p className="text-gray-600 text-sm mb-3 flex items-center">
            <span className="mr-2">{categoryConfig[restaurant.category].icon}</span>
            {categoryDisplayNames[restaurant.category]}
          </p>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center text-gray-500">
              <MdAccessTime className="mr-1" size={16} />
              <span>{restaurant.estimatedDeliveryTime}</span>
            </div>
            
            <div className="flex items-center">
              <MdDeliveryDining className="mr-1 text-gray-500" size={16} />
              <span className="font-semibold text-gray-900">
                {restaurant.deliveryFee === 0 ? 'Grátis' : `R$ ${restaurant.deliveryFee.toFixed(2)}`}
              </span>
            </div>
          </div>

          {/* Minimum Order Value */}
          {restaurant.minimumOrder && (
            <div className="mt-2 text-xs text-gray-500">
              Pedido mínimo: R$ {restaurant.minimumOrder.toFixed(2)}
            </div>
          )}
        </div>
      </div>
    </Link>
  );

  return (
    <div className="min-h-screen bg-[#101828]">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          {/* Top Navigation */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Link 
                href="/customer"
                className="mr-4 p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
              >
                <MdArrowBack size={24} className="text-gray-700" />
              </Link>
              
              <div className="flex items-center">
                <div className="bg-primary-50 rounded-full p-3 mr-4">
                  <div className="text-primary-600 text-xl">
                    {getCategoryIcon(category)}
                  </div>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{categoryDisplayNames[category]}</h1>
                  <p className="text-gray-600">
                    {loading ? 'Carregando...' : `${filteredRestaurants.length} restaurante${filteredRestaurants.length !== 1 ? 's' : ''}`}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex gap-3">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <MdSearch className="text-gray-400" size={20} />
              </div>
              <input
                type="text"
                placeholder={`Buscar em ${categoryDisplayNames[category]}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-100 border-0 rounded-2xl focus:bg-white focus:ring-2 focus:ring-primary-500 focus:outline-none transition-all duration-200 text-gray-900 placeholder-gray-400"
              />
            </div>

            {/* Sort Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-3 rounded-2xl border-2 transition-all duration-200 flex items-center gap-2 ${
                showFilters 
                  ? 'bg-primary-600 border-primary-600 text-white' 
                  : 'bg-white border-gray-200 text-gray-700 hover:border-primary-300'
              }`}
            >
              <MdSort size={20} />
              <span className="hidden sm:inline font-medium">Ordenar</span>
            </button>
          </div>

          {/* Sort Panel */}
          {showFilters && (
            <div className="mt-4 p-4 bg-[#101828] rounded-2xl border border-gray-200">
              <div className="flex flex-wrap gap-3">
                <h3 className="w-full text-sm font-medium text-gray-700 mb-2">Ordenar por:</h3>
                
                {[
                  { key: 'rating', label: '⭐ Avaliação', desc: 'Melhor avaliados primeiro' },
                  { key: 'deliveryTime', label: '⚡ Entrega', desc: 'Mais rápidos primeiro' },
                  { key: 'deliveryFee', label: '💰 Taxa', desc: 'Menor taxa primeiro' },
                  { key: 'name', label: '🔤 Nome', desc: 'Ordem alfabética' }
                ].map(({ key, label, desc }) => (
                  <button
                    key={key}
                    onClick={() => setSortBy(key as any)}
                    className={`flex-1 min-w-0 p-3 rounded-xl border-2 transition-all duration-200 text-left ${
                      sortBy === key 
                        ? 'bg-primary-600 border-primary-600 text-white' 
                        : 'bg-white border-gray-200 text-gray-700 hover:border-primary-300'
                    }`}
                  >
                    <div className="font-medium text-sm">{label}</div>
                    <div className={`text-xs mt-1 ${sortBy === key ? 'text-primary-100' : 'text-gray-500'}`}>
                      {desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-pulse">
                <div className="bg-gray-200 h-48"></div>
                <div className="p-4">
                  <div className="bg-gray-200 h-6 rounded mb-2"></div>
                  <div className="bg-gray-200 h-4 rounded mb-3"></div>
                  <div className="flex justify-between">
                    <div className="bg-gray-200 h-4 w-20 rounded"></div>
                    <div className="bg-gray-200 h-4 w-16 rounded"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredRestaurants.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {searchTerm ? 'Nenhum restaurante encontrado' : 'Nenhum restaurante nesta categoria'}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm 
                ? `Não encontramos restaurantes de ${categoryDisplayNames[category]} com "${searchTerm}"`
                : `Ainda não temos restaurantes de ${categoryDisplayNames[category]}, mas em breve teremos opções incríveis!`
              }
            </p>
            {searchTerm && (
              <button
                    onClick={() => setSearchTerm('')}
                    className="bg-primary-600 text-white px-6 py-2 rounded-full font-medium hover:bg-primary-700 transition-colors duration-200"
                  >
                    Limpar Busca
                  </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredRestaurants.map((restaurant) => (
              <RestaurantCard key={restaurant.id} restaurant={restaurant} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
