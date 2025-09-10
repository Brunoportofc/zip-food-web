'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { restaurantConfigService } from '@/services/restaurant-config.service';
import AnimatedContainer from '@/components/AnimatedContainer';
import { MdRestaurant, MdLocationOn, MdPhone, MdEmail, MdDescription, MdCategory, MdSchedule, MdPayment, MdDeliveryDining, MdSave, MdArrowBack } from 'react-icons/md';

interface RestaurantFormData {
  // Dados básicos
  businessName: string;
  displayName: string;
  description: string;
  category: string;
  secondaryCategories: string[];
  phone: string;
  email: string;
  
  // Endereço
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  
  // Documentos
  cnpj: string;
  municipalLicense: string;
  healthLicense: string;
  
  // Configurações operacionais
  hasDelivery: boolean;
  hasPickup: boolean;
  minimumDeliveryOrder: number;
  averageDeliveryTime: number;
  
  // Métodos de pagamento
  paymentMethods: string[];
  
  // Horários de funcionamento
  operatingHours: {
    [key: string]: {
      isOpen: boolean;
      periods: { start: string; end: string }[];
    };
  };
  
  // Área de entrega
  deliveryRadius: number;
  deliveryFee: number;
}

const categories = [
  'pizza', 'hamburger', 'japonesa', 'italiana', 'brasileira', 'chinesa',
  'mexicana', 'vegetariana', 'vegana', 'doces', 'lanches', 'saudavel',
  'bebidas', 'acai', 'sorvetes', 'padaria', 'carnes', 'frutos-do-mar'
];

const paymentOptions = [
  { id: 'credit-card', label: 'Cartão de Crédito' },
  { id: 'debit-card', label: 'Cartão de Débito' },
  { id: 'pix', label: 'PIX' },
  { id: 'cash', label: 'Dinheiro' },
  { id: 'voucher', label: 'Vale Refeição' }
];

const daysOfWeek = [
  { key: 'monday', label: 'Segunda-feira' },
  { key: 'tuesday', label: 'Terça-feira' },
  { key: 'wednesday', label: 'Quarta-feira' },
  { key: 'thursday', label: 'Quinta-feira' },
  { key: 'friday', label: 'Sexta-feira' },
  { key: 'saturday', label: 'Sábado' },
  { key: 'sunday', label: 'Domingo' }
];

export default function NewRestaurantPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;
  
  const [formData, setFormData] = useState<RestaurantFormData>({
    businessName: '',
    displayName: '',
    description: '',
    category: '',
    secondaryCategories: [],
    phone: '',
    email: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    zipCode: '',
    cnpj: '',
    municipalLicense: '',
    healthLicense: '',
    hasDelivery: true,
    hasPickup: true,
    minimumDeliveryOrder: 0,
    averageDeliveryTime: 30,
    paymentMethods: [],
    operatingHours: {
      monday: { isOpen: true, periods: [{ start: '08:00', end: '22:00' }] },
      tuesday: { isOpen: true, periods: [{ start: '08:00', end: '22:00' }] },
      wednesday: { isOpen: true, periods: [{ start: '08:00', end: '22:00' }] },
      thursday: { isOpen: true, periods: [{ start: '08:00', end: '22:00' }] },
      friday: { isOpen: true, periods: [{ start: '08:00', end: '22:00' }] },
      saturday: { isOpen: true, periods: [{ start: '08:00', end: '22:00' }] },
      sunday: { isOpen: true, periods: [{ start: '08:00', end: '22:00' }] }
    },
    deliveryRadius: 5,
    deliveryFee: 5.90
  });

  const handleInputChange = (field: keyof RestaurantFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCategoryToggle = (category: string) => {
    setFormData(prev => ({
      ...prev,
      secondaryCategories: prev.secondaryCategories.includes(category)
        ? prev.secondaryCategories.filter(c => c !== category)
        : [...prev.secondaryCategories, category]
    }));
  };

  const handlePaymentToggle = (method: string) => {
    setFormData(prev => ({
      ...prev,
      paymentMethods: prev.paymentMethods.includes(method)
        ? prev.paymentMethods.filter(m => m !== method)
        : [...prev.paymentMethods, method]
    }));
  };

  const handleHoursChange = (day: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      operatingHours: {
        ...prev.operatingHours,
        [day]: {
          ...prev.operatingHours[day],
          [field]: value
        }
      }
    }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.businessName && formData.displayName && formData.category && formData.phone && formData.email);
      case 2:
        return !!(formData.street && formData.number && formData.neighborhood && formData.city && formData.state && formData.zipCode);
      case 3:
        return !!(formData.cnpj && formData.municipalLicense && formData.healthLicense);
      case 4:
        return formData.paymentMethods.length > 0;
      case 5:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep) && currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;
    
    setIsLoading(true);
    try {
      // Criar configuração do restaurante
      const restaurantConfig = {
        restaurantId: `rest-${Date.now()}`,
        businessName: formData.businessName,
        displayName: formData.displayName,
        description: formData.description,
        category: formData.category,
        secondaryCategories: formData.secondaryCategories,
        phone: formData.phone,
        email: formData.email,
        address: {
          street: formData.street,
          number: formData.number,
          complement: formData.complement,
          neighborhood: formData.neighborhood,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          coordinates: {
            lat: -23.5505, // Coordenadas padrão - em produção seria obtida via geocoding
            lng: -46.6333
          }
        },
        operatingHours: formData.operatingHours,
        paymentMethods: formData.paymentMethods,
        deliveryAreas: [{
          id: 'area-1',
          name: formData.neighborhood,
          coordinates: [
            { lat: -23.5505, lng: -46.6333 },
            { lat: -23.5515, lng: -46.6343 },
            { lat: -23.5525, lng: -46.6353 }
          ],
          deliveryFee: formData.deliveryFee,
          minimumOrder: formData.minimumDeliveryOrder,
          estimatedTime: formData.averageDeliveryTime,
          isActive: true
        }],
        hasDelivery: formData.hasDelivery,
        hasPickup: formData.hasPickup,
        minimumDeliveryOrder: formData.minimumDeliveryOrder,
        averageDeliveryTime: formData.averageDeliveryTime,
        documents: {
          cnpj: formData.cnpj,
          municipalLicense: formData.municipalLicense,
          healthLicense: formData.healthLicense
        },
        logo: '/images/restaurants/default-logo.jpg',
        banner: '/images/restaurants/default-banner.jpg',
        theme: {
          primaryColor: '#FF6B35',
          secondaryColor: '#F7931E'
        },
        isConfigured: true,
        isActive: true,
        approvalStatus: 'pending' as const
      };

      await restaurantConfigService.createRestaurantConfig(restaurantConfig);
      
      // Redirecionar para o dashboard
      router.push('/restaurant');
    } catch (error) {
      console.error('Erro ao criar restaurante:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <MdRestaurant className="mx-auto text-6xl text-orange-500 mb-4" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Informações Básicas</h2>
              <p className="text-gray-600">Vamos começar com os dados principais do seu restaurante</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Razão Social *
                </label>
                <input
                  type="text"
                  value={formData.businessName}
                  onChange={(e) => handleInputChange('businessName', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-black"
                  placeholder="Ex: Restaurante Sabor Ltda"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome Fantasia *
                </label>
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => handleInputChange('displayName', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-black"
                  placeholder="Ex: Restaurante Sabor"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-black"
                  placeholder="Descreva seu restaurante, especialidades, diferenciais..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoria Principal *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-black"
                >
                  <option value="">Selecione uma categoria</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Telefone *
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-black"
                  placeholder="(11) 99999-9999"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  E-mail *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-black"
                  placeholder="contato@seurestaurante.com.br"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categorias Secundárias
                </label>
                <div className="flex flex-wrap gap-2">
                  {categories.filter(cat => cat !== formData.category).map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => handleCategoryToggle(cat)}
                      className={`px-3 py-1 rounded-full text-sm transition-colors ${
                        formData.secondaryCategories.includes(cat)
                          ? 'bg-orange-500 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <MdLocationOn className="mx-auto text-6xl text-orange-500 mb-4" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Endereço</h2>
              <p className="text-gray-600">Onde está localizado seu restaurante?</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CEP *
                </label>
                <input
                  type="text"
                  value={formData.zipCode}
                  onChange={(e) => handleInputChange('zipCode', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-black"
                  placeholder="00000-000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rua/Avenida *
                </label>
                <input
                  type="text"
                  value={formData.street}
                  onChange={(e) => handleInputChange('street', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-black"
                  placeholder="Rua das Flores"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número *
                </label>
                <input
                  type="text"
                  value={formData.number}
                  onChange={(e) => handleInputChange('number', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-black"
                  placeholder="123"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Complemento
                </label>
                <input
                  type="text"
                  value={formData.complement}
                  onChange={(e) => handleInputChange('complement', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-black"
                  placeholder="Loja 1, Andar 2, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bairro *
                </label>
                <input
                  type="text"
                  value={formData.neighborhood}
                  onChange={(e) => handleInputChange('neighborhood', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-black"
                  placeholder="Vila Madalena"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cidade *
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-black"
                  placeholder="São Paulo"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado *
                </label>
                <select
                  value={formData.state}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-black"
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
                  <option value="DF">Distrito Federal</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <MdDescription className="mx-auto text-6xl text-orange-500 mb-4" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Documentação</h2>
              <p className="text-gray-600">Informações legais e licenças necessárias</p>
            </div>

            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CNPJ *
                </label>
                <input
                  type="text"
                  value={formData.cnpj}
                  onChange={(e) => handleInputChange('cnpj', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-black"
                  placeholder="00.000.000/0000-00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Licença Municipal *
                </label>
                <input
                  type="text"
                  value={formData.municipalLicense}
                  onChange={(e) => handleInputChange('municipalLicense', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-black"
                  placeholder="Número da licença municipal"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Licença Sanitária *
                </label>
                <input
                  type="text"
                  value={formData.healthLicense}
                  onChange={(e) => handleInputChange('healthLicense', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-black"
                  placeholder="Número da licença sanitária"
                />
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium text-blue-800 mb-2">Configurações de Operação</h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.hasDelivery}
                        onChange={(e) => handleInputChange('hasDelivery', e.target.checked)}
                        className="mr-2"
                      />
                      Oferece delivery
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.hasPickup}
                        onChange={(e) => handleInputChange('hasPickup', e.target.checked)}
                        className="mr-2"
                      />
                      Oferece retirada no local
                    </label>
                  </div>

                  {formData.hasDelivery && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Pedido mínimo para delivery (R$)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.minimumDeliveryOrder}
                          onChange={(e) => handleInputChange('minimumDeliveryOrder', parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-black"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tempo médio de entrega (min)
                        </label>
                        <input
                          type="number"
                          value={formData.averageDeliveryTime}
                          onChange={(e) => handleInputChange('averageDeliveryTime', parseInt(e.target.value) || 30)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-black"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <MdPayment className="mx-auto text-6xl text-orange-500 mb-4" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Métodos de Pagamento</h2>
              <p className="text-gray-600">Selecione as formas de pagamento que você aceita</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {paymentOptions.map(option => (
                <label
                  key={option.id}
                  className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    formData.paymentMethods.includes(option.id)
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.paymentMethods.includes(option.id)}
                    onChange={() => handlePaymentToggle(option.id)}
                    className="mr-3 h-4 w-4 text-orange-500"
                  />
                  <span className="font-medium">{option.label}</span>
                </label>
              ))}
            </div>

            {formData.hasDelivery && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-800 mb-4">Configurações de Delivery</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Raio de entrega (km)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={formData.deliveryRadius}
                      onChange={(e) => handleInputChange('deliveryRadius', parseFloat(e.target.value) || 5)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-black"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Taxa de entrega (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.deliveryFee}
                      onChange={(e) => handleInputChange('deliveryFee', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-black"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <MdSchedule className="mx-auto text-6xl text-orange-500 mb-4" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Horários de Funcionamento</h2>
              <p className="text-gray-600">Configure os horários de funcionamento do seu restaurante</p>
            </div>

            <div className="space-y-4">
              {daysOfWeek.map(day => (
                <div key={day.key} className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.operatingHours[day.key]?.isOpen || false}
                        onChange={(e) => handleHoursChange(day.key, 'isOpen', e.target.checked)}
                        className="mr-2 h-4 w-4 text-orange-500"
                      />
                      <span className="font-medium">{day.label}</span>
                    </label>
                  </div>

                  {formData.operatingHours[day.key]?.isOpen && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Abertura</label>
                        <input
                          type="time"
                          value={formData.operatingHours[day.key]?.periods[0]?.start || '08:00'}
                          onChange={(e) => {
                            const newPeriods = [...(formData.operatingHours[day.key]?.periods || [])];
                            if (newPeriods[0]) {
                              newPeriods[0].start = e.target.value;
                            } else {
                              newPeriods[0] = { start: e.target.value, end: '22:00' };
                            }
                            handleHoursChange(day.key, 'periods', newPeriods);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-black"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Fechamento</label>
                        <input
                          type="time"
                          value={formData.operatingHours[day.key]?.periods[0]?.end || '22:00'}
                          onChange={(e) => {
                            const newPeriods = [...(formData.operatingHours[day.key]?.periods || [])];
                            if (newPeriods[0]) {
                              newPeriods[0].end = e.target.value;
                            } else {
                              newPeriods[0] = { start: '08:00', end: e.target.value };
                            }
                            handleHoursChange(day.key, 'periods', newPeriods);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-black"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <MdRestaurant className="mx-auto text-4xl text-orange-500 mb-4" />
          <p className="text-lg text-gray-600">Criando seu restaurante...</p>
          <p className="text-sm text-gray-500">Aguarde enquanto configuramos tudo para você</p>
        </div>
      </div>
    );
  }

  return (
    <AnimatedContainer>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Cadastro de Novo Restaurante</h1>
            <p className="text-gray-600">Preencha todas as informações para começar a operar</p>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Progresso</span>
              <span className="text-sm text-gray-600">{currentStep} de {totalSteps}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Form */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            {renderStep()}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={() => router.push('/restaurant')}
                className="flex items-center px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <MdArrowBack className="mr-2" />
                Cancelar
              </button>

              <div className="flex space-x-4">
                {currentStep > 1 && (
                  <button
                    onClick={handlePrevious}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Anterior
                  </button>
                )}

                {currentStep < totalSteps ? (
                  <button
                    onClick={handleNext}
                    disabled={!validateStep(currentStep)}
                    className={`px-6 py-3 rounded-lg transition-colors ${
                      validateStep(currentStep)
                        ? 'bg-orange-500 text-white hover:bg-orange-600'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    Próximo
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={!validateStep(currentStep)}
                    className={`flex items-center px-6 py-3 rounded-lg transition-colors ${
                      validateStep(currentStep)
                        ? 'bg-green-500 text-white hover:bg-green-600'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <MdSave className="mr-2" />
                    Finalizar Cadastro
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AnimatedContainer>
  );
}