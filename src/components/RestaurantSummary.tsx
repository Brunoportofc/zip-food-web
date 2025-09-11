'use client';

import React from 'react';
import { FaCheck, FaEdit, FaMapMarkerAlt, FaClock, FaCreditCard, FaTruck, FaUtensils } from 'react-icons/fa';
import { RestaurantConfiguration } from '@/types/restaurant-config';

interface RestaurantSummaryProps {
  data: RestaurantConfiguration;
  onEdit: (step: string) => void;
  onConfirm: () => void;
  isSubmitting?: boolean;
}

const RestaurantSummary: React.FC<RestaurantSummaryProps> = ({
  data,
  onEdit,
  onConfirm,
  isSubmitting = false
}) => {
  const formatOperatingHours = (hours: any) => {
    if (!hours) return 'Não definido';
    
    const days = {
      monday: 'Segunda',
      tuesday: 'Terça',
      wednesday: 'Quarta',
      thursday: 'Quinta',
      friday: 'Sexta',
      saturday: 'Sábado',
      sunday: 'Domingo'
    };
    
    const openDays = Object.entries(hours)
      .filter(([_, dayData]: [string, any]) => dayData?.isOpen)
      .map(([day, dayData]: [string, any]) => 
        `${days[day as keyof typeof days]}: ${dayData.openTime} - ${dayData.closeTime}`
      );
    
    return openDays.length > 0 ? openDays.join(', ') : 'Fechado todos os dias';
  };

  const formatPaymentMethods = (methods: string[]) => {
    if (!methods || methods.length === 0) return 'Nenhum método selecionado';
    
    const methodNames = {
      'credit_card': 'Cartão de Crédito',
      'debit_card': 'Cartão de Débito',
      'pix': 'PIX',
      'cash': 'Dinheiro',
      'voucher': 'Vale Refeição'
    };
    
    return methods.map(method => methodNames[method as keyof typeof methodNames] || method).join(', ');
  };

  const formatDeliveryAreas = (areas: any[]) => {
    if (!areas || areas.length === 0) return 'Nenhuma área definida';
    
    return areas.map(area => 
      `${area.name} (Taxa: R$ ${area.deliveryFee?.toFixed(2) || '0,00'}, Tempo: ${area.estimatedTime || 'N/A'} min)`
    ).join(', ');
  };

  const summaryItems = [
    {
      icon: FaUtensils,
      title: 'Dados Básicos',
      content: [
        `Nome: ${data.displayName || 'Não informado'}`,
        `Categoria: ${data.category || 'Não informada'}`,
        `Descrição: ${data.description || 'Não informada'}`
      ],
      editStep: 'basic'
    },
    {
      icon: FaMapMarkerAlt,
      title: 'Endereço',
      content: [
        `${data.address?.street || ''}, ${data.address?.number || ''}`,
        `${data.address?.neighborhood || ''} - ${data.address?.city || ''}`,
        `CEP: ${data.address?.zipCode || 'Não informado'}`
      ],
      editStep: 'address'
    },
    {
      icon: FaClock,
      title: 'Horários de Funcionamento',
      content: [formatOperatingHours(data.operatingHours)],
      editStep: 'hours'
    },
    {
      icon: FaCreditCard,
      title: 'Métodos de Pagamento',
      content: [formatPaymentMethods(data.paymentMethods || [])],
      editStep: 'payment'
    },
    {
      icon: FaTruck,
      title: 'Áreas de Entrega',
      content: [formatDeliveryAreas(data.deliveryAreas || [])],
      editStep: 'delivery'
    }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Resumo da Configuração</h2>
        <p className="text-gray-600">Revise todas as informações antes de finalizar o cadastro</p>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
        <div className="space-y-8">
          {summaryItems.map((item, index) => {
            const IconComponent = item.icon;
            return (
              <div key={index} className="border-b border-gray-200 pb-6 last:border-b-0">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="bg-red-100 p-3 rounded-lg mr-4">
                      <IconComponent className="text-red-600 text-xl" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800">{item.title}</h3>
                  </div>
                  <button
                    onClick={() => onEdit(item.editStep)}
                    className="flex items-center px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <FaEdit className="mr-2" />
                    Editar
                  </button>
                </div>
                <div className="ml-16">
                  {item.content.map((line, lineIndex) => (
                    <p key={lineIndex} className="text-gray-700 mb-1">{line}</p>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-8">
        <div className="flex items-center mb-4">
          <FaCheck className="text-green-600 text-xl mr-3" />
          <h3 className="text-lg font-semibold text-green-800">Tudo Pronto!</h3>
        </div>
        <p className="text-green-700 mb-4">
          Suas informações estão completas. Ao confirmar, seu restaurante será cadastrado na plataforma 
          e ficará disponível para receber pedidos após a aprovação.
        </p>
        <div className="text-sm text-green-600">
          <p>• Tempo estimado para aprovação: 24-48 horas</p>
          <p>• Você receberá um e-mail de confirmação</p>
          <p>• Poderá acompanhar o status no painel do restaurante</p>
        </div>
      </div>

      <div className="flex justify-center">
        <button
          onClick={onConfirm}
          disabled={isSubmitting}
          className="bg-red-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
              Finalizando Cadastro...
            </>
          ) : (
            <>
              <FaCheck className="mr-3" />
              Confirmar e Finalizar Cadastro
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default RestaurantSummary;