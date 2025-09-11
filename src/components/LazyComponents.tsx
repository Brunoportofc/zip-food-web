'use client';

import dynamic from 'next/dynamic';

// Loading component simplificado
const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-4">
    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
  </div>
);

// Componentes lazy essenciais
export const LazyAnimatedContainer = dynamic(() => import('./AnimatedContainer'), {
  loading: () => <LoadingSpinner />,
  ssr: false
});

export const LazyRestaurantCarousel = dynamic(() => import('./RestaurantCarousel'), {
  loading: () => <LoadingSpinner />,
  ssr: false
});