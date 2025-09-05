'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { ComponentType } from 'react';

// Loading component otimizado
const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-4">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
  </div>
);

// Lazy loading para AnimatedContainer
export const LazyAnimatedContainer = dynamic(
  () => import('./AnimatedContainer'),
  {
    loading: () => <LoadingSpinner />,
    ssr: false // Desabilita SSR para componentes com animações
  }
);

// Lazy loading para RestaurantCarousel
export const LazyRestaurantCarousel = dynamic(
  () => import('./RestaurantCarousel'),
  {
    loading: () => <LoadingSpinner />,
    ssr: false
  }
);

// Lazy loading para NotificationSystem
export const LazyNotificationSystem = dynamic(
  () => import('./NotificationSystem'),
  {
    loading: () => <LoadingSpinner />,
    ssr: true // Mantém SSR para notificações críticas
  }
);

// Lazy loading para OfflineToggle
export const LazyOfflineToggle = dynamic(
  () => import('./OfflineToggle'),
  {
    loading: () => <LoadingSpinner />,
    ssr: false
  }
);

// HOC para lazy loading genérico
export function withLazyLoading<T extends object>(
  importFn: () => Promise<{ default: ComponentType<T> }>,
  options: {
    ssr?: boolean;
    loading?: ComponentType;
  } = {}
) {
  return dynamic(importFn, {
    loading: options.loading ? () => React.createElement(options.loading!) : LoadingSpinner,
    ssr: options.ssr ?? true
  });
}

// Preload function para componentes críticos
export const preloadCriticalComponents = () => {
  // Preload apenas componentes que serão usados imediatamente
  import('./AnimatedContainer');
  import('./CustomButton');
  import('./CustomInput');
};

// Preload function para componentes secundários
export const preloadSecondaryComponents = () => {
  setTimeout(() => {
    import('./RestaurantCarousel');
    import('./NotificationSystem');
    import('./OfflineToggle');
  }, 1000); // Delay de 1 segundo
};