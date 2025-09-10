'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FaStore, 
  FaUtensils, 
  FaClock, 
  FaCreditCard, 
  FaMapMarkerAlt, 
  FaCheck, 
  FaArrowRight,
  FaChevronRight,
  FaExclamationTriangle
} from 'react-icons/fa';
import { MdSettings, MdDashboard } from 'react-icons/md';
import restaurantConfigService from '../../../services/restaurant-config.service';
import { RestaurantConfiguration } from '../../../types/restaurant-config';

interface SetupStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  completed: boolean;
  route: string;
}

export default function RestaurantSetupPage() {
  const router = useRouter();
  const [config, setConfig] = useState<RestaurantConfiguration | null>(null);
  const [progress, setProgress] = useState({ completed: 0, total: 8, steps: [] });
  const [loading, setLoading] = useState(true);
  const [currentRestaurantId] = useState('rest-1'); // Simulando ID do restaurante logado

  useEffect(() => {
    loadRestaurantData();
  }, []);

  const loadRestaurantData = async () => {
    try {
      setLoading(true);
      const [configData, progressData] = await Promise.all([
        restaurantConfigService.getRestaurantConfig(currentRestaurantId),
        restaurantConfigService.getConfigurationProgress(currentRestaurantId)
      ]);
      
      setConfig(configData);
      setProgress(progressData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupSteps: SetupStep[] = [
    {
      id: 'basic-info',
      title: 'Dados Básicos',
      description: 'Nome, categoria e descrição do restaurante',
      icon: <FaStore className="text-primary" />,
      completed: progress.steps.find(s => s.name === 'Dados básicos')?.completed || false,
      route: '/restaurant/setup/basic-info'
    },
    {
      id: 'address',
      title: 'Endereço',
      description: 'Localização e dados de contato',
      icon: <FaMapMarkerAlt className="text-primary" />,
      completed: progress.steps.find(s => s.name === 'Endereço')?.completed || false,
      route: '/restaurant/setup/address'
    },
    {
      id: 'documents',
      title: 'Documentação',
      description: 'CNPJ e licenças necessárias',
      icon: <MdSettings className="text-primary" />,
      completed: progress.steps.find(s => s.name === 'Documentos')?.completed || false,
      route: '/restaurant/setup/documents'
    },
    {
      id: 'hours',
      title: 'Horários de Funcionamento',
      description: 'Defina quando seu restaurante estará aberto',
      icon: <FaClock className="text-primary" />,
      completed: progress.steps.find(s => s.name === 'Horários')?.completed || false,
      route: '/restaurant/setup/hours'
    },
    {
      id: 'payments',
      title: 'Métodos de Pagamento',
      description: 'Formas de pagamento aceitas',
      icon: <FaCreditCard className="text-primary" />,
      completed: progress.steps.find(s => s.name === 'Pagamentos')?.completed || false,
      route: '/restaurant/setup/payments'
    },
    {
      id: 'delivery',
      title: 'Áreas de Entrega',
      description: 'Defina onde você entrega e as taxas',
      icon: <FaMapMarkerAlt className="text-primary" />,
      completed: progress.steps.find(s => s.name === 'Áreas de entrega')?.completed || false,
      route: '/restaurant/setup/delivery'
    },
    {
      id: 'menu',
      title: 'Cardápio',
      description: 'Adicione produtos e organize seu menu',
      icon: <FaUtensils className="text-primary" />,
      completed: progress.steps.find(s => s.name === 'Cardápio')?.completed || false,
      route: '/restaurant/setup/menu'
    }
  ];

  const completionPercentage = Math.round((progress.completed / progress.total) * 100);
  const isFullyConfigured = progress.completed === progress.total;

  const handleStepClick = (step: SetupStep) => {
    router.push(step.route);
  };

  const handleFinishSetup = () => {
    router.push('/restaurant/dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando configurações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-gray-900">ZipFood</h1>
              </div>
              <div className="hidden md:block">
                <div className="ml-10 flex items-baseline space-x-4">
                  <span className="text-gray-500">Configuração do Restaurante</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {config?.displayName && (
                <span className="text-sm text-gray-600">{config.displayName}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Overview */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {isFullyConfigured ? 'Configuração Concluída!' : 'Configure seu Restaurante'}
              </h2>
              <p className="text-gray-600">
                {isFullyConfigured 
                  ? 'Seu restaurante está pronto para receber pedidos!' 
                  : 'Complete todas as etapas para ativar seu restaurante na plataforma'
                }
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-primary mb-1">
                {completionPercentage}%
              </div>
              <div className="text-sm text-gray-500">
                {progress.completed} de {progress.total} etapas
              </div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
            <div 
              className="bg-primary h-3 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${completionPercentage}%` }}
            ></div>
          </div>

          {isFullyConfigured && (
            <div className="bg-success/10 border border-success/20 rounded-lg p-4 mb-4">
              <div className="flex items-center">
                <FaCheck className="text-success mr-3" />
                <div>
                  <p className="text-success font-medium">Configuração completa!</p>
                  <p className="text-success/80 text-sm">Seu restaurante está pronto para operar.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Setup Steps */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {setupSteps.map((step) => (
            <div
              key={step.id}
              onClick={() => handleStepClick(step)}
              className={`card card-hover cursor-pointer transition-all duration-200 ${
                step.completed 
                  ? 'border-success/30 bg-success/5' 
                  : 'border-gray-200 hover:border-primary/30'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${
                    step.completed ? 'bg-success/20' : 'bg-gray-100'
                  }`}>
                    {step.completed ? (
                      <FaCheck className="text-success" size={20} />
                    ) : (
                      step.icon
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {step.title}
                    </h3>
                  </div>
                </div>
                <FaChevronRight className="text-gray-400" size={16} />
              </div>
              
              <p className="text-gray-600 text-sm mb-4">
                {step.description}
              </p>
              
              <div className="flex items-center justify-between">
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                  step.completed 
                    ? 'bg-success/20 text-success' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {step.completed ? 'Concluído' : 'Pendente'}
                </span>
                <FaArrowRight className="text-primary opacity-0 group-hover:opacity-100 transition-opacity" size={14} />
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          {isFullyConfigured ? (
            <button
              onClick={handleFinishSetup}
              className="btn btn-primary px-8 py-3 text-lg"
            >
              <MdDashboard className="mr-2" />
              Ir para o Dashboard
            </button>
          ) : (
            <div className="text-center">
              <div className="bg-warning/10 border border-warning/20 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-center">
                  <FaExclamationTriangle className="text-warning mr-3" />
                  <div>
                    <p className="text-warning font-medium">Configuração incompleta</p>
                    <p className="text-warning/80 text-sm">Complete todas as etapas para ativar seu restaurante.</p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  const nextStep = setupSteps.find(step => !step.completed);
                  if (nextStep) handleStepClick(nextStep);
                }}
                className="btn btn-primary px-8 py-3"
              >
                Continuar Configuração
                <FaArrowRight className="ml-2" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}