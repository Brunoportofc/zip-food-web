import React from 'react';
import { FaPizzaSlice, FaHamburger, FaWineGlassAlt, FaIceCream, FaCoffee, FaFish, FaCarrot, FaUtensils, FaBirthdayCake, FaDrumstickBite, FaHotdog, FaStarOfDavid } from 'react-icons/fa';
import { GiNoodles, GiSushis, GiTacos, GiCupcake, GiDonerKebab, GiChopsticks, GiFrenchFries, GiSandwich, GiSlicedBread, GiCakeSlice } from 'react-icons/gi';
import { MdBrunchDining } from 'react-icons/md';
import { RestaurantCategory } from '@/types';

/**
 * Constantes para imagens e outros recursos estáticos
 */
export const images = {
  logo: '/next.svg',
  file: '/file.svg',
  globe: '/globe.svg',
  window: '/window.svg',
};

/**
 * Configuração das categorias de restaurantes com ícones e cores
 */
export const categoryConfig: Record<RestaurantCategory, { icon: React.ReactElement; color: string }> = {
  pizza: { icon: React.createElement(FaPizzaSlice, { size: 24 }), color: 'bg-orange-100 text-orange-600' },
  hamburger: { icon: React.createElement(FaHamburger, { size: 24 }), color: 'bg-amber-100 text-amber-600' },
  japonesa: { icon: React.createElement(GiSushis, { size: 24 }), color: 'bg-red-100 text-red-500' },
  italiana: { icon: React.createElement(GiNoodles, { size: 24 }), color: 'bg-green-100 text-green-700' },
  saudavel: { icon: React.createElement(FaCarrot, { size: 24 }), color: 'bg-green-100 text-green-600' },
  falafel: { icon: React.createElement(GiDonerKebab, { size: 24 }), color: 'bg-amber-100 text-amber-700' },
  hummus: { icon: React.createElement(FaUtensils, { size: 24 }), color: 'bg-yellow-100 text-yellow-600' },
  shawarma: { icon: React.createElement(GiDonerKebab, { size: 24 }), color: 'bg-orange-100 text-orange-700' },
  sabich: { icon: React.createElement(GiSandwich, { size: 24 }), color: 'bg-purple-100 text-purple-600' },
  shakshuka: { icon: React.createElement(MdBrunchDining, { size: 24 }), color: 'bg-red-100 text-red-700' },
  kosher: { icon: React.createElement(FaStarOfDavid, { size: 24 }), color: 'bg-blue-100 text-blue-700' },
  bourekas: { icon: React.createElement(GiSlicedBread, { size: 24 }), color: 'bg-amber-100 text-amber-800' }
};

/**
 * Constantes de tempo e configurações de entrega
 */
export const deliveryConfig = {
  defaultDeliveryTime: '25-35 min',
  freeDeliveryMinimum: 30,
  promotionalMessage: 'Entrega Grátis em Pedidos Acima de R$ 30! 🚀',
  promotionalSubtext: 'Válido até o final do mês'
};

/**
 * Constantes de UI e layout
 */
export const uiConfig = {
  maxRestaurantsInCarousel: 5,
  categoriesPerRow: {
    mobile: 4,
    tablet: 6,
    desktop: 8,
    large: 10
  },
  defaultAddress: 'Rua das Flores, 123 - Centro'
};