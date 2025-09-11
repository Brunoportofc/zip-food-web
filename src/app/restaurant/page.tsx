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
      const isConfigured = await restaurantConfigService.isRestaurantConfigured(user!.id);
      
      if (!isConfigured) {
        router.push('/restaurant/cadastro');
        return;
      }

      const restaurantConfig = await restaurantConfigService.getRestaurantConfig(user!.id);

      // Redireciona baseado no status do restaurante
      if (!restaurantConfig) {
        router.push('/restaurant/cadastro');
        return;
      }

      switch (restaurantConfig.approvalStatus) {
        case 'approved':
          router.push('/restaurant/dashboard');
          break;
        case 'pending':
        case 'under-review':
          router.push('/restaurant/aprovacao');
          break;
        case 'rejected':
          router.push('/restaurant/cadastro');
          break;
        default:
          router.push('/restaurant/cadastro');
      }
    } catch (error) {
      console.error('Erro ao verificar status do restaurante:', error);
      router.push('/restaurant/cadastro');
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