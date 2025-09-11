'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '@/store/auth.store';
import { restaurantConfigService } from '@/services/restaurant-config.service';
import { RestaurantConfiguration } from '@/types/restaurant-config';

const RestaurantPage = () => {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.type !== 'restaurant') {
      router.push('/auth/sign-in');
      return;
    }

    checkRestaurantStatus();
  }, [user, router]);

  const checkRestaurantStatus = async () => {
    try {
      // Simplificado: redireciona diretamente para o dashboard
      // A configuração inicial é assumida como feita no cadastro
      router.push('/restaurant/dashboard');
    } catch (error) {
      console.error('Erro ao redirecionar:', error);
      router.push('/restaurant/dashboard'); // Fallback para dashboard
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando status do restaurante...</p>
        </div>
      </div>
    );
  }

  // Esta página não deve ser renderizada, pois sempre redireciona
  return null;
};

export default RestaurantPage;