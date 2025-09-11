'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import RestaurantWizard from '@/components/RestaurantWizard';
import RestaurantSummary from '@/components/RestaurantSummary';
import WelcomeMessage from '@/components/WelcomeMessage';
import { RestaurantConfiguration } from '@/types/restaurant-config';
import { restaurantConfigService } from '@/services/restaurant-config.service';

type FlowStep = 'wizard' | 'summary' | 'welcome';

const RestaurantCadastroPage: React.FC = () => {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<FlowStep>('wizard');
  const [restaurantData, setRestaurantData] = useState<RestaurantConfiguration | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleWizardComplete = (data: RestaurantConfiguration) => {
    setRestaurantData(data);
    setCurrentStep('summary');
  };

  const handleEditData = () => {
    setCurrentStep('wizard');
  };

  const handleConfirmData = async () => {
    if (!restaurantData) return;

    setIsSubmitting(true);
    try {
      // Salvar os dados do restaurante com status pendente
      const configWithStatus = {
        ...restaurantData,
        status: 'pending' as const,
        submittedAt: new Date().toISOString()
      };
      
      await restaurantConfigService.createRestaurantConfig(configWithStatus);
      
      // Redirecionar diretamente para o dashboard (aprovação automática)
      router.push('/restaurant/dashboard');
    } catch (error) {
      console.error('Erro ao salvar configuração do restaurante:', error);
      // Aqui você pode adicionar um sistema de notificação de erro
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWelcomeContinue = () => {
    // Redirecionar diretamente para o dashboard do restaurante
    router.push('/restaurant/dashboard');
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'wizard':
        return (
          <RestaurantWizard
            initialData={restaurantData}
            onComplete={handleWizardComplete}
          />
        );
      case 'summary':
        return (
          <RestaurantSummary
            data={restaurantData!}
            onEdit={handleEditData}
            onConfirm={handleConfirmData}
            isSubmitting={isSubmitting}
          />
        );
      case 'welcome':
        return (
          <WelcomeMessage
            restaurantName={restaurantData?.businessName || 'Seu Restaurante'}
            onContinue={handleWelcomeContinue}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {renderCurrentStep()}
    </div>
  );
};

export default RestaurantCadastroPage;