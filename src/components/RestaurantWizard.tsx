'use client';

import React, { useState } from 'react';
import { FaStore, FaMapMarkerAlt, FaClock, FaCreditCard, FaTruck, FaUtensils, FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import { RestaurantConfiguration } from '@/types/restaurant-config';
import { 
  sanitizeXSS, 
  validateEmail, 
  validateCNPJ, 
  validatePhone, 
  validateCEP, 
  validateSecureText 
} from '@/lib/security';

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

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateCurrentStep = (): boolean => {
    const newErrors: Record<string, string> = {};

    switch (currentStep) {
      case 'basic':
        if (!formData.businessName.trim()) {
          newErrors.businessName = 'Nome empresarial é obrigatório';
        }
        if (!formData.displayName.trim()) {
          newErrors.displayName = 'Nome do restaurante é obrigatório';
        }
        if (!formData.description.trim()) {
          newErrors.description = 'Descrição é obrigatória';
        }
        if (!formData.documents.cnpj.trim()) {
          newErrors.cnpj = 'CNPJ é obrigatório';
        } else if (!/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/.test(formData.documents.cnpj)) {
          newErrors.cnpj = 'CNPJ deve estar no formato 00.000.000/0000-00';
        }
        if (!formData.category) {
          newErrors.category = 'Categoria é obrigatória';
        }
        if (!formData.phone.trim()) {
          newErrors.phone = 'Telefone é obrigatório';
        } else if (!/^\(\d{2}\)\s\d{4,5}-\d{4}$/.test(formData.phone)) {
          newErrors.phone = 'Telefone deve estar no formato (00) 00000-0000';
        }
        if (!formData.email.trim()) {
          newErrors.email = 'E-mail é obrigatório';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          newErrors.email = 'E-mail deve ter um formato válido';
        }
        break;

      case 'address':
        if (!formData.address?.street?.trim()) {
          newErrors.street = 'Rua é obrigatória';
        }
        if (!formData.address?.number?.trim()) {
          newErrors.number = 'Número é obrigatório';
        }
        if (!formData.address?.neighborhood?.trim()) {
          newErrors.neighborhood = 'Bairro é obrigatório';
        }
        if (!formData.address?.city?.trim()) {
          newErrors.city = 'Cidade é obrigatória';
        }
        if (!formData.address?.state?.trim()) {
          newErrors.state = 'Estado é obrigatório';
        }
        if (!formData.address?.zipCode?.trim()) {
          newErrors.zipCode = 'CEP é obrigatório';
        } else if (!/^\d{5}-\d{3}$/.test(formData.address.zipCode)) {
          newErrors.zipCode = 'CEP deve estar no formato 00000-000';
        }
        break;

      case 'delivery':
        if (formData.hasDelivery) {
          if (!formData.deliveryAreas || formData.deliveryAreas.length === 0) {
            newErrors.deliveryAreas = 'Pelo menos uma área de entrega é obrigatória';
          }
          if (formData.minimumDeliveryOrder <= 0) {
            newErrors.minimumDeliveryOrder = 'Valor mínimo deve ser maior que zero';
          }
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateCurrentStep()) {
      return;
    }

    if (!isLastStep) {
      setCurrentStep(steps[currentStepIndex + 1].key);
      setErrors({}); // Limpar erros ao avançar
    } else {
      onComplete(formData);
    }
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      setCurrentStep(steps[currentStepIndex - 1].key);
    }
  };

  // Funções de formatação automática
  const formatCNPJ = (value: string) => {
    // Remove todos os caracteres não numéricos
    const numbers = value.replace(/\D/g, '');
    
    // Aplica a máscara do CNPJ: 00.000.000/0000-00
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 5) return `${numbers.slice(0, 2)}.${numbers.slice(2)}`;
    if (numbers.length <= 8) return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5)}`;
    if (numbers.length <= 12) return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8)}`;
    return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8, 12)}-${numbers.slice(12, 14)}`;
  };

  const formatPhone = (value: string) => {
    // Remove todos os caracteres não numéricos
    const numbers = value.replace(/\D/g, '');
    
    // Aplica a máscara do telefone: (00) 00000-0000
    if (numbers.length <= 2) return numbers.length > 0 ? `(${numbers}` : '';
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

  // Função para validar campo em tempo real com segurança
  const validateField = (field: string, value: string): string => {
    // Sanitiza o valor primeiro
    const sanitizedValue = sanitizeXSS(value);
    
    switch (field) {
      case 'businessName':
        const businessNameValidation = validateSecureText(sanitizedValue, 'Nome empresarial', 100);
        return businessNameValidation.isValid ? '' : businessNameValidation.error || '';
        
      case 'restaurantName':
        const restaurantNameValidation = validateSecureText(sanitizedValue, 'Nome do restaurante', 100);
        return restaurantNameValidation.isValid ? '' : restaurantNameValidation.error || '';
        
      case 'description':
        const descriptionValidation = validateSecureText(sanitizedValue, 'Descrição', 500);
        return descriptionValidation.isValid ? '' : descriptionValidation.error || '';
        
      case 'cnpj':
        const cnpjValidation = validateCNPJ(sanitizedValue);
        return cnpjValidation.isValid ? '' : cnpjValidation.error || '';
        
      case 'phone':
        const phoneValidation = validatePhone(sanitizedValue);
        return phoneValidation.isValid ? '' : phoneValidation.error || '';
        
      case 'email':
        const emailValidation = validateEmail(sanitizedValue);
        return emailValidation.isValid ? '' : emailValidation.error || '';
        
      case 'zipCode':
        const cepValidation = validateCEP(sanitizedValue);
        return cepValidation.isValid ? '' : cepValidation.error || '';
        
      case 'street':
        const streetValidation = validateSecureText(sanitizedValue, 'Rua', 200);
        return streetValidation.isValid ? '' : streetValidation.error || '';
        
      case 'number':
        const numberValidation = validateSecureText(sanitizedValue, 'Número', 20);
        return numberValidation.isValid ? '' : numberValidation.error || '';
        
      case 'neighborhood':
        const neighborhoodValidation = validateSecureText(sanitizedValue, 'Bairro', 100);
        return neighborhoodValidation.isValid ? '' : neighborhoodValidation.error || '';
        
      case 'city':
        const cityValidation = validateSecureText(sanitizedValue, 'Cidade', 100);
        return cityValidation.isValid ? '' : cityValidation.error || '';
        
      case 'state':
        const stateValidation = validateSecureText(sanitizedValue, 'Estado', 50);
        return stateValidation.isValid ? '' : stateValidation.error || '';
        
      default:
        return '';
    }
  };

  const updateFormData = (section: keyof RestaurantConfiguration, data: any) => {
    // Sanitiza os dados antes de armazenar
    let sanitizedData = data;
    if (typeof data === 'string') {
      sanitizedData = sanitizeXSS(data);
    } else if (typeof data === 'object' && data !== null) {
      sanitizedData = {};
      Object.keys(data).forEach(key => {
        if (typeof data[key] === 'string') {
          sanitizedData[key] = sanitizeXSS(data[key]);
        } else {
          sanitizedData[key] = data[key];
        }
      });
    }
    
    setFormData(prev => {
      const currentValue = prev[section];
      let updated;
      if (typeof currentValue === 'object' && currentValue !== null && !Array.isArray(currentValue)) {
        updated = {
          ...prev,
          [section]: { ...currentValue, ...sanitizedData }
        };
      } else {
        updated = {
          ...prev,
          [section]: sanitizedData
        };
      }
      
      // Validação em tempo real para campos específicos
      if (section === 'documents' && sanitizedData.cnpj !== undefined) {
        const error = validateField('cnpj', sanitizedData.cnpj);
        setErrors(prev => ({ ...prev, cnpj: error }));
      }
      if (section === 'phone' && sanitizedData !== undefined) {
        const error = validateField('phone', sanitizedData);
        setErrors(prev => ({ ...prev, phone: error }));
      }
      if (section === 'email' && sanitizedData !== undefined) {
        const error = validateField('email', sanitizedData);
        setErrors(prev => ({ ...prev, email: error }));
      }
      if (section === 'address') {
        Object.keys(sanitizedData).forEach(key => {
          const error = validateField(key, sanitizedData[key]);
          setErrors(prev => ({ ...prev, [key]: error }));
        });
      }
      
      return updated;
    });
  };

  const renderBasicInfo = () => (
    <div className="space-y-6">
      <div>
        <label 
          htmlFor="businessName" 
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Nome Empresarial *
        </label>
        <input
          id="businessName"
          type="text"
          value={formData.businessName}
          onChange={(e) => updateFormData('businessName', e.target.value)}
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-black transition-colors duration-200 ${
            errors.businessName ? 'border-red-500 bg-red-50' : 'border-gray-300'
          }`}
          placeholder="Ex: João Silva Pizzaria LTDA"
          aria-describedby={errors.businessName ? 'businessName-error' : undefined}
          aria-invalid={!!errors.businessName}
          required
        />
        {errors.businessName && (
          <p id="businessName-error" className="mt-1 text-sm text-red-600" role="alert">
            {errors.businessName}
          </p>
        )}
      </div>
      
      <div>
        <label 
          htmlFor="displayName" 
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Nome do Restaurante *
        </label>
        <input
          id="displayName"
          type="text"
          value={formData.displayName}
          onChange={(e) => updateFormData('displayName', e.target.value)}
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-black transition-colors duration-200 ${
            errors.displayName ? 'border-red-500 bg-red-50' : 'border-gray-300'
          }`}
          placeholder="Ex: Pizzaria do João"
          aria-describedby={errors.displayName ? 'displayName-error' : undefined}
          aria-invalid={!!errors.displayName}
          required
        />
        {errors.displayName && (
          <p id="displayName-error" className="mt-1 text-sm text-red-600" role="alert">
            {errors.displayName}
          </p>
        )}
      </div>
      
      <div>
        <label 
          htmlFor="description" 
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Descrição *
        </label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => updateFormData('description', e.target.value)}
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-black transition-colors duration-200 ${
            errors.description ? 'border-red-500 bg-red-50' : 'border-gray-300'
          }`}
          rows={3}
          placeholder="Descreva seu restaurante..."
          aria-describedby={errors.description ? 'description-error' : undefined}
          aria-invalid={!!errors.description}
          required
        />
        {errors.description && (
          <p id="description-error" className="mt-1 text-sm text-red-600" role="alert">
            {errors.description}
          </p>
        )}
      </div>
      
      <div>
        <label 
          htmlFor="cnpj" 
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          CNPJ *
        </label>
        <input
          id="cnpj"
          type="text"
          value={formData.documents.cnpj}
          onChange={(e) => {
            const formattedValue = formatCNPJ(e.target.value);
            updateFormData('documents', { cnpj: formattedValue });
          }}
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-black transition-colors duration-200 ${
            errors.cnpj ? 'border-red-500 bg-red-50' : 'border-gray-300'
          }`}
          placeholder="00.000.000/0000-00"
          maxLength={18}
          aria-describedby={errors.cnpj ? 'cnpj-error' : undefined}
          aria-invalid={!!errors.cnpj}
          required
        />
        {errors.cnpj && (
          <p id="cnpj-error" className="mt-1 text-sm text-red-600" role="alert">
            {errors.cnpj}
          </p>
        )}
      </div>
      
      <div>
        <label 
          htmlFor="category" 
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Categoria *
        </label>
        <select
          id="category"
          value={formData.category}
          onChange={(e) => updateFormData('category', e.target.value)}
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-black transition-colors duration-200 ${
            errors.category ? 'border-red-500 bg-red-50' : 'border-gray-300'
          }`}
          aria-describedby={errors.category ? 'category-error' : undefined}
          aria-invalid={!!errors.category}
          required
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
        {errors.category && (
          <p id="category-error" className="mt-1 text-sm text-red-600" role="alert">
            {errors.category}
          </p>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label 
            htmlFor="phone" 
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Telefone *
          </label>
          <input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => {
              const formattedValue = formatPhone(e.target.value);
              updateFormData('phone', formattedValue);
            }}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-black transition-colors duration-200 ${
              errors.phone ? 'border-red-500 bg-red-50' : 'border-gray-300'
            }`}
            placeholder="(11) 99999-9999"
            maxLength={15}
            aria-describedby={errors.phone ? 'phone-error' : undefined}
            aria-invalid={!!errors.phone}
            required
          />
          {errors.phone && (
            <p id="phone-error" className="mt-1 text-sm text-red-600" role="alert">
              {errors.phone}
            </p>
          )}
        </div>
        
        <div>
          <label 
            htmlFor="email" 
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            E-mail *
          </label>
          <input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => updateFormData('email', e.target.value)}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-black transition-colors duration-200 ${
              errors.email ? 'border-red-500 bg-red-50' : 'border-gray-300'
            }`}
            placeholder="contato@restaurante.com"
            aria-describedby={errors.email ? 'email-error' : undefined}
            aria-invalid={!!errors.email}
            required
          />
          {errors.email && (
            <p id="email-error" className="mt-1 text-sm text-red-600" role="alert">
              {errors.email}
            </p>
          )}
        </div>
      </div>
    </div>
  );

  // Estado para controle da geolocalização
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [locationSuccess, setLocationSuccess] = useState(false);

  // Função para formatar CEP
  const formatCEP = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 5) {
      return numbers;
    }
    return `${numbers.slice(0, 5)}-${numbers.slice(5, 8)}`;
  };

  // Função para buscar endereço por CEP
  const fetchAddressByCEP = async (cep: string) => {
    const cleanCEP = cep.replace(/\D/g, '');
    if (cleanCEP.length !== 8) return;

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`);
      const data = await response.json();
      
      if (!data.erro) {
        updateFormData('address', {
          ...formData.address,
          street: data.logradouro || formData.address.street,
          neighborhood: data.bairro || formData.address.neighborhood,
          city: data.localidade || formData.address.city,
          state: data.uf || formData.address.state,
        });
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
    }
  };

  // Função para usar geolocalização
  const useMyLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocalização não é suportada pelo seu navegador');
      return;
    }

    setIsLoadingLocation(true);
    setLocationSuccess(false);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Usar Google Geocoding API para obter endereço
          const response = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
          );
          const data = await response.json();
          
          if (data.results && data.results.length > 0) {
            const result = data.results[0];
            const addressComponents = result.address_components;
            
            let street = '';
            let number = '';
            let neighborhood = '';
            let city = '';
            let state = '';
            let zipCode = '';
            
            addressComponents.forEach((component: any) => {
              const types = component.types;
              
              if (types.includes('route')) {
                street = component.long_name;
              } else if (types.includes('street_number')) {
                number = component.long_name;
              } else if (types.includes('sublocality') || types.includes('neighborhood')) {
                neighborhood = component.long_name;
              } else if (types.includes('administrative_area_level_2')) {
                city = component.long_name;
              } else if (types.includes('administrative_area_level_1')) {
                state = component.short_name;
              } else if (types.includes('postal_code')) {
                zipCode = component.long_name;
              }
            });
            
            updateFormData('address', {
              street,
              number,
              complement: formData.address.complement,
              neighborhood,
              city,
              state,
              zipCode: formatCEP(zipCode),
              coordinates: { lat: latitude, lng: longitude }
            });
            
            setLocationSuccess(true);
            setTimeout(() => setLocationSuccess(false), 3000);
          }
        } catch (error) {
          console.error('Erro ao obter endereço:', error);
          alert('Erro ao obter endereço da localização');
        } finally {
          setIsLoadingLocation(false);
        }
      },
      (error) => {
        setIsLoadingLocation(false);
        let message = 'Erro ao obter localização';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = 'Permissão de localização negada. Por favor, permita o acesso à localização.';
            break;
          case error.POSITION_UNAVAILABLE:
            message = 'Localização indisponível.';
            break;
          case error.TIMEOUT:
            message = 'Tempo limite para obter localização excedido.';
            break;
        }
        
        alert(message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const renderAddress = () => (
    <div className="space-y-6">
      {/* Botão Usar Minha Localização */}
      <div className="flex justify-center mb-6">
        <button
          type="button"
          onClick={useMyLocation}
          disabled={isLoadingLocation}
          className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
            isLoadingLocation
              ? 'bg-gray-400 cursor-not-allowed focus:ring-gray-300'
              : locationSuccess
              ? 'bg-green-500 hover:bg-green-600 focus:ring-green-500'
              : 'bg-blue-500 hover:bg-blue-600 focus:ring-blue-500'
          } text-white shadow-lg hover:shadow-xl`}
          aria-label={
            isLoadingLocation 
              ? 'Obtendo sua localização atual' 
              : locationSuccess 
              ? 'Localização obtida com sucesso' 
              : 'Usar minha localização atual para preencher endereço'
          }
          aria-describedby="location-help"
        >
          {isLoadingLocation ? (
            <>
              <div 
                className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"
                aria-hidden="true"
              ></div>
              <span>Obtendo localização...</span>
            </>
          ) : locationSuccess ? (
            <>
              <FaMapMarkerAlt className="text-white" aria-hidden="true" />
              <span>✓ Localização obtida!</span>
            </>
          ) : (
            <>
              <FaMapMarkerAlt className="text-white" aria-hidden="true" />
              <span>Usar minha localização</span>
            </>
          )}
        </button>
      </div>
      
      <p id="location-help" className="text-sm text-gray-600 text-center mb-4">
        Clique no botão acima para preencher automaticamente os campos de endereço com sua localização atual
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Logradouro *
          </label>
          <input
            type="text"
            value={formData.address.street}
            onChange={(e) => updateFormData('address', { street: e.target.value })}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-black ${
              errors.street ? 'border-red-500 bg-red-50' : 'border-gray-300'
            }`}
            placeholder="Nome da rua, avenida, etc."
            required
            aria-describedby={errors.street ? 'street-error' : undefined}
          />
          {errors.street && (
            <p id="street-error" className="mt-1 text-sm text-red-600">{errors.street}</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Número *
          </label>
          <input
            type="text"
            value={formData.address.number}
            onChange={(e) => updateFormData('address', { number: e.target.value })}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-black ${
              errors.number ? 'border-red-500 bg-red-50' : 'border-gray-300'
            }`}
            placeholder="123"
            required
            aria-describedby={errors.number ? 'number-error' : undefined}
          />
          {errors.number && (
            <p id="number-error" className="mt-1 text-sm text-red-600">{errors.number}</p>
          )}
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
            placeholder="Apartamento, sala, bloco, etc. (opcional)"
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
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-black ${
              errors.neighborhood ? 'border-red-500 bg-red-50' : 'border-gray-300'
            }`}
            placeholder="Nome do bairro"
            required
            aria-describedby={errors.neighborhood ? 'neighborhood-error' : undefined}
          />
          {errors.neighborhood && (
            <p id="neighborhood-error" className="mt-1 text-sm text-red-600">{errors.neighborhood}</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            CEP *
          </label>
          <input
            type="text"
            value={formData.address.zipCode}
            onChange={(e) => {
              const formatted = formatCEP(e.target.value);
              updateFormData('address', { zipCode: formatted });
              if (formatted.length === 9) {
                fetchAddressByCEP(formatted);
              }
            }}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-black ${
              errors.zipCode ? 'border-red-500 bg-red-50' : 'border-gray-300'
            }`}
            placeholder="00000-000"
            maxLength={9}
            required
            aria-describedby={errors.zipCode ? 'zipcode-error' : undefined}
          />
          {errors.zipCode && (
            <p id="zipcode-error" className="mt-1 text-sm text-red-600">{errors.zipCode}</p>
          )}
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
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-black ${
              errors.city ? 'border-red-500 bg-red-50' : 'border-gray-300'
            }`}
            placeholder="Nome da cidade"
            required
            aria-describedby={errors.city ? 'city-error' : undefined}
          />
          {errors.city && (
            <p id="city-error" className="mt-1 text-sm text-red-600">{errors.city}</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Estado *
          </label>
          <select
            value={formData.address.state}
            onChange={(e) => updateFormData('address', { state: e.target.value })}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-black ${
              errors.state ? 'border-red-500 bg-red-50' : 'border-gray-300'
            }`}
            required
            aria-describedby={errors.state ? 'state-error' : undefined}
          >
            <option value="">Selecione o estado</option>
            <option value="AC">Acre</option>
            <option value="AL">Alagoas</option>
            <option value="AP">Amapá</option>
            <option value="AM">Amazonas</option>
            <option value="BA">Bahia</option>
            <option value="CE">Ceará</option>
            <option value="DF">Distrito Federal</option>
            <option value="ES">Espírito Santo</option>
            <option value="GO">Goiás</option>
            <option value="MA">Maranhão</option>
            <option value="MT">Mato Grosso</option>
            <option value="MS">Mato Grosso do Sul</option>
            <option value="MG">Minas Gerais</option>
            <option value="PA">Pará</option>
            <option value="PB">Paraíba</option>
            <option value="PR">Paraná</option>
            <option value="PE">Pernambuco</option>
            <option value="PI">Piauí</option>
            <option value="RJ">Rio de Janeiro</option>
            <option value="RN">Rio Grande do Norte</option>
            <option value="RS">Rio Grande do Sul</option>
            <option value="RO">Rondônia</option>
            <option value="RR">Roraima</option>
            <option value="SC">Santa Catarina</option>
            <option value="SP">São Paulo</option>
            <option value="SE">Sergipe</option>
            <option value="TO">Tocantins</option>
          </select>
          {errors.state && (
            <p id="state-error" className="mt-1 text-sm text-red-600">{errors.state}</p>
          )}
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
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Progress Bar */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between mb-4 overflow-x-auto">
            {steps.map((step, index) => (
              <div key={step.key} className="flex items-center flex-shrink-0">
                <div 
                  className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full transition-colors duration-200 ${
                    index <= currentStepIndex ? 'bg-red-600 text-white' : 'bg-gray-300 text-gray-600'
                  }`}
                  role="progressbar"
                  aria-valuenow={currentStepIndex + 1}
                  aria-valuemin={1}
                  aria-valuemax={steps.length}
                  aria-label={`Etapa ${index + 1} de ${steps.length}: ${step.title}`}
                >
                  {step.icon}
                </div>
                {index < steps.length - 1 && (
                  <div 
                    className={`w-8 sm:w-16 h-1 mx-1 sm:mx-2 transition-colors duration-200 ${
                      index < currentStepIndex ? 'bg-red-600' : 'bg-gray-300'
                    }`} 
                    aria-hidden="true"
                  />
                )}
              </div>
            ))}
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            {steps[currentStepIndex].title}
          </h1>
        </div>

        {/* Form Content */}
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8">
          <form onSubmit={(e) => e.preventDefault()} noValidate>
            {renderCurrentStep()}
          </form>
        </div>

        {/* Navigation Buttons */}
        <div className="flex flex-col sm:flex-row justify-between gap-4 sm:gap-0">
          <button
            onClick={handlePrevious}
            disabled={isFirstStep}
            className="flex items-center justify-center px-6 py-3 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 rounded-lg"
            aria-label="Voltar para etapa anterior"
          >
            <FaArrowLeft className="mr-2" aria-hidden="true" />
            Anterior
          </button>
          
          <button
            onClick={handleNext}
            disabled={!isStepValid()}
            className="flex items-center justify-center px-8 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
            aria-label={isLastStep ? 'Finalizar cadastro' : 'Ir para próxima etapa'}
          >
            {isLastStep ? 'Finalizar Cadastro' : 'Próximo'}
            <FaArrowRight className="ml-2" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default RestaurantWizard;