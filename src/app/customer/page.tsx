'use client';

import { useState, useEffect } from 'react';
import { MdSearch, MdLocationOn, MdLocalOffer, MdStar, MdAccessTime, MdFastfood, MdLocalPizza, MdIcecream, MdRestaurant, MdBrunchDining } from 'react-icons/md';
import { FaPizzaSlice, FaHamburger, FaWineGlassAlt, FaIceCream, FaCoffee, FaFish, FaCarrot, FaUtensils, FaBirthdayCake, FaDrumstickBite, FaHotdog, FaStarOfDavid } from 'react-icons/fa';
import { GiNoodles, GiSushis, GiTacos, GiCupcake, GiDonerKebab, GiChopsticks, GiFrenchFries, GiSandwich, GiSlicedBread, GiCakeSlice } from 'react-icons/gi';
import { BiSolidDrink, BiSolidCoffee } from 'react-icons/bi';
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
  { id: '1', name: 'Lanches', icon: <FaHamburger size={24} />, color: 'bg-amber-100 text-amber-600' },
  { id: '2', name: 'Promoções', icon: <MdLocalOffer size={24} />, color: 'bg-red-100 text-red-600' },
  { id: '3', name: 'Pizza', icon: <FaPizzaSlice size={24} />, color: 'bg-orange-100 text-orange-600' },
  { id: '4', name: 'Japonesa', icon: <GiSushis size={24} />, color: 'bg-red-100 text-red-500' },
  { id: '5', name: 'Doces & Bolos', icon: <GiCakeSlice size={24} />, color: 'bg-pink-100 text-pink-600' },
  { id: '6', name: 'Brasileira', icon: <FaDrumstickBite size={24} />, color: 'bg-yellow-100 text-yellow-600' },
  { id: '7', name: 'Açaí', icon: <FaIceCream size={24} />, color: 'bg-purple-100 text-purple-600' },
  { id: '8', name: 'Árabe', icon: <GiDonerKebab size={24} />, color: 'bg-amber-100 text-amber-700' },
  { id: '9', name: 'Chinesa', icon: <GiChopsticks size={24} />, color: 'bg-red-100 text-red-700' },
  { id: '10', name: 'Sorvetes', icon: <MdIcecream size={24} />, color: 'bg-blue-100 text-blue-500' },
  { id: '11', name: 'Italiana', icon: <GiNoodles size={24} />, color: 'bg-green-100 text-green-700' },
  { id: '12', name: 'Padarias', icon: <GiSlicedBread size={24} />, color: 'bg-amber-100 text-amber-800' },
  { id: '13', name: 'Carnes', icon: <MdBrunchDining size={24} />, color: 'bg-red-100 text-red-800' },
  { id: '14', name: 'Vegetariana', icon: <FaCarrot size={24} />, color: 'bg-green-100 text-green-600' },
  { id: '15', name: 'Gourmet', icon: <FaUtensils size={24} />, color: 'bg-gray-100 text-gray-700' },
  { id: '16', name: 'Pastel', icon: <GiSandwich size={24} />, color: 'bg-yellow-100 text-yellow-700' },
  { id: '17', name: 'Marmita', icon: <MdRestaurant size={24} />, color: 'bg-orange-100 text-orange-700' },
  { id: '18', name: 'Salgados', icon: <GiFrenchFries size={24} />, color: 'bg-amber-100 text-amber-600' },
  { id: '19', name: 'Kosher', icon: <FaStarOfDavid size={24} />, color: 'bg-blue-100 text-blue-700' }
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
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          {/* Localização e Saudação */}
          <div className="flex items-center mb-4">
            <div>
              <h2 className="text-xl font-bold text-black mb-1">Olá! 👋</h2>
              <div className="flex items-center text-gray-600">
                <MdLocationOn className="mr-1" size={16} />
                <span className="text-sm">{currentAddress}</span>
              </div>
            </div>
          </div>
          
          {/* Search Bar */}
          <div className="relative mb-6">
            <MdSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-600" size={20} />
            <input
              type="text"
              placeholder="Busque por item ou loja"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-full focus:ring-1 focus:ring-red-500 focus:border-transparent shadow-sm placeholder-gray-600"
            />
          </div>

          {/* Categories */}
          <div className="mb-6">
            <h2 className="text-lg font-bold text-black mb-3">Categorias</h2>
            <div className="flex overflow-x-auto space-x-4 pb-2 -mx-4 px-4">
              {mockCategories.map((category) => (
                <button
                  key={category.id}
                  className="flex-shrink-0 flex flex-col items-center"
                >
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-1 shadow-sm ${category.color}`}>
                    <div className="flex items-center justify-center">
                      {category.icon}
                    </div>
                  </div>
                  <span className="text-xs font-medium text-gray-700">{category.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Promotional Banner */}
          <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl p-4 mb-6 text-white relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center mb-1">
                <MdLocalOffer className="mr-1" size={20} />
                <span className="font-semibold text-sm">Oferta Especial</span>
              </div>
              <h2 className="text-lg font-bold mb-1">Frete Grátis em pedidos acima de R$ 30! 🚀</h2>
              <p className="text-sm text-red-100">Válido até o final do mês. Aproveite!</p>
            </div>
            <div className="absolute right-4 top-4 text-4xl opacity-20">🎉</div>
          </div>
        </div>
      </div>

      {/* Restaurant Carousels */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        {/* Últimas lojas */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-black">Últimas lojas</h2>
            <button className="text-sm text-red-500 font-medium">Ver mais</button>
          </div>
          
          <div className="flex overflow-x-auto space-x-4 pb-2 -mx-4 px-4">
            {allRestaurants.slice(0, 5).map((restaurant) => (
              <div key={restaurant.id} className="flex-shrink-0 w-36">
                <div className="bg-white rounded-lg border border-gray-100 hover:border-gray-200 transition-all cursor-pointer">
                  <div className="relative">
                    <img
                      src={restaurant.image}
                      alt={restaurant.name}
                      className="w-full h-24 object-cover rounded-t-lg"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                      <div className="flex items-center">
                        <MdStar className="text-yellow-400" size={12} />
                        <span className="text-xs font-medium text-white ml-0.5">
                          {restaurant.rating.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="p-2">
                    <h3 className="font-medium text-sm text-black truncate">
                      {restaurant.name}
                    </h3>
                    <p className="text-gray-500 text-xs">{restaurant.category}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

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

        {/* Famosos no Zip Food */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-black">Famosos no Zip Food</h2>
            <button className="text-sm text-red-500 font-medium">Ver mais</button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {allRestaurants.slice(0, 4).map((restaurant) => (
              <div key={restaurant.id} className="bg-white rounded-lg border border-gray-100 hover:border-gray-200 transition-all cursor-pointer">
                <div className="relative">
                  <img
                    src={restaurant.image}
                    alt={restaurant.name}
                    className="w-full h-32 object-cover rounded-t-lg"
                  />
                  {restaurant.isPromoted && (
                    <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-0.5 rounded-sm text-xs font-medium">
                      Promoção
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <div className="flex items-center mb-1">
                    <h3 className="font-medium text-base text-black truncate">
                      {restaurant.name}
                    </h3>
                    <div className="flex items-center ml-auto">
                      <MdStar className="text-yellow-400" size={14} />
                      <span className="text-xs font-medium text-gray-800 ml-0.5">
                        {restaurant.rating.toFixed(1)}
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-500 text-xs mb-1">{restaurant.category}</p>
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center text-gray-500">
                      <MdAccessTime size={14} className="mr-0.5" />
                      <span>{restaurant.deliveryTime}</span>
                    </div>
                    <div className="text-red-500 font-medium">
                      {restaurant.deliveryFee === 0 ? 'Grátis' : `R$ ${restaurant.deliveryFee.toFixed(2)}`}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t mt-8">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {/* Coluna 1 - Zip Food */}
            <div>
              <h3 className="text-lg font-bold mb-4">Zip Food</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-600 hover:text-red-500 text-sm">Site Institucional</a></li>
                <li><a href="#" className="text-gray-600 hover:text-red-500 text-sm">Fale Conosco</a></li>
                <li><a href="#" className="text-gray-600 hover:text-red-500 text-sm">Conta e Segurança</a></li>
                <li><a href="#" className="text-gray-600 hover:text-red-500 text-sm">Carreiras</a></li>
                <li><a href="#" className="text-gray-600 hover:text-red-500 text-sm">Entregadores</a></li>
              </ul>
            </div>

            {/* Coluna 2 - Descubra */}
            <div>
              <h3 className="text-lg font-bold mb-4">Descubra</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-600 hover:text-red-500 text-sm">Cadastre seu Restaurante ou Mercado</a></li>
                <li><a href="#" className="text-gray-600 hover:text-red-500 text-sm">Zip Food Shop</a></li>
                <li><a href="#" className="text-gray-600 hover:text-red-500 text-sm">Zip Food Empresas</a></li>
                <li><a href="#" className="text-gray-600 hover:text-red-500 text-sm">Blog Zip Food Empresas</a></li>
              </ul>
            </div>

            {/* Coluna 3 - Social */}
            <div>
              <h3 className="text-lg font-bold mb-4">Social</h3>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-600 hover:text-red-500">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="#" className="text-gray-600 hover:text-red-500">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
                <a href="#" className="text-gray-600 hover:text-red-500">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="#" className="text-gray-600 hover:text-red-500">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {/* Linha de separação */}
          <div className="border-t border-gray-200 pt-6">
            <div className="flex flex-col md:flex-row md:justify-between">
              <div className="flex items-center mb-4 md:mb-0">
                <img src="/vercel.svg" alt="Zip Food Logo" className="h-6 w-6 mr-2" />
                <p className="text-sm text-gray-500">
                  © {new Date().getFullYear()} Zip Food - Todos os direitos reservados
                </p>
              </div>
              <div className="flex flex-wrap gap-4">
                <a href="#" className="text-xs text-gray-500 hover:text-red-500">Termos e condições de uso</a>
                <a href="#" className="text-xs text-gray-500 hover:text-red-500">Código de conduta</a>
                <a href="#" className="text-xs text-gray-500 hover:text-red-500">Privacidade</a>
                <a href="#" className="text-xs text-gray-500 hover:text-red-500">Dicas de segurança</a>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-4">
              CNPJ: 12.345.678/0001-21 / Avenida dos Autonomistas, nº 1234, Vila Yara, Osasco/SP - CEP 06020-902
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}