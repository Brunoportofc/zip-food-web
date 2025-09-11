'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaCheckCircle, FaClock, FaExclamationTriangle, FaFileAlt, FaStore, FaTruck } from 'react-icons/fa';
import useAuthStore from '@/store/auth.store';
import { restaurantConfigService } from '@/services/restaurant-config.service';
import { RestaurantConfiguration } from '@/types/restaurant-config';

interface ApprovalStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_review' | 'approved' | 'rejected';
  estimatedTime: string;
  icon: React.ReactNode;
  details?: string[];
}

const RestaurantApprovalPage = () => {
  const router = useRouter();
  const { user } = useAuthStore();
  const [config, setConfig] = useState<RestaurantConfiguration | null>(null);
  const [loading, setLoading] = useState(true);
  const [approvalSteps, setApprovalSteps] = useState<ApprovalStep[]>([]);

  useEffect(() => {
    if (!user || user.type !== 'restaurant') {
      router.push('/auth/sign-in');
      return;
    }

    loadRestaurantConfig();
  }, [user, router]);

  const loadRestaurantConfig = async () => {
    try {
      const restaurantConfig = await restaurantConfigService.getRestaurantConfig(user!.id);
      setConfig(restaurantConfig);

      // Simular processo de aprovação baseado no status atual
      if (restaurantConfig) {
        const steps = generateApprovalSteps(restaurantConfig);
        setApprovalSteps(steps);
      }
    } catch (error) {
      console.error('Erro ao carregar configuração:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateApprovalSteps = (config: RestaurantConfiguration): ApprovalStep[] => {
    const baseSteps: ApprovalStep[] = [
      {
        id: 'documentation',
        title: 'Análise de Documentação',
        description: 'Verificação de CNPJ, licenças sanitárias e documentos legais',
        status: 'approved',
        estimatedTime: '1-2 horas',
        icon: <FaFileAlt className="text-blue-500" />,
        details: [
          'CNPJ válido e ativo',
          'Licença sanitária em dia',
          'Alvará de funcionamento'
        ]
      },
      {
        id: 'business_info',
        title: 'Validação de Informações Comerciais',
        description: 'Verificação de dados do estabelecimento e categoria',
        status: config.approvalStatus === 'pending' ? 'in_review' : 'approved',
        estimatedTime: '30 minutos',
        icon: <FaStore className="text-green-500" />,
        details: [
          'Nome e categoria do restaurante',
          'Endereço e dados de contato',
          'Horários de funcionamento'
        ]
      },
      {
        id: 'logistics',
        title: 'Configuração Logística',
        description: 'Análise das áreas de entrega e configurações operacionais',
        status: config.approvalStatus === 'pending' ? 'pending' : 'in_review',
        estimatedTime: '1 hora',
        icon: <FaTruck className="text-orange-500" />,
        details: [
          'Áreas de entrega definidas',
          'Taxas e tempos de entrega',
          'Modalidades de atendimento'
        ]
      },
      {
        id: 'final_approval',
        title: 'Aprovação Final',
        description: 'Revisão completa e ativação da conta',
        status: config.approvalStatus === 'approved' ? 'approved' : 'pending',
        estimatedTime: '2-4 horas',
        icon: <FaCheckCircle className="text-green-600" />,
        details: [
          'Revisão final de todos os dados',
          'Ativação do perfil na plataforma',
          'Configuração do sistema de pagamentos'
        ]
      }
    ];

    return baseSteps;
  };

  const getStatusColor = (status: ApprovalStep['status']) => {
    switch (status) {
      case 'approved': return 'text-green-600 bg-green-100';
      case 'in_review': return 'text-blue-600 bg-blue-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: ApprovalStep['status']) => {
    switch (status) {
      case 'approved': return <FaCheckCircle className="text-green-600" />;
      case 'in_review': return <FaClock className="text-blue-600 animate-spin" />;
      case 'rejected': return <FaExclamationTriangle className="text-red-600" />;
      default: return <FaClock className="text-gray-400" />;
    }
  };

  const getStatusText = (status: ApprovalStep['status']) => {
    switch (status) {
      case 'approved': return 'Aprovado';
      case 'in_review': return 'Em Análise';
      case 'rejected': return 'Rejeitado';
      default: return 'Pendente';
    }
  };

  const getOverallProgress = () => {
    const approvedSteps = approvalSteps.filter(step => step.status === 'approved').length;
    return (approvedSteps / approvalSteps.length) * 100;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando informações de aprovação...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Status de Aprovação</h1>
              <p className="text-gray-600 mt-1">
                Acompanhe o progresso da análise do seu restaurante
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-red-600">
                {Math.round(getOverallProgress())}%
              </div>
              <div className="text-sm text-gray-500">Concluído</div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-red-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${getOverallProgress()}%` }}
            ></div>
          </div>
        </div>

        {/* Status Cards */}
        <div className="space-y-4">
          {approvalSteps.map((step, index) => (
            <div key={step.id} className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                    {step.icon}
                  </div>
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {step.title}
                    </h3>
                    <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(step.status)}`}>
                      {getStatusIcon(step.status)}
                      <span>{getStatusText(step.status)}</span>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 mb-3">{step.description}</p>
                  
                  <div className="text-sm text-gray-500 mb-3">
                    <strong>Tempo estimado:</strong> {step.estimatedTime}
                  </div>
                  
                  {step.details && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Itens verificados:</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {step.details.map((detail, idx) => (
                          <li key={idx} className="flex items-center space-x-2">
                            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                            <span>{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex justify-center space-x-4">
          <button
            onClick={() => router.push('/restaurant/cadastro')}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Editar Cadastro
          </button>
          
          {config?.approvalStatus === 'approved' && (
            <button
              onClick={() => router.push('/restaurant')}
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Acessar Dashboard
            </button>
          )}
        </div>

        {/* Help Section */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            Precisa de Ajuda?
          </h3>
          <p className="text-blue-700 mb-4">
            Nossa equipe está aqui para ajudar durante todo o processo de aprovação.
          </p>
          <div className="flex space-x-4">
            <button className="text-blue-600 hover:text-blue-800 font-medium">
              💬 Chat de Suporte
            </button>
            <button className="text-blue-600 hover:text-blue-800 font-medium">
              📞 (11) 9999-9999
            </button>
            <button className="text-blue-600 hover:text-blue-800 font-medium">
              📧 suporte@zipfood.com
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RestaurantApprovalPage;