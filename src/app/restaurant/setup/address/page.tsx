'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { restaurantConfigService } from '@/services/restaurant-config.service';
import { useAuthData } from '@/store/auth.store';
import AnimatedContainer from '@/components/AnimatedContainer';
import { 
  MdLocationOn, 
  MdArrowBack, 
  MdArrowForward, 
  MdSave,
  MdMyLocation,
  MdSearch,
  MdHome,
  MdBusiness
} from 'react-icons/md';

interface AddressData {
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  latitude?: number;
  longitude?: number;
  deliveryRadius: number;
  deliveryFee: number;
  minimumOrderValue: number;
}

const brazilianStates = [
  { code: 'AC', name: 'Acre' },
  { code: 'AL', name: 'Alagoas' },
  { code: 'AP', name: 'Amapá' },
  { code: 'AM', name: 'Amazonas' },
  { code: 'BA', name: 'Bahia' },
  { code: 'CE', name: 'Ceará' },
  { code: 'DF', name: 'Distrito Federal' },
  { code: 'ES', name: 'Espírito Santo' },
  { code: 'GO', name: 'Goiás' },
  { code: 'MA', name: 'Maranhão' },
  { code: 'MT', name: 'Mato Grosso' },
  { code: 'MS', name: 'Mato Grosso do Sul' },
  { code: 'MG', name: 'Minas Gerais' },
  { code: 'PA', name: 'Pará' },
  { code: 'PB', name: 'Paraíba' },
  { code: 'PR', name: 'Paraná' },
  { code: 'PE', name: 'Pernambuco' },
  { code: 'PI', name: 'Piauí' },
  { code: 'RJ', name: 'Rio de Janeiro' },
  { code: 'RN', name: 'Rio Grande do Norte' },
  { code: 'RS', name: 'Rio Grande do Sul' },
  { code: 'RO', name: 'Rondônia' },
  { code: 'RR', name: 'Roraima' },
  { code: 'SC', name: 'Santa Catarina' },
  { code: 'SP', name: 'São Paulo' },
  { code: 'SE', name: 'Sergipe' },
  { code: 'TO', name: 'Tocantins' }
];

export default function RestaurantAddressPage() {
  const router = useRouter();
  const { user } = useAuthData();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [addressData, setAddressData] = useState<AddressData>({
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    zipCode: '',
    deliveryRadius: 5,
    deliveryFee: 5.00,
    minimumOrderValue: 20.00
  });

  useEffect(() => {
    loadExistingData();
  }, []);

  const loadExistingData = async () => {
    try {
      setIsLoading(true);
      if (!user?.id) return;
      
      // Carregar dados existentes usando o ID do usuário logado
      const existingConfig = await restaurantConfigService.getRestaurantConfig(user.id);
      if (existingConfig && existingConfig.address) {
        setAddressData({
          ...addressData,
          ...existingConfig.address
        });
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof AddressData, value: string | number) => {
    setAddressData(prev => ({ ...prev, [field]: value }));
    
    // Limpar erro do campo quando o usuário começar a digitar
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const formatZipCode = (value: string) => {
    // Remover caracteres não numéricos
    const numbers = value.replace(/\D/g, '');
    
    // Aplicar máscara 00000-000
    if (numbers.length <= 5) {
      return numbers;
    }
    return `${numbers.slice(0, 5)}-${numbers.slice(5, 8)}`;
  };

  const handleZipCodeChange = (value: string) => {
    const formatted = formatZipCode(value);
    handleInputChange('zipCode', formatted);
    
    // Se CEP estiver completo, tentar buscar endereço
    if (formatted.length === 9) {
      searchAddressByZipCode(formatted);
    }
  };

  const searchAddressByZipCode = async (zipCode: string) => {
    try {
      setIsLoadingLocation(true);
      
      // Limpar CEP para busca na API
      const cleanZipCode = zipCode.replace(/\D/g, '');
      
      if (cleanZipCode.length !== 8) {
        throw new Error('CEP deve ter 8 dígitos');
      }
      
      // Buscar CEP na API ViaCEP
      const response = await fetch(`https://viacep.com.br/ws/${cleanZipCode}/json/`);
      
      if (!response.ok) {
        throw new Error('Erro ao consultar CEP');
      }
      
      const data = await response.json();
      
      if (data.erro) {
        throw new Error('CEP não encontrado');
      }
      
      // Mapear dados da API para o formato do formulário
      const addressFromAPI = {
        street: data.logradouro || '',
        neighborhood: data.bairro || '',
        city: data.localidade || '',
        state: data.uf || ''
      };
      
      setAddressData(prev => ({
        ...prev,
        ...addressFromAPI
      }));
      
      // Limpar erros se a busca foi bem-sucedida
      setErrors(prev => ({
        ...prev,
        zipCode: '',
        street: '',
        neighborhood: '',
        city: '',
        state: ''
      }));
      
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      setErrors(prev => ({
        ...prev,
        zipCode: error instanceof Error ? error.message : 'Erro ao buscar CEP'
      }));
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocalização não é suportada pelo seu navegador');
      return;
    }

    setIsLoadingLocation(true);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          
          // Fazer reverse geocoding usando Nominatim (OpenStreetMap)
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1&accept-language=pt-BR`
          );
          
          if (!response.ok) {
            throw new Error('Erro ao obter endereço da localização');
          }
          
          const data = await response.json();
          
          if (!data.address) {
            throw new Error('Endereço não encontrado para esta localização');
          }
          
          // Mapear dados do Nominatim para o formato do formulário
          const address = data.address;
          const addressFromLocation = {
            latitude,
            longitude,
            street: address.road || address.pedestrian || '',
            number: address.house_number || '',
            neighborhood: address.suburb || address.neighbourhood || address.quarter || '',
            city: address.city || address.town || address.village || address.municipality || '',
            state: address.state || '',
            zipCode: address.postcode || ''
          };
          
          setAddressData(prev => ({
            ...prev,
            ...addressFromLocation
          }));
          
          // Limpar erros se a busca foi bem-sucedida
          setErrors(prev => ({
            ...prev,
            street: '',
            neighborhood: '',
            city: '',
            state: '',
            zipCode: ''
          }));
          
        } catch (error) {
          console.error('Erro ao obter endereço:', error);
          setErrors(prev => ({
            ...prev,
            zipCode: error instanceof Error ? error.message : 'Erro ao obter endereço da localização'
          }));
        } finally {
          setIsLoadingLocation(false);
        }
      },
      (error) => {
        console.error('Erro de geolocalização:', error);
        setIsLoadingLocation(false);
        alert('Não foi possível obter sua localização');
      }
    );
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!addressData.street.trim()) {
      newErrors.street = 'Rua é obrigatória';
    }

    if (!addressData.number.trim()) {
      newErrors.number = 'Número é obrigatório';
    }

    if (!addressData.neighborhood.trim()) {
      newErrors.neighborhood = 'Bairro é obrigatório';
    }

    if (!addressData.city.trim()) {
      newErrors.city = 'Cidade é obrigatória';
    }

    if (!addressData.state) {
      newErrors.state = 'Estado é obrigatório';
    }

    if (!addressData.zipCode.trim()) {
      newErrors.zipCode = 'CEP é obrigatório';
    } else if (addressData.zipCode.length !== 9) {
      newErrors.zipCode = 'CEP deve ter 8 dígitos';
    }

    if (addressData.deliveryRadius <= 0) {
      newErrors.deliveryRadius = 'Raio de entrega deve ser maior que 0';
    }

    if (addressData.deliveryFee < 0) {
      newErrors.deliveryFee = 'Taxa de entrega não pode ser negativa';
    }

    if (addressData.minimumOrderValue <= 0) {
      newErrors.minimumOrderValue = 'Valor mínimo deve ser maior que 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    if (!user?.id) {
      alert('Usuário não autenticado. Faça login novamente.');
      router.push('/auth/sign-in?type=restaurant');
      return;
    }

    try {
      setIsSaving(true);
      
      // Verificar se já existe uma configuração para este usuário
      let existingConfig = await restaurantConfigService.getRestaurantConfig(user.id);
      
      if (existingConfig) {
        // Atualizar configuração existente
        await restaurantConfigService.updateRestaurantConfig(existingConfig.id, {
          address: addressData
        });
      } else {
        // Criar nova configuração se não existir
        await restaurantConfigService.createRestaurantConfig({
          restaurantId: user.id,
          businessName: user.name || 'Restaurante',
          displayName: user.name || 'Restaurante',
          address: addressData,
          isConfigured: false
        });
      }
      
      // Redirecionar para próxima etapa
      router.push('/restaurant/setup/payments');
      
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar dados. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    router.push('/restaurant/setup/basic-info');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Carregando dados...</p>
        </div>
      </div>
    );
  }

  return (
    <AnimatedContainer>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleBack}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <MdArrowBack className="text-xl text-gray-600" />
                </button>
                <h1 className="text-2xl font-bold text-gray-900">ZipFood</h1>
                <span className="text-gray-500">Endereço e Entrega</span>
              </div>
              <div className="text-sm text-gray-500">
                Etapa 2 de 5
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Progresso da Configuração</span>
              <span className="text-sm font-semibold text-orange-600">40%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div className="bg-gradient-to-r from-orange-500 to-red-500 h-3 rounded-full" style={{ width: '40%' }}></div>
            </div>
          </div>

          {/* Main Form */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex items-center mb-6">
              <div className="bg-orange-100 p-3 rounded-lg mr-4">
                <MdLocationOn className="text-2xl text-orange-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Endereço do Restaurante</h2>
                <p className="text-gray-600">Informe a localização e configure as opções de entrega</p>
              </div>
            </div>

            <div className="space-y-6">
              {/* CEP e Busca Automática */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-800 mb-3">Busca Rápida</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      CEP *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={addressData.zipCode}
                        onChange={(e) => handleZipCodeChange(e.target.value)}
                        placeholder="00000-000"
                        maxLength={9}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-black ${
                          errors.zipCode ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {isLoadingLocation && (
                        <div className="absolute right-3 top-3">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
                        </div>
                      )}
                    </div>
                    {errors.zipCode && (
                      <p className="text-red-500 text-sm mt-1">{errors.zipCode}</p>
                    )}
                  </div>
                  
                  <div className="flex items-end">
                    <button
                      onClick={getCurrentLocation}
                      disabled={isLoadingLocation}
                      className="w-full bg-blue-500 text-white px-4 py-3 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center justify-center"
                    >
                      <MdMyLocation className="mr-2" />
                      {isLoadingLocation ? 'Localizando...' : 'Usar Minha Localização'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Endereço Completo */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rua/Avenida *
                  </label>
                  <input
                    type="text"
                    value={addressData.street}
                    onChange={(e) => handleInputChange('street', e.target.value)}
                    placeholder="Ex: Rua das Flores"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-black ${
                      errors.street ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.street && (
                    <p className="text-red-500 text-sm mt-1">{errors.street}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Número *
                  </label>
                  <input
                    type="text"
                    value={addressData.number}
                    onChange={(e) => handleInputChange('number', e.target.value)}
                    placeholder="123"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-black ${
                      errors.number ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.number && (
                    <p className="text-red-500 text-sm mt-1">{errors.number}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Complemento
                  </label>
                  <input
                    type="text"
                    value={addressData.complement}
                    onChange={(e) => handleInputChange('complement', e.target.value)}
                    placeholder="Apto 101, Bloco A"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-black"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bairro *
                  </label>
                  <input
                    type="text"
                    value={addressData.neighborhood}
                    onChange={(e) => handleInputChange('neighborhood', e.target.value)}
                    placeholder="Centro"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-black ${
                      errors.neighborhood ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.neighborhood && (
                    <p className="text-red-500 text-sm mt-1">{errors.neighborhood}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cidade *
                  </label>
                  <input
                    type="text"
                    value={addressData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    placeholder="São Paulo"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-black ${
                      errors.city ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.city && (
                    <p className="text-red-500 text-sm mt-1">{errors.city}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estado *
                  </label>
                  <select
                    value={addressData.state}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-black ${
                      errors.state ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Selecione o estado</option>
                    {brazilianStates.map(state => (
                      <option key={state.code} value={state.code}>
                        {state.name} ({state.code})
                      </option>
                    ))}
                  </select>
                  {errors.state && (
                    <p className="text-red-500 text-sm mt-1">{errors.state}</p>
                  )}
                </div>
              </div>

              {/* Configurações de Entrega */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <MdBusiness className="mr-2 text-orange-600" />
                  Configurações de Entrega
                </h3>
                
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Raio de Entrega (km) *
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      step="0.5"
                      value={addressData.deliveryRadius}
                      onChange={(e) => handleInputChange('deliveryRadius', parseFloat(e.target.value) || 0)}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-black ${
                        errors.deliveryRadius ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.deliveryRadius && (
                      <p className="text-red-500 text-sm mt-1">{errors.deliveryRadius}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Taxa de Entrega (R$) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.50"
                      value={addressData.deliveryFee}
                      onChange={(e) => handleInputChange('deliveryFee', parseFloat(e.target.value) || 0)}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-black ${
                        errors.deliveryFee ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.deliveryFee && (
                      <p className="text-red-500 text-sm mt-1">{errors.deliveryFee}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pedido Mínimo (R$) *
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={addressData.minimumOrderValue}
                      onChange={(e) => handleInputChange('minimumOrderValue', parseFloat(e.target.value) || 0)}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-black ${
                        errors.minimumOrderValue ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.minimumOrderValue && (
                      <p className="text-red-500 text-sm mt-1">{errors.minimumOrderValue}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between mt-8 pt-6 border-t">
              <button
                onClick={handleBack}
                className="flex items-center justify-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <MdArrowBack className="mr-2" />
                Voltar
              </button>
              
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center justify-center px-8 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:from-orange-600 hover:to-red-600 transition-all duration-200 disabled:opacity-50"
              >
                {isSaving ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                ) : (
                  <MdSave className="mr-2" />
                )}
                {isSaving ? 'Salvando...' : 'Salvar e Continuar'}
                {!isSaving && <MdArrowForward className="ml-2" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </AnimatedContainer>
  );
}