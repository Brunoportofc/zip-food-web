'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  MdSearch, 
  MdLocationOn, 
  MdStar, 
  MdAccessTime, 
  MdDeliveryDining,
  MdFilterList,
  MdKeyboardArrowRight,
  MdFavorite,
  MdLocalOffer
} from 'react-icons/md';
import { Restaurant, RestaurantCategory, categoryDisplayNames } from '@/types';
import restaurantService from '@/services/restaurant.service';
import { categoryConfig, deliveryConfig, uiConfig } from '@/constants';

interface FilterState {
  searchTerm: string;
  selectedCategory: RestaurantCategory | 'all';
  sortBy: 'rating' | 'deliveryTime' | 'deliveryFee' | 'name';
  showFavoritesOnly: boolean;
}

export default function CustomerDashboard() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentAddress] = useState(uiConfig.defaultAddress);
  const [showFilters, setShowFilters] = useState(false);
  
  // Estados de filtros
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: '',
    selectedCategory: 'all',
    sortBy: 'rating',
    showFavoritesOnly: false
  });

  // Carregar restaurantes
  useEffect(() => {
    const loadRestaurants = async () => {
      try {
        setLoading(true);
        const data = await restaurantService.getAll();
        setRestaurants(data);
      } catch (error) {
        console.error('❌ [CUSTOMER] Erro ao carregar restaurantes:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRestaurants();
  }, []);

  // Filtrar e organizar restaurantes
  const { filteredRestaurants, restaurantsByCategory } = useMemo(() => {
    let filtered = restaurants;

    // Aplicar busca por termo
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(restaurant =>
        restaurant.name.toLowerCase().includes(searchLower) ||
        categoryDisplayNames[restaurant.category].toLowerCase().includes(searchLower)
      );
    }

    // Aplicar filtro por categoria
    if (filters.selectedCategory !== 'all') {
      filtered = filtered.filter(restaurant => restaurant.category === filters.selectedCategory);
    }

    // Aplicar ordenação
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
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

    // Organizar por categoria
    const byCategory: Record<RestaurantCategory, Restaurant[]> = {} as any;
    Object.keys(categoryDisplayNames).forEach(cat => {
      const category = cat as RestaurantCategory;
      byCategory[category] = restaurants.filter(r => r.category === category);
    });


    return {
      filteredRestaurants: filtered,
      restaurantsByCategory: byCategory
    };
  }, [restaurants, filters]);

  // Obter categorias com restaurantes
  const categoriesWithRestaurants = Object.keys(restaurantsByCategory).filter(
    category => restaurantsByCategory[category as RestaurantCategory].length > 0
  ) as RestaurantCategory[];

  const RestaurantCard = ({ restaurant }: { restaurant: Restaurant }) => (
    <Link href={`/customer/restaurant/${restaurant.id}`} className="block">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg hover:border-red-200 transition-all duration-300 group">
        <div className="relative">
          <img
            src={restaurant.image}
            alt={restaurant.name}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
          />
          
          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {restaurant.isPromoted && (
              <span className="bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
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
            <MdFavorite className="text-gray-400 hover:text-red-500" size={16} />
          </button>
        </div>

        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-bold text-lg text-gray-900 group-hover:text-red-600 transition-colors duration-200 line-clamp-1">
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

  const CategorySection = ({ category, restaurants: categoryRestaurants }: { 
    category: RestaurantCategory; 
    restaurants: Restaurant[] 
  }) => {
    if (categoryRestaurants.length === 0) return null;

    return (
      <section className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="bg-red-50 rounded-full p-3 mr-4">
              <div className="text-red-600 text-xl">
                {categoryConfig[category].icon}
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{categoryDisplayNames[category]}</h2>
              <p className="text-gray-600">{categoryRestaurants.length} restaurante{categoryRestaurants.length > 1 ? 's' : ''}</p>
            </div>
          </div>
          
          <Link 
            href={`/customer/category/${category}`}
            className="flex items-center text-red-600 hover:text-red-700 font-medium transition-colors duration-200"
          >
            Ver todos
            <MdKeyboardArrowRight size={20} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {categoryRestaurants.slice(0, 4).map((restaurant) => (
            <RestaurantCard key={restaurant.id} restaurant={restaurant} />
          ))}
        </div>
      </section>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          {/* Top Bar */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Olá! 👋</h1>
              <div className="flex items-center text-gray-600">
                <MdLocationOn className="mr-2 text-red-600" size={18} />
                <span className="text-sm font-medium">
                  {currentAddress.street}, {currentAddress.neighborhood}, {currentAddress.city}
                </span>
              </div>
            </div>
            
            <div className="text-right">
              <p className="text-xs text-gray-500">Entrega em</p>
              <p className="text-sm font-bold text-gray-900">{deliveryConfig.defaultDeliveryTime}</p>
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
                placeholder="Buscar restaurantes, comidas..."
                value={filters.searchTerm}
                onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                className="w-full pl-12 pr-4 py-3 bg-gray-100 border-0 rounded-2xl focus:bg-white focus:ring-2 focus:ring-red-500 focus:outline-none transition-all duration-200 text-gray-900 placeholder-gray-400"
              />
            </div>

            {/* Filter Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-3 rounded-2xl border-2 transition-all duration-200 flex items-center gap-2 ${
                showFilters 
                  ? 'bg-red-600 border-red-600 text-white' 
                  : 'bg-white border-gray-200 text-gray-700 hover:border-red-300'
              }`}
            >
              <MdFilterList size={20} />
              <span className="hidden sm:inline font-medium">Filtros</span>
            </button>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-2xl border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Category Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Categoria</label>
                  <select
                    value={filters.selectedCategory}
                    onChange={(e) => setFilters(prev => ({ 
                      ...prev, 
                      selectedCategory: e.target.value as RestaurantCategory | 'all' 
                    }))}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900 bg-white"
                  >
                    <option value="all">Todas as categorias</option>
                    {Object.entries(categoryDisplayNames).map(([key, name]) => (
                      <option key={key} value={key}>{name}</option>
                    ))}
                  </select>
                </div>

                {/* Sort Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ordenar por</label>
                  <select
                    value={filters.sortBy}
                    onChange={(e) => setFilters(prev => ({ 
                      ...prev, 
                      sortBy: e.target.value as FilterState['sortBy']
                    }))}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900 bg-white"
                  >
                    <option value="rating">Avaliação</option>
                    <option value="deliveryTime">Tempo de entrega</option>
                    <option value="deliveryFee">Taxa de entrega</option>
                    <option value="name">Nome A-Z</option>
                  </select>
                </div>

                {/* Quick Filters */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Filtros rápidos</label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setFilters(prev => ({ ...prev, showFavoritesOnly: !prev.showFavoritesOnly }))}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors duration-200 ${
                        filters.showFavoritesOnly 
                          ? 'bg-red-600 text-white' 
                          : 'bg-white text-gray-700 border border-gray-300 hover:border-red-300'
                      }`}
                    >
                      ❤️ Favoritos
                    </button>
                    <button
                      onClick={() => setFilters(prev => ({ ...prev, selectedCategory: 'fast_food' }))}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors duration-200 ${
                        filters.selectedCategory === 'fast_food' 
                          ? 'bg-red-600 text-white' 
                          : 'bg-white text-gray-700 border border-gray-300 hover:border-red-300'
                      }`}
                    >
                      🍔 Fast Food
                    </button>
                    <button
                      onClick={() => {
                        const freeDeliveryRestaurants = restaurants.filter(r => r.deliveryFee === 0);
                        if (freeDeliveryRestaurants.length > 0) {
                          // Esta funcionalidade pode ser implementada com um filtro adicional
                        }
                      }}
                      className="px-3 py-1 rounded-full text-sm font-medium bg-white text-gray-700 border border-gray-300 hover:border-red-300 transition-colors duration-200"
                    >
                      🚚 Entrega Grátis
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Promotional Banner */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-3xl p-6 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">🎉 Super Promoção!</h2>
              <p className="text-red-100 mb-4">{deliveryConfig.promotionalMessage}</p>
              <button className="bg-white text-red-600 px-6 py-2 rounded-full font-bold hover:bg-red-50 transition-colors duration-200">
                Ver Ofertas
              </button>
            </div>
            <div className="hidden md:block text-6xl opacity-50">🍕</div>
          </div>
          <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full"></div>
          <div className="absolute -right-4 -top-4 w-20 h-20 bg-white/5 rounded-full"></div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 pb-8">
        {filters.searchTerm || filters.selectedCategory !== 'all' ? (
          /* Filtered Results */
          <section>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {filters.searchTerm ? `Resultados para "${filters.searchTerm}"` : 
                 filters.selectedCategory !== 'all' ? categoryDisplayNames[filters.selectedCategory] : 
                 'Restaurantes'}
              </h2>
              <p className="text-gray-600">
                {filteredRestaurants.length} restaurante{filteredRestaurants.length !== 1 ? 's' : ''} encontrado{filteredRestaurants.length !== 1 ? 's' : ''}
              </p>
            </div>

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
                <h3 className="text-xl font-bold text-gray-900 mb-2">Nenhum restaurante encontrado</h3>
                <p className="text-gray-600 mb-4">Tente ajustar seus filtros ou termo de busca</p>
                <button
                  onClick={() => setFilters({
                    searchTerm: '',
                    selectedCategory: 'all',
                    sortBy: 'rating',
                    showFavoritesOnly: false
                  })}
                  className="bg-red-600 text-white px-6 py-2 rounded-full font-medium hover:bg-red-700 transition-colors duration-200"
                >
                  Limpar Filtros
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredRestaurants.map((restaurant) => (
                  <RestaurantCard key={restaurant.id} restaurant={restaurant} />
                ))}
              </div>
            )}
          </section>
        ) : (
          /* Category Sections */
          <div>
            {loading ? (
              <div className="space-y-12">
                {[...Array(3)].map((_, i) => (
                  <section key={i}>
                    <div className="flex items-center mb-6">
                      <div className="bg-gray-200 animate-pulse rounded-full w-12 h-12 mr-4"></div>
                      <div>
                        <div className="bg-gray-200 animate-pulse h-6 w-32 rounded mb-2"></div>
                        <div className="bg-gray-200 animate-pulse h-4 w-24 rounded"></div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {[...Array(4)].map((_, j) => (
                        <div key={j} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-pulse">
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
                  </section>
                ))}
              </div>
            ) : categoriesWithRestaurants.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🏪</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Nenhum restaurante disponível</h3>
                <p className="text-gray-600">Em breve teremos restaurantes incríveis para você!</p>
              </div>
            ) : (
              categoriesWithRestaurants.map((category) => (
                <CategorySection
                  key={category}
                  category={category}
                  restaurants={restaurantsByCategory[category]}
                />
              ))
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-bold text-gray-900 mb-4 text-lg">Zip Food</h3>
              <ul className="space-y-3">
                <li><Link href="#" className="text-gray-600 hover:text-red-600 transition-colors duration-200">Sobre nós</Link></li>
                <li><Link href="#" className="text-gray-600 hover:text-red-600 transition-colors duration-200">Carreiras</Link></li>
                <li><Link href="#" className="text-gray-600 hover:text-red-600 transition-colors duration-200">Imprensa</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-4 text-lg">Para Restaurantes</h3>
              <ul className="space-y-3">
                <li><Link href="/restaurant" className="text-gray-600 hover:text-red-600 transition-colors duration-200">Cadastre seu restaurante</Link></li>
                <li><Link href="/restaurant" className="text-gray-600 hover:text-red-600 transition-colors duration-200">Portal do Parceiro</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-4 text-lg">Para Entregadores</h3>
              <ul className="space-y-3">
                <li><Link href="/delivery" className="text-gray-600 hover:text-red-600 transition-colors duration-200">Seja um entregador</Link></li>
                <li><Link href="/delivery" className="text-gray-600 hover:text-red-600 transition-colors duration-200">Central do Entregador</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-4 text-lg">Contato</h3>
              <ul className="space-y-3">
                <li><Link href="#" className="text-gray-600 hover:text-red-600 transition-colors duration-200">Ajuda</Link></li>
                <li><Link href="#" className="text-gray-600 hover:text-red-600 transition-colors duration-200">Fale conosco</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-100 mt-8 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-600 mb-4 md:mb-0">
                © 2024 Zip Food. Todos os direitos reservados.
              </p>
              <div className="flex space-x-6">
                <a href="#" className="text-gray-400 hover:text-red-600 transition-colors duration-200">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-red-600 transition-colors duration-200">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"/>
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-red-600 transition-colors duration-200">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.404-5.956 1.404-5.956s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.347-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24.009c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001.029 12.017.001z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}