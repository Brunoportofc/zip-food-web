'use client';

import React, { useState } from 'react';
import { FaStore, FaMapMarkerAlt, FaClock, FaCreditCard, FaTruck, FaUtensils, FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import { RestaurantConfiguration } from '@/types/restaurant-config';

interface RestaurantWizardProps {
  initialData?: RestaurantConfiguration | null;
  onComplete: (data: RestaurantConfiguration) => void;
}

type WizardStep = 'basic' | 'address' | 'hours' | 'payment' | 'delivery' | 'menu';

const RestaurantWizard: React.FC<RestaurantWizardProps> = ({ initialData, onComplete }) => {
  const [currentStep, setCurrentStep] = useState<WizardStep>('basic');
  const [formData, setFormData] = useState<RestaurantConfiguration>(initialData || {
    id: '',
    restaurantId: '',
    businessName: '',
    displayName: '',
    description: '',
    category: '',
    secondaryCategories: [],
    phone: '',
    email: '',
    address: {
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: '',
      zipCode: '',
      coordinates: { lat: 0, lng: 0 }
    },
    operatingHours: {
      monday: { isOpen: true, slots: [{ start: '08:00', end: '22:00' }] },
      tuesday: { isOpen: true, slots: [{ start: '08:00', end: '22:00' }] },
      wednesday: { isOpen: true, slots: [{ start: '08:00', end: '22:00' }] },
      thursday: { isOpen: true, slots: [{ start: '08:00', end: '22:00' }] },
      friday: { isOpen: true, slots: [{ start: '08:00', end: '22:00' }] },
      saturday: { isOpen: true, slots: [{ start: '08:00', end: '22:00' }] },
      sunday: { isOpen: false, slots: [] }
    },
    paymentMethods: ['credit-card', 'debit-card', 'cash', 'pix'],
    deliveryAreas: [{
      id: 'area-1',
      name: 'Área Principal',
      coordinates: [],
      deliveryFee: 5.99,
      minimumOrder: 25.00,
      estimatedTime: 35,
      isActive: true
    }],
    hasDelivery: true,
     hasPickup: true,
     minimumDeliveryOrder: 25.00,
     averageDeliveryTime: 35,
     documents: {
       cnpj: '',
       municipalLicense: '',
       healthLicense: ''
     },
     logo: '',
     banner: '',
     theme: {
       primaryColor: '#dc2626',
       secondaryColor: '#991b1b'
     },
     isConfigured: false,
      isActive: false,
      approvalStatus: 'pending' as const,
      createdAt: new Date(),
      updatedAt: new Date()
    });

  const steps: { key: WizardStep; title: string; icon: React.ReactNode }[] = [
    { key: 'basic', title: 'Dados Básicos', icon: <FaStore /> },
    { key: 'address', title: 'Endereço', icon: <FaMapMarkerAlt /> },
    { key: 'hours', title: 'Horários', icon: <FaClock /> },
    { key: 'payment', title: 'Pagamentos', icon: <FaCreditCard /> },
    { key: 'delivery', title: 'Entrega', icon: <FaTruck /> },
    { key: 'menu', title: 'Cardápio', icon: <FaUtensils /> }
  ];

  const currentStepIndex = steps.findIndex(step => step.key === currentStep);
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === steps.length - 1;

  const handleNext = () => {
    if (!isLastStep) {
      setCurrentStep(steps[currentStepIndex + 1].key);
    } else {
      onComplete(formData);
    }
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      setCurrentStep(steps[currentStepIndex - 1].key);
    }
  };

  const updateFormData = (section: keyof RestaurantConfiguration, data: any) => {
    setFormData(prev => {
      const currentValue = prev[section];
      if (typeof currentValue === 'object' && currentValue !== null && !Array.isArray(currentValue)) {
        return {
          ...prev,
          [section]: { ...currentValue, ...data }
        };
      } else {
        return {
          ...prev,
          [section]: data
        };
      }
    });
  };

  const renderBasicInfo = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Nome Empresarial *
        </label>
        <input
          type="text"
          value={formData.businessName}
          onChange={(e) => updateFormData('businessName', e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-black"
          placeholder="Ex: João Silva Pizzaria LTDA"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Nome do Restaurante *
        </label>
        <input
          type="text"
          value={formData.displayName}
          onChange={(e) => updateFormData('displayName', e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-black"
          placeholder="Ex: Pizzaria do João"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Descrição *
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => updateFormData('description', e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-black"
          rows={3}
          placeholder="Descreva seu restaurante..."
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          CNPJ *
        </label>
        <input
          type="text"
          value={formData.documents.cnpj}
          onChange={(e) => updateFormData('documents', { cnpj: e.target.value })}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-black"
          placeholder="00.000.000/0000-00"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Categoria *
        </label>
        <select
          value={formData.category}
          onChange={(e) => updateFormData('category', e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-black"
        >
          <option value="">Selecione uma categoria</option>
          <option value="pizza">Pizzaria</option>
          <option value="burger">Hamburgueria</option>
          <option value="japanese">Japonesa</option>
          <option value="italian">Italiana</option>
          <option value="brazilian">Brasileira</option>
          <option value="mexican">Mexicana</option>
          <option value="chinese">Chinesa</option>
          <option value="healthy">Saudável</option>
          <option value="dessert">Sobremesas</option>
        </select>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Telefone *
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => updateFormData('phone', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-black"
            placeholder="(11) 99999-9999"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            E-mail *
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => updateFormData('email', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-black"
            placeholder="contato@restaurante.com"
          />
        </div>
      </div>
    </div>
  );

  const renderAddress = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rua *
          </label>
          <input
            type="text"
            value={formData.address.street}
            onChange={(e) => updateFormData('address', { street: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-black"
            placeholder="Nome da rua"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Número *
          </label>
          <input
            type="text"
            value={formData.address.number}
            onChange={(e) => updateFormData('address', { number: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-black"
            placeholder="123"
          />
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Complemento
        </label>
        <input
          type="text"
          value={formData.address.complement}
          onChange={(e) => updateFormData('address', { complement: e.target.value })}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-black"
          placeholder="Apartamento, sala, etc."
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bairro *
          </label>
          <input
            type="text"
            value={formData.address.neighborhood}
            onChange={(e) => updateFormData('address', { neighborhood: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-black"
            placeholder="Nome do bairro"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            CEP *
          </label>
          <input
            type="text"
            value={formData.address.zipCode}
            onChange={(e) => updateFormData('address', { zipCode: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-black"
            placeholder="00000-000"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Cidade *
          </label>
          <input
            type="text"
            value={formData.address.city}
            onChange={(e) => updateFormData('address', { city: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-black"
            placeholder="Nome da cidade"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Estado *
          </label>
          <select
            value={formData.address.state}
            onChange={(e) => updateFormData('address', { state: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-black"
          >
            <option value="">Selecione o estado</option>
            <option value="SP">São Paulo</option>
            <option value="RJ">Rio de Janeiro</option>
            <option value="MG">Minas Gerais</option>
            <option value="RS">Rio Grande do Sul</option>
            <option value="PR">Paraná</option>
            <option value="SC">Santa Catarina</option>
            <option value="BA">Bahia</option>
            <option value="GO">Goiás</option>
            <option value="PE">Pernambuco</option>
            <option value="CE">Ceará</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderHours = () => {
    const days = [
      { key: 'monday', label: 'Segunda-feira' },
      { key: 'tuesday', label: 'Terça-feira' },
      { key: 'wednesday', label: 'Quarta-feira' },
      { key: 'thursday', label: 'Quinta-feira' },
      { key: 'friday', label: 'Sexta-feira' },
      { key: 'saturday', label: 'Sábado' },
      { key: 'sunday', label: 'Domingo' }
    ];

    return (
      <div className="space-y-4">
        {days.map(day => (
          <div key={day.key} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={formData.operatingHours[day.key as keyof typeof formData.operatingHours].isOpen}
                onChange={(e) => {
                  const newHours = { ...formData.operatingHours };
                  newHours[day.key as keyof typeof formData.operatingHours].isOpen = e.target.checked;
                  updateFormData('operatingHours', newHours);
                }}
                className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
              />
              <label className="ml-2 text-sm font-medium text-gray-700 w-32">
                {day.label}
              </label>
            </div>
            
            {formData.operatingHours[day.key as keyof typeof formData.operatingHours].isOpen && (
              <div className="space-y-2">
                {formData.operatingHours[day.key as keyof typeof formData.operatingHours].slots.map((slot, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="time"
                      value={slot.start}
                      onChange={(e) => {
                        const newHours = { ...formData.operatingHours };
                        const dayKey = day.key as keyof typeof formData.operatingHours;
                        const newSlots = [...newHours[dayKey].slots];
                        newSlots[index] = { ...newSlots[index], start: e.target.value };
                        newHours[dayKey] = { ...newHours[dayKey], slots: newSlots };
                        updateFormData('operatingHours', newHours);
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-black"
                    />
                    <span className="text-gray-500">às</span>
                    <input
                      type="time"
                      value={slot.end}
                      onChange={(e) => {
                        const newHours = { ...formData.operatingHours };
                        const dayKey = day.key as keyof typeof formData.operatingHours;
                        const newSlots = [...newHours[dayKey].slots];
                        newSlots[index] = { ...newSlots[index], end: e.target.value };
                        newHours[dayKey] = { ...newHours[dayKey], slots: newSlots };
                        updateFormData('operatingHours', newHours);
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-black"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderPayment = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { key: 'credit-card', label: 'Cartão de Crédito', icon: '💳' },
          { key: 'debit-card', label: 'Cartão de Débito', icon: '💳' },
          { key: 'cash', label: 'Dinheiro', icon: '💵' },
          { key: 'pix', label: 'PIX', icon: '📱' }
        ].map(method => (
          <div key={method.key} className="flex items-center p-4 border border-gray-200 rounded-lg">
            <input
              type="checkbox"
              checked={formData.paymentMethods.includes(method.key as any)}
              onChange={(e) => {
                const currentMethods = [...formData.paymentMethods];
                if (e.target.checked) {
                  if (!currentMethods.includes(method.key as any)) {
                    currentMethods.push(method.key as any);
                  }
                } else {
                  const index = currentMethods.indexOf(method.key as any);
                  if (index > -1) {
                    currentMethods.splice(index, 1);
                  }
                }
                updateFormData('paymentMethods', currentMethods);
              }}
              className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
            />
            <span className="ml-3 text-2xl">{method.icon}</span>
            <label className="ml-3 text-sm font-medium text-gray-700">
              {method.label}
            </label>
          </div>
        ))}
      </div>
    </div>
  );

  const renderDelivery = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Configurações de Entrega e Logística</h3>
      
      {/* Modalidades de Atendimento */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium text-gray-800 mb-3">Modalidades de Atendimento</h4>
        <div className="flex gap-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.hasDelivery}
              onChange={(e) => updateFormData('hasDelivery', e.target.checked)}
              className="mr-2 text-red-600 focus:ring-red-500"
            />
            <span className="text-sm text-gray-700">Entrega (Delivery)</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.hasPickup}
              onChange={(e) => updateFormData('hasPickup', e.target.checked)}
              className="mr-2 text-red-600 focus:ring-red-500"
            />
            <span className="text-sm text-gray-700">Retirada no Local</span>
          </label>
        </div>
      </div>
      
      {formData.hasDelivery && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Taxa de Entrega Base (R$)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 text-black"
                value={formData.deliveryAreas[0]?.deliveryFee || ''}
                onChange={(e) => {
                  const newAreas = [...formData.deliveryAreas];
                  if (newAreas[0]) {
                    newAreas[0].deliveryFee = parseFloat(e.target.value) || 0;
                    updateFormData('deliveryAreas', newAreas);
                  }
                }}
                placeholder="5.99"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pedido Mínimo para Entrega (R$)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 text-black"
                value={formData.deliveryAreas[0]?.minimumOrder || ''}
                onChange={(e) => {
                  const newAreas = [...formData.deliveryAreas];
                  if (newAreas[0]) {
                    newAreas[0].minimumOrder = parseFloat(e.target.value) || 0;
                    updateFormData('deliveryAreas', newAreas);
                    updateFormData('minimumDeliveryOrder', parseFloat(e.target.value) || 0);
                  }
                }}
                placeholder="25.00"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tempo Médio de Entrega (minutos)
              </label>
              <input
                type="number"
                min="15"
                max="120"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 text-black"
                value={formData.deliveryAreas[0]?.estimatedTime || ''}
                onChange={(e) => {
                  const newAreas = [...formData.deliveryAreas];
                  const time = parseInt(e.target.value) || 35;
                  if (newAreas[0]) {
                    newAreas[0].estimatedTime = time;
                    updateFormData('deliveryAreas', newAreas);
                    updateFormData('averageDeliveryTime', time);
                  }
                }}
                placeholder="35"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Raio de Entrega Máximo (km)
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 text-black"
                defaultValue="5"
              >
                <option value="2">2 km - Área Central</option>
                <option value="3">3 km - Bairros Próximos</option>
                <option value="5">5 km - Área Expandida</option>
                <option value="8">8 km - Região Metropolitana</option>
                <option value="12">12 km - Área Ampla</option>
              </select>
            </div>
          </div>
          
          {/* Configurações Avançadas de Logística */}
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
            <h4 className="font-medium text-yellow-800 mb-3 flex items-center">
              <FaTruck className="mr-2" />
              Configurações de Logística Inteligente
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <label className="flex items-center text-yellow-700">
                <input type="checkbox" className="mr-2 text-yellow-600" defaultChecked />
                Otimização automática de rotas
              </label>
              <label className="flex items-center text-yellow-700">
                <input type="checkbox" className="mr-2 text-yellow-600" defaultChecked />
                Agrupamento de pedidos (batching)
              </label>
              <label className="flex items-center text-yellow-700">
                <input type="checkbox" className="mr-2 text-yellow-600" />
                Taxa dinâmica por distância
              </label>
              <label className="flex items-center text-yellow-700">
                <input type="checkbox" className="mr-2 text-yellow-600" />
                Priorização em horários de pico
              </label>
            </div>
          </div>
        </>
      )}
      
      <div className="bg-blue-50 p-4 rounded-lg">
        <p className="text-sm text-blue-700">
          💡 <strong>Dica de Logística:</strong> Configure suas áreas de entrega considerando:
          • Densidade populacional e demanda esperada
          • Tempo de deslocamento dos entregadores
          • Custos operacionais (combustível, manutenção)
          • Concorrência local e posicionamento de preço
        </p>
      </div>
    </div>
  );

  const renderMenu = () => (
    <div className="space-y-6">
      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
        <h3 className="text-lg font-semibold text-green-800 mb-2">Configuração do Cardápio</h3>
        <p className="text-green-700 text-sm mb-4">
          O cardápio pode ser configurado em detalhes após finalizar o cadastro do restaurante.
        </p>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categorias Principais (separadas por vírgula)
            </label>
            <input
              type="text"
              placeholder="Ex: Pizzas, Bebidas, Sobremesas"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-black"
            />
          </div>
          
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800 text-sm">
              💡 <strong>Dica:</strong> Você poderá adicionar produtos, preços e imagens do cardápio na próxima etapa.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'basic': return renderBasicInfo();
      case 'address': return renderAddress();
      case 'hours': return renderHours();
      case 'payment': return renderPayment();
      case 'delivery': return renderDelivery();
      case 'menu': return renderMenu();
      default: return null;
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 'basic':
        return formData.businessName && formData.displayName && formData.description &&
               formData.documents.cnpj && formData.category && 
               formData.phone && formData.email;
      case 'address':
        return formData.address.street && formData.address.number && 
               formData.address.neighborhood && formData.address.city && 
               formData.address.state && formData.address.zipCode;
      default:
        return true;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => (
              <div key={step.key} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  index <= currentStepIndex ? 'bg-red-600 text-white' : 'bg-gray-300 text-gray-600'
                }`}>
                  {step.icon}
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-16 h-1 mx-2 ${
                    index < currentStepIndex ? 'bg-red-600' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <h2 className="text-2xl font-bold text-gray-900">
            {steps[currentStepIndex].title}
          </h2>
        </div>

        {/* Form Content */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          {renderCurrentStep()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <button
            onClick={handlePrevious}
            disabled={isFirstStep}
            className="flex items-center px-6 py-3 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaArrowLeft className="mr-2" />
            Anterior
          </button>
          
          <button
            onClick={handleNext}
            disabled={!isStepValid()}
            className="flex items-center px-8 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLastStep ? 'Finalizar' : 'Próximo'}
            <FaArrowRight className="ml-2" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default RestaurantWizard;