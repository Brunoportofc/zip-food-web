// src/app/restaurant/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
// CORREÇÃO: A importação agora é nomeada (com chaves)
import { useAuthStore } from '@/store/auth.store';
import { restaurantConfigService } from '@/services/restaurant-config.service';
import { RestaurantConfiguration } from '@/types/restaurant-config';
import RestaurantWizard from '@/components/RestaurantWizard';
import SuccessMessage from '@/components/SuccessMessage';
import WelcomeMessage from '@/components/WelcomeMessage';

const RestaurantPage = () => {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const [config, setConfig] = useState<RestaurantConfiguration | null>(null);
  const [isWizardComplete, setWizardComplete] = useState(false);
  const [isConfigLoading, setConfigLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/sign-in');
      return;
    }

    if (user && user.user_type === 'restaurant') {
      const fetchConfig = async () => {
        try {
          const fetchedConfig = await restaurantConfigService.getRestaurantConfig(user.id);
          setConfig(fetchedConfig);
          if (fetchedConfig && fetchedConfig.isConfigured) {
            setWizardComplete(true);
          }
        } catch (error) {
          console.error('Failed to fetch restaurant configuration:', error);
          // Redirecionar para registro se não houver configuração
          router.push('/restaurant/register');
        } finally {
          setConfigLoading(false);
        }
      };
      fetchConfig();
    }
  }, [user, isAuthenticated, isLoading, router]);

  const handleWizardComplete = (newConfig: RestaurantConfiguration) => {
    setConfig(newConfig);
    setWizardComplete(true);
  };

  if (isLoading || isConfigLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-lg">Carregando dados do restaurante...</p>
      </div>
    );
  }

  if (!config && !isWizardComplete) {
     return <RestaurantWizard onComplete={handleWizardComplete} />;
  }

  if (isWizardComplete) {
    return (
      <div className="container mx-auto p-4">
        <WelcomeMessage 
          restaurantName={config?.businessName || user?.name || 'Restaurante'} 
          onContinue={() => router.push('/restaurant/dashboard')} 
        />
      </div>
    );
  }

  return <RestaurantWizard onComplete={handleWizardComplete} />;
};

export default RestaurantPage;