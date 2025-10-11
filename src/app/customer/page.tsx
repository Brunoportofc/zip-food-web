'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  MdSearch, 
  MdLocationOn, 
  MdStar, 
  MdAccessTime, 
  MdDeliveryDining,
  MdKeyboardArrowRight,
  MdFavorite,
  MdLocalOffer,
  MdTrendingUp,
  MdFlashOn,
  MdRestaurant
} from 'react-icons/md';
import { Restaurant, RestaurantCategory, categoryDisplayNames } from '@/types';
import restaurantService from '@/services/restaurant.service';
import { categoryConfig, deliveryConfig, uiConfig, getCategoryIcon, categoryTranslationKeys } from '@/constants';
import { useLanguage } from '@/contexts/LanguageContext';

interface FilterState {
  searchTerm: string;
}

export default function CustomerDashboard() {
  const { t } = useLanguage();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentAddress] = useState(uiConfig.defaultAddress);
  
  // Estado de busca
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: ''
  });

  // Função para rolar para os resultados da busca
  const scrollToResults = () => {
    const resultsSection = document.getElementById('search-results');
    if (resultsSection) {
      resultsSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Handler para Enter na busca
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && filters.searchTerm.trim()) {
      scrollToResults();
    }
  };

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

    // Aplicar busca por termo (apenas nome do restaurante)
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(restaurant =>
        restaurant.name.toLowerCase().includes(searchLower)
      );
    }

    // Ordenação padrão por rating (melhor avaliação primeiro)
    filtered.sort((a, b) => b.rating - a.rating);

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

  // Obter TODAS as categorias disponíveis (mesmo sem restaurantes)
  const allCategories = Object.keys(categoryDisplayNames) as RestaurantCategory[];

  const RestaurantCard = ({ restaurant, featured = false }: { restaurant: Restaurant; featured?: boolean }) => (
    <Link href={`/customer/restaurant/${restaurant.id}`} className="block group">
      <div className={`bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-2xl hover:border-primary-200 transition-all duration-500 group-hover:-translate-y-2 ${featured ? 'ring-2 ring-primary-100' : ''}`}>
        <div className="relative overflow-hidden">
          <img
            src={restaurant.image}
            alt={restaurant.name}
            className="w-full h-52 object-cover group-hover:scale-110 transition-transform duration-700"
          />
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Badges */}
          <div className="absolute top-4 left-4 flex flex-col gap-2">
            {restaurant.isPromoted && (
              <span className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg flex items-center gap-1 animate-pulse">
                <MdFlashOn size={12} />
                Promoção
              </span>
            )}
            {restaurant.deliveryFee === 0 && (
              <span className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg">
                Entrega Grátis
              </span>
            )}
            {featured && (
              <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg flex items-center gap-1">
                <MdTrendingUp size={12} />
                Popular
              </span>
            )}
          </div>

          {/* Rating */}
          <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm rounded-2xl px-3 py-1.5 flex items-center shadow-lg border border-white/20">
            <MdStar className="text-yellow-500 mr-1" size={16} />
            <span className="text-sm font-bold text-gray-900">{restaurant.rating.toFixed(1)}</span>
          </div>

          {/* Favorite Button */}
          <button className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-full p-3 hover:bg-white hover:scale-110 transition-all duration-300 shadow-lg group/fav">
            <MdFavorite className="text-gray-400 group-hover/fav:text-red-500 transition-colors duration-200" size={18} />
          </button>
        </div>

        <div className="p-6">
          <div className="flex items-start justify-between mb-3">
            <h3 className="font-bold text-xl text-gray-900 group-hover:text-primary-600 transition-colors duration-300 line-clamp-1">
              {restaurant.name}
            </h3>
          </div>
          
          <p className="text-gray-600 text-sm mb-4 flex items-center">
            <span className="mr-2 text-lg">{getCategoryIcon(restaurant.category)}</span>
            {categoryDisplayNames[restaurant.category]}
          </p>

          <div className="flex items-center justify-between text-sm mb-3">
            <div className="flex items-center text-gray-500 bg-gray-50 px-3 py-2 rounded-full">
              <MdAccessTime className="mr-2" size={16} />
              <span className="font-medium">{restaurant.estimatedDeliveryTime}</span>
            </div>
            
            <div className="flex items-center">
              <MdDeliveryDining className="mr-2 text-primary-500" size={18} />
              <span className="font-bold text-gray-900">
                {restaurant.deliveryFee === 0 ? 'Grátis' : `R$ ${restaurant.deliveryFee.toFixed(2)}`}
              </span>
            </div>
          </div>

          {/* Minimum Order Value */}
          {restaurant.minimumOrder && (
            <div className="text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-full inline-block">
              Pedido mínimo: R$ {restaurant.minimumOrder.toFixed(2)}
            </div>
          )}
        </div>
      </div>
    </Link>
  );

  const CategoryCard = ({ category }: { category: RestaurantCategory }) => {
    // Cores específicas para cada categoria
    const getCategoryColors = (cat: RestaurantCategory) => {
      const colorMap = {
        italian: 'from-red-50 to-red-100 border-red-200 hover:border-red-300 text-red-600',
        chinese: 'from-yellow-50 to-yellow-100 border-yellow-200 hover:border-yellow-300 text-yellow-600',
        japanese: 'from-pink-50 to-pink-100 border-pink-200 hover:border-pink-300 text-pink-600',
        indian: 'from-orange-50 to-orange-100 border-orange-200 hover:border-orange-300 text-orange-600',
        mexican: 'from-green-50 to-green-100 border-green-200 hover:border-green-300 text-green-600',
        american: 'from-blue-50 to-blue-100 border-blue-200 hover:border-blue-300 text-blue-600',
        mediterranean: 'from-teal-50 to-teal-100 border-teal-200 hover:border-teal-300 text-teal-600',
        thai: 'from-purple-50 to-purple-100 border-purple-200 hover:border-purple-300 text-purple-600',
        french: 'from-indigo-50 to-indigo-100 border-indigo-200 hover:border-indigo-300 text-indigo-600',
        middle_eastern: 'from-amber-50 to-amber-100 border-amber-200 hover:border-amber-300 text-amber-600',
        fast_food: 'from-red-50 to-red-100 border-red-200 hover:border-red-300 text-red-600',
        other: 'from-gray-50 to-gray-100 border-gray-200 hover:border-gray-300 text-gray-600'
      };
      return colorMap[cat] || colorMap.other;
    };
    
    return (
      <Link 
        href={`/customer/category/${category}`}
        className="group block transform transition-all duration-300 hover:scale-105"
      >
        <div className={`bg-gradient-to-br ${getCategoryColors(category)} rounded-2xl p-4 md:p-6 border-2 hover:shadow-xl transition-all duration-300 group-hover:-translate-y-1 min-h-[140px] flex flex-col justify-center`}>
          <div className="text-center">
            <div className="text-3xl md:text-4xl mb-2 md:mb-3 group-hover:scale-110 transition-transform duration-300 filter drop-shadow-sm">
              {getCategoryIcon(category)}
            </div>
            <h3 className="font-bold text-gray-900 mb-1 text-sm md:text-base group-hover:text-primary-700 transition-colors duration-300 leading-tight">
              {categoryDisplayNames[category]}
            </h3>
          </div>
        </div>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-[#101828]">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary-600 via-primary-700 to-primary-800">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 py-12">
          {/* Header Content */}
          <div className="text-center mb-12">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 leading-tight">
              Sabor que 
              <span className="bg-gradient-to-r from-green-400 to-green-500 bg-clip-text text-transparent"> conecta</span>
            </h1>
            <p className="text-xl text-white mb-8 max-w-2xl mx-auto">
              Descubra os melhores restaurantes da sua região e tenha uma experiência gastronômica única
            </p>
            

          </div>

          {/* Search Section */}
          <div className="max-w-4xl mx-auto">
            <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-6 shadow-2xl border border-white/20">
              {/* Search Bar */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                  <MdSearch className="text-gray-400" size={24} />
                </div>
                <input
                  type="text"
                  placeholder="Buscar restaurantes pelo nome..."
                  value={filters.searchTerm}
                  onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                  onKeyDown={handleSearchKeyDown}
                  className="w-full pl-16 pr-6 py-4 bg-gray-50 border-0 rounded-2xl focus:bg-white focus:ring-2 focus:ring-primary-500 focus:outline-none transition-all duration-300 text-gray-900 placeholder-gray-400 text-lg"
                />
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4 animate-spin">
              <MdRestaurant className="text-primary-600" size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Carregando restaurantes...</h3>
            <p className="text-gray-600">Preparando as melhores opções para você</p>
          </div>
        ) : (
          <>
            {/* Categories Section */}
            {allCategories.length > 0 && (
              <section className="mb-20">
                <div className="text-center mb-12">
                  <h2 className="text-4xl font-bold text-white mb-4">Todas as Categorias</h2>
                  <p className="text-xl text-white max-w-2xl mx-auto">Descubra os sabores que mais combinam com você. Clique em uma categoria e explore todos os restaurantes disponíveis.</p>
                </div>
                
                {/* Categories Grid - Showing all categories */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6">
                  {allCategories.map((category) => (
                    <CategoryCard key={category} category={category} />
                  ))}
                </div>

              </section>
            )}

            {/* Search Results Section */}
            <div id="search-results">
              {filters.searchTerm ? (
                // Mostrar resultados da busca
                <section className="mb-16">
                  <div className="mb-8">
                    <h2 className="text-3xl font-bold text-white mb-2">
                      Resultados para "{filters.searchTerm}"
                    </h2>
                    <p className="text-white text-lg">
                      {filteredRestaurants.length} restaurante{filteredRestaurants.length !== 1 ? 's' : ''} encontrado{filteredRestaurants.length !== 1 ? 's' : ''}
                    </p>
                  </div>

                  {filteredRestaurants.length === 0 ? (
                    <div className="text-center py-20">
                      <div className="text-8xl mb-6">🔍</div>
                      <h3 className="text-2xl font-bold text-white mb-4">Nenhum restaurante encontrado</h3>
                      <p className="text-gray-300 text-lg">Tente buscar por outro nome de restaurante</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                      {filteredRestaurants.map((restaurant) => (
                        <RestaurantCard key={restaurant.id} restaurant={restaurant} />
                      ))}
                    </div>
                  )}
                </section>
              ) : (
                // Mostrar restaurantes por categoria (quando não há busca)
                categoriesWithRestaurants.map((category) => {
                  const categoryRestaurants = restaurantsByCategory[category];
                  if (categoryRestaurants.length === 0) return null;

                  return (
                    <section key={category} className="mb-16">
                      <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center">
                          <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-2xl p-4 mr-6">
                            <div className="text-primary-600 text-3xl">
                              {getCategoryIcon(category)}
                            </div>
                          </div>
                          <div>
                            <h2 className="text-3xl font-bold text-gray-900 mb-1">{categoryDisplayNames[category]}</h2>
                            <p className="text-gray-600 text-lg">{categoryRestaurants.length} restaurante{categoryRestaurants.length > 1 ? 's' : ''} disponível{categoryRestaurants.length > 1 ? 'is' : ''}</p>
                          </div>
                        </div>
                        
                        <Link 
                          href={`/customer/category/${category}`}
                          className="flex items-center text-primary-600 hover:text-primary-700 font-bold transition-colors duration-200 bg-primary-50 hover:bg-primary-100 px-6 py-3 rounded-2xl"
                        >
                          Ver todos
                          <MdKeyboardArrowRight size={24} />
                        </Link>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {categoryRestaurants.slice(0, 4).map((restaurant) => (
                          <RestaurantCard key={restaurant.id} restaurant={restaurant} />
                        ))}
                      </div>
                    </section>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-gray-900 to-gray-800 text-white mt-20">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="md:col-span-2">
              <h3 className="font-bold text-2xl mb-6 bg-gradient-to-r from-primary-400 to-primary-300 bg-clip-text text-transparent">
                Zip Food
              </h3>
              <p className="text-gray-300 text-lg mb-6 leading-relaxed">
                Conectando você aos melhores sabores da sua cidade. Descubra, peça e saboreie com a facilidade que você merece.
              </p>
              <div className="flex space-x-6">
                <a href="#" className="text-gray-400 hover:text-primary-400 transition-colors duration-200 transform hover:scale-110">
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-primary-400 transition-colors duration-200 transform hover:scale-110">
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"/>
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-primary-400 transition-colors duration-200 transform hover:scale-110">
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.404-5.956 1.404-5.956s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.347-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24.009c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001.029 12.017.001z"/>
                  </svg>
                </a>
              </div>
            </div>
            
            <div>
              <h3 className="font-bold text-lg mb-6">Para Restaurantes</h3>
              <ul className="space-y-4">
                <li><Link href="/restaurant" className="text-gray-300 hover:text-primary-400 transition-colors duration-200">Cadastre seu restaurante</Link></li>
                <li><Link href="/restaurant" className="text-gray-300 hover:text-primary-400 transition-colors duration-200">Portal do Parceiro</Link></li>
                <li><Link href="#" className="text-gray-300 hover:text-primary-400 transition-colors duration-200">Central de Ajuda</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-bold text-lg mb-6">Contato</h3>
              <ul className="space-y-4">
                <li><Link href="#" className="text-gray-300 hover:text-primary-400 transition-colors duration-200">Fale conosco</Link></li>
                <li><Link href="#" className="text-gray-300 hover:text-primary-400 transition-colors duration-200">Suporte</Link></li>
                <li><Link href="#" className="text-gray-300 hover:text-primary-400 transition-colors duration-200">Termos de Uso</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-700 mt-12 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-400 mb-4 md:mb-0 text-lg">
                © 2024 Zip Food. Todos os direitos reservados.
              </p>
              <p className="text-gray-400">
                Feito com ❤️ para conectar sabores
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}