'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MdSearch, MdLocationOn, MdLocalOffer, MdStar, MdAccessTime } from 'react-icons/md';
import RestaurantCarousel from '@/components/RestaurantCarousel';
import { Restaurant, RestaurantCategory, categoryDisplayNames } from '@/types';
import restaurantService from '@/services/restaurant.service';
import { categoryConfig, deliveryConfig, uiConfig } from '@/constants';

export default function CustomerDashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentAddress] = useState(uiConfig.defaultAddress);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);

  // Carregar restaurantes
  useEffect(() => {
    const loadRestaurants = async () => {
      try {
        setLoading(true);
        const data = await restaurantService.getAll();
        setRestaurants(data);
      } catch (error) {
        console.error('Erro ao carregar restaurantes:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRestaurants();
  }, []);

  // Separar restaurantes por categoria
  const promotedRestaurants = restaurants.filter(r => r.isPromoted);
  const fastFoodRestaurants = restaurants.filter(r => r.category === 'fast_food');
  const pizzaRestaurants = restaurants.filter(r => r.category === 'italian');
  const allRestaurants = restaurants;

  // Gerar lista de categorias disponíveis
  const availableCategories = Object.keys(categoryDisplayNames) as RestaurantCategory[];

  return (
    <div className="min-h-screen bg-white">

      {/* Hero Section */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-4 lg:py-6">
          {/* Localização e Saudação */}
          <div className="flex items-center justify-between mb-4 lg:mb-6">
            <div>
              <h1 className="text-xl lg:text-2xl font-bold text-black mb-1 lg:mb-2">Olá! 👋</h1>
              <div className="flex items-center text-gray-600">
                <MdLocationOn className="mr-1 lg:mr-2 text-red-600" size={16} />
                <span className="text-xs lg:text-sm font-medium truncate max-w-48 lg:max-w-none">{currentAddress}</span>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <div className="text-right">
                <p className="text-xs text-gray-500">Entrega em</p>
                <p className="text-sm font-semibold text-black">{deliveryConfig.defaultDeliveryTime}</p>
              </div>
            </div>
          </div>
          
          {/* Search Bar */}
          <div className="card mb-6 lg:mb-8">
            <div className="flex items-center space-x-4">
              <MdSearch className="text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Buscar restaurantes, pratos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 outline-none text-lg border-none focus:ring-0"
              />
            </div>
          </div>

          {/* Categories */}
          <div className="mb-6 lg:mb-8">
            <h2 className="text-lg lg:text-xl font-bold text-black mb-4 lg:mb-6">Categorias</h2>
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3 lg:gap-4">
              {availableCategories.map((category) => {
                const config = categoryConfig[category];
                return (
                  <Link
                    key={category}
                    href={`/customer/category/${category}`}
                    className="flex flex-col items-center group hover:scale-105 transition-transform duration-200"
                  >
                    <div className="w-12 h-12 lg:w-16 lg:h-16 rounded-2xl bg-red-50 flex items-center justify-center mb-2 lg:mb-3 shadow-sm group-hover:shadow-md group-hover:bg-red-100 transition-all duration-200">
                      <div className="text-red-600 group-hover:text-red-700 text-lg lg:text-xl">
                        {config.icon}
                      </div>
                    </div>
                    <span className="text-xs font-medium text-black text-center leading-tight">
                      {categoryDisplayNames[category]}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Promotional Banner */}
          <div className="card bg-gradient-to-br from-red-500 via-red-600 to-red-700 text-white relative overflow-hidden mb-6 lg:mb-8">
            <div className="absolute inset-0 bg-black/10 rounded-2xl lg:rounded-3xl"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3 lg:mb-4">
                <div className="flex items-center">
                  <div className="bg-white/20 rounded-full p-1.5 lg:p-2 mr-2 lg:mr-3">
                    <MdLocalOffer className="text-white" size={20} />
                  </div>
                  <span className="font-bold text-base lg:text-lg">Oferta Especial</span>
                </div>
                <div className="text-2xl lg:text-4xl animate-bounce">🎉</div>
              </div>
              <h2 className="text-lg lg:text-2xl font-bold mb-2 leading-tight">{deliveryConfig.promotionalMessage}</h2>
              <p className="text-red-100 font-medium text-sm lg:text-base">{deliveryConfig.promotionalSubtext}</p>
              <div className="mt-3 lg:mt-4">
                <button className="bg-white text-red-600 px-4 lg:px-6 py-2 rounded-full font-bold text-xs lg:text-sm hover:bg-red-50 transition-colors duration-200">
                  Ver Ofertas
                </button>
              </div>
            </div>
            <div className="absolute -right-6 lg:-right-8 -bottom-6 lg:-bottom-8 w-24 h-24 lg:w-32 lg:h-32 bg-white/10 rounded-full"></div>
            <div className="absolute -right-3 lg:-right-4 -top-3 lg:-top-4 w-16 h-16 lg:w-20 lg:h-20 bg-white/5 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Restaurant Carousels */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        {/* Últimas lojas */}
        <div className="mb-8 lg:mb-10">
          <div className="flex items-center justify-between mb-4 lg:mb-6">
            <div className="flex items-center">
              <div className="bg-red-100 rounded-full p-1.5 lg:p-2 mr-2 lg:mr-3">
                <span className="text-red-600 text-lg lg:text-xl">🏪</span>
              </div>
              <h2 className="text-lg lg:text-2xl font-bold text-black">Últimas Lojas</h2>
            </div>
            <button className="bg-red-600 text-white px-3 lg:px-4 py-1.5 lg:py-2 rounded-full text-xs lg:text-sm font-medium hover:bg-red-700 transition-colors duration-200">
              Ver Mais
            </button>
          </div>
          
          {loading ? (
            <div className="flex space-x-3 lg:space-x-4">
              {[...Array(uiConfig.maxRestaurantsInCarousel)].map((_, i) => (
                <div key={i} className="flex-shrink-0 w-32 lg:w-36">
                  <div className="bg-gray-200 animate-pulse rounded-lg h-20 lg:h-24 mb-2"></div>
                  <div className="bg-gray-200 animate-pulse rounded h-4 mb-1"></div>
                  <div className="bg-gray-200 animate-pulse rounded h-3"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex overflow-x-auto space-x-3 lg:space-x-4 pb-2 -mx-4 px-4">
              {allRestaurants.slice(0, uiConfig.maxRestaurantsInCarousel).map((restaurant) => (
                <div key={restaurant.id} className="flex-shrink-0 w-32 lg:w-36">
                  <div className="card-hover cursor-pointer">
                    <div className="relative">
                      <img
                        src={restaurant.image}
                        alt={restaurant.name}
                        className="w-full h-20 lg:h-24 object-cover rounded-t-lg"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-1.5 lg:p-2">
                        <div className="flex items-center">
                          <MdStar className="text-yellow-400" size={10} />
                          <span className="text-xs font-medium text-white ml-0.5">
                            {restaurant.rating.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="p-1.5 lg:p-2">
                      <h3 className="font-medium text-xs lg:text-sm text-black truncate">
                        {restaurant.name}
                      </h3>
                      <p className="text-gray-500 text-xs">{categoryDisplayNames[restaurant.category]}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Promoted Restaurants */}
        {promotedRestaurants.length > 0 && (
          <div className="mb-8 lg:mb-10">
            <div className="flex items-center justify-between mb-4 lg:mb-6">
              <div className="flex items-center">
                <div className="bg-red-100 rounded-full p-1.5 lg:p-2 mr-2 lg:mr-3">
                  <span className="text-red-600 text-lg lg:text-xl">🔥</span>
                </div>
                <h2 className="text-lg lg:text-2xl font-bold text-black">Promoções Imperdíveis</h2>
            </div>
            <button className="bg-red-600 text-white px-3 lg:px-4 py-1.5 lg:py-2 rounded-full text-xs lg:text-sm font-medium hover:bg-red-700 transition-colors duration-200">
              Ver Mais
            </button>
            </div>
            <RestaurantCarousel
              restaurants={promotedRestaurants}
              title=""
            />
          </div>
        )}

        {/* Fast Food */}
        {fastFoodRestaurants.length > 0 && (
          <div className="mb-8 lg:mb-10">
            <div className="flex items-center justify-between mb-4 lg:mb-6">
              <div className="flex items-center">
                <div className="bg-red-100 rounded-full p-1.5 lg:p-2 mr-2 lg:mr-3">
                  <span className="text-red-600 text-lg lg:text-xl">🍔</span>
                </div>
                <h2 className="text-lg lg:text-2xl font-bold text-black">Fast Food</h2>
              </div>
              <button className="bg-red-600 text-white px-3 lg:px-4 py-1.5 lg:py-2 rounded-full text-xs lg:text-sm font-medium hover:bg-red-700 transition-colors duration-200">
                Ver Mais
              </button>
            </div>
            <RestaurantCarousel
              restaurants={fastFoodRestaurants}
              title=""
            />
          </div>
        )}

        {/* Pizza */}
        {pizzaRestaurants.length > 0 && (
          <div className="mb-8 lg:mb-10">
            <div className="flex items-center justify-between mb-4 lg:mb-6">
              <div className="flex items-center">
                <div className="bg-red-100 rounded-full p-1.5 lg:p-2 mr-2 lg:mr-3">
                  <span className="text-red-600 text-lg lg:text-xl">🍕</span>
                </div>
                <h2 className="text-lg lg:text-2xl font-bold text-black">Pizzarias</h2>
              </div>
              <button className="bg-red-600 text-white px-3 lg:px-4 py-1.5 lg:py-2 rounded-full text-xs lg:text-sm font-medium hover:bg-red-700 transition-colors duration-200">
                Ver Mais
              </button>
            </div>
            <RestaurantCarousel
              restaurants={pizzaRestaurants}
              title=""
            />
          </div>
        )}

        {/* All Restaurants */}
        <div className="mb-8 lg:mb-10">
          <div className="flex items-center justify-between mb-4 lg:mb-6">
            <div className="flex items-center">
              <div className="bg-red-100 rounded-full p-1.5 lg:p-2 mr-2 lg:mr-3">
                <span className="text-red-600 text-lg lg:text-xl">🍽️</span>
              </div>
              <h2 className="text-lg lg:text-2xl font-bold text-black">Todos os Restaurantes</h2>
            </div>
            <button className="bg-red-600 text-white px-3 lg:px-4 py-1.5 lg:py-2 rounded-full text-xs lg:text-sm font-medium hover:bg-red-700 transition-colors duration-200">
              Ver Mais
            </button>
          </div>
          <RestaurantCarousel
            restaurants={allRestaurants}
            title=""
          />
        </div>

        {/* Famosos no Zip Food */}
        <div className="mb-8 lg:mb-10">
          <div className="flex items-center justify-between mb-4 lg:mb-6">
            <div className="flex items-center">
              <div className="bg-red-100 rounded-full p-1.5 lg:p-2 mr-2 lg:mr-3">
                <span className="text-red-600 text-lg lg:text-xl">⭐</span>
              </div>
              <h2 className="text-lg lg:text-2xl font-bold text-black">Famosos no Zip Food</h2>
            </div>
            <button className="bg-red-600 text-white px-3 lg:px-4 py-1.5 lg:py-2 rounded-full text-xs lg:text-sm font-medium hover:bg-red-700 transition-colors duration-200">
              Ver Mais
            </button>
          </div>
          
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl lg:rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                  <div className="bg-gray-200 animate-pulse h-24 lg:h-32"></div>
                  <div className="p-3 lg:p-4">
                    <div className="bg-gray-200 animate-pulse rounded h-4 mb-2"></div>
                    <div className="bg-gray-200 animate-pulse rounded h-3 mb-3"></div>
                    <div className="flex justify-between">
                      <div className="bg-gray-200 animate-pulse rounded h-3 w-16"></div>
                      <div className="bg-gray-200 animate-pulse rounded h-3 w-12"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
              {allRestaurants.slice(0, 4).map((restaurant) => (
                <div key={restaurant.id} className="card card-hover overflow-hidden group cursor-pointer">
                  <div className="relative">
                    <img
                      src={restaurant.image}
                      alt={restaurant.name}
                      className="w-full h-24 lg:h-32 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {restaurant.isPromoted && (
                      <div className="absolute top-2 lg:top-3 left-2 lg:left-3 bg-primary text-white px-2 lg:px-3 py-0.5 lg:py-1 rounded-full text-xs font-bold shadow-lg">
                        Promoção
                      </div>
                    )}
                    <div className="absolute top-2 lg:top-3 right-2 lg:right-3 bg-white/90 backdrop-blur-sm rounded-full p-1">
                      <div className="flex items-center">
                        <MdStar className="text-accent mr-1" size={10} />
                        <span className="text-xs font-bold text-black">
                          {restaurant.rating.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="p-3 lg:p-4">
                    <h3 className="font-bold text-sm lg:text-base text-black mb-1 lg:mb-2 group-hover:text-primary transition-colors duration-200">
                      {restaurant.name}
                    </h3>
                    <p className="text-xs lg:text-sm text-gray-600 mb-2 lg:mb-3">{categoryDisplayNames[restaurant.category]}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-gray-500">
                        <MdAccessTime className="mr-1" size={12} />
                        <span className="text-xs lg:text-sm">{restaurant.estimatedDeliveryTime}</span>
                      </div>
                      <div className="text-primary font-bold text-xs lg:text-sm">
                        {restaurant.deliveryFee === 0 ? 'Grátis' : `R$ ${restaurant.deliveryFee.toFixed(2)}`}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 mt-8 lg:mt-12">
        <div className="max-w-7xl mx-auto px-4 py-8 lg:py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-8">
            <div>
              <h3 className="font-bold text-black mb-3 lg:mb-4 text-base lg:text-lg">Zip Food</h3>
              <ul className="space-y-2 lg:space-y-3">
                <li><Link href="#" className="text-gray-600 hover:text-red-600 text-sm transition-colors duration-200">Sobre nós</Link></li>
                <li><Link href="#" className="text-gray-600 hover:text-red-600 text-sm transition-colors duration-200">Carreiras</Link></li>
                <li><Link href="#" className="text-gray-600 hover:text-red-600 text-sm transition-colors duration-200">Imprensa</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-black mb-3 lg:mb-4 text-base lg:text-lg">Para Restaurantes</h3>
              <ul className="space-y-2 lg:space-y-3">
                <li><Link href="/restaurant" className="text-gray-600 hover:text-red-600 text-sm transition-colors duration-200">Cadastre seu restaurante</Link></li>
                <li><Link href="/restaurant" className="text-gray-600 hover:text-red-600 text-sm transition-colors duration-200">Portal do Parceiro</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-black mb-3 lg:mb-4 text-base lg:text-lg">Para Entregadores</h3>
              <ul className="space-y-2 lg:space-y-3">
                <li><Link href="/delivery" className="text-gray-600 hover:text-red-600 text-sm transition-colors duration-200">Seja um entregador</Link></li>
                <li><Link href="/delivery" className="text-gray-600 hover:text-red-600 text-sm transition-colors duration-200">Central do Entregador</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-black mb-3 lg:mb-4 text-base lg:text-lg">Contato</h3>
              <ul className="space-y-2 lg:space-y-3">
                <li><Link href="#" className="text-gray-600 hover:text-red-600 text-sm transition-colors duration-200">Ajuda</Link></li>
                <li><Link href="#" className="text-gray-600 hover:text-red-600 text-sm transition-colors duration-200">Fale conosco</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-100 mt-6 lg:mt-8 pt-6 lg:pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-600 text-sm mb-4 md:mb-0">
                © 2024 Zip Food. Todos os direitos reservados.
              </p>
              <div className="flex space-x-4 lg:space-x-6">
                <a href="#" className="text-gray-400 hover:text-red-600 transition-colors duration-200">
                  <svg className="w-5 h-5 lg:w-6 lg:h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-red-600 transition-colors duration-200">
                  <svg className="w-5 h-5 lg:w-6 lg:h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-red-600 transition-colors duration-200">
                  <svg className="w-5 h-5 lg:w-6 lg:h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
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