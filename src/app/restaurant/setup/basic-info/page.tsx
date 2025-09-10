'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FaStore, 
  FaArrowLeft, 
  FaArrowRight, 
  FaSave,
  FaImage,
  FaTimes
} from 'react-icons/fa';
import restaurantConfigService from '../../../../services/restaurant-config.service';
import { RestaurantConfiguration, RestaurantCategory } from '../../../../types/restaurant-config';
import { categoryDisplayNames } from '../../../../types/restaurant';

export default function BasicInfoPage() {
  const router = useRouter();
  const [currentRestaurantId] = useState('rest-1');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<RestaurantConfiguration | null>(null);
  const [formData, setFormData] = useState({
    displayName: '',
    description: '',
    category: '' as RestaurantCategory,
    secondaryCategories: [] as RestaurantCategory[],
    logoUrl: '',
    bannerUrl: ''
  });

  // Estados para arquivos de imagem
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [bannerPreview, setBannerPreview] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Função para manipular upload de logo
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setLogoPreview(result);
        setFormData({ ...formData, logoUrl: result });
      };
      reader.readAsDataURL(file);
    }
  };

  // Função para manipular upload de banner
  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBannerFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setBannerPreview(result);
        setFormData({ ...formData, bannerUrl: result });
      };
      reader.readAsDataURL(file);
    }
  };

  // Função para remover logo
  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview('');
    setFormData({ ...formData, logoUrl: '' });
  };

  // Função para remover banner
  const removeBanner = () => {
    setBannerFile(null);
    setBannerPreview('');
    setFormData({ ...formData, bannerUrl: '' });
  };

  useEffect(() => {
    loadRestaurantData();
  }, []);

  const loadRestaurantData = async () => {
    try {
      setLoading(true);
      const configData = await restaurantConfigService.getRestaurantConfig(currentRestaurantId);
      setConfig(configData);
      
      if (configData) {
        setFormData({
          displayName: configData.displayName || '',
          description: configData.description || '',
          category: configData.category || '' as RestaurantCategory,
          secondaryCategories: configData.secondaryCategories || [],
          logoUrl: configData.logoUrl || '',
          bannerUrl: configData.bannerUrl || ''
        });
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.displayName.trim()) {
      newErrors.displayName = 'Nome do restaurante é obrigatório';
    } else if (formData.displayName.length < 3) {
      newErrors.displayName = 'Nome deve ter pelo menos 3 caracteres';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Descrição é obrigatória';
    } else if (formData.description.length < 20) {
      newErrors.description = 'Descrição deve ter pelo menos 20 caracteres';
    }
    
    if (!formData.category) {
      newErrors.category = 'Categoria principal é obrigatória';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    
    try {
      setSaving(true);
      
      const configData = {
        businessName: formData.displayName, // Usar displayName como businessName por enquanto
        displayName: formData.displayName,
        description: formData.description,
        category: formData.category,
        secondaryCategories: formData.secondaryCategories,
        phone: '(11) 99999-9999', // Valor temporário - será coletado na próxima etapa
        email: 'contato@restaurante.com', // Valor temporário - será coletado na próxima etapa
        logoUrl: formData.logoUrl,
        bannerUrl: formData.bannerUrl,
        address: {
          street: 'Rua Exemplo, 123', // Valor temporário - será coletado na próxima etapa
          number: '123',
          complement: '',
          neighborhood: 'Centro',
          city: 'São Paulo',
          state: 'SP',
          zipCode: '01000-000',
          coordinates: { lat: -23.5505, lng: -46.6333 }
        },
        documents: {
          cnpj: '00.000.000/0001-00', // Valor temporário - será coletado na próxima etapa
          stateRegistration: '',
          municipalRegistration: ''
        },
        operatingHours: {
          monday: { isOpen: false, openTime: '', closeTime: '' },
          tuesday: { isOpen: false, openTime: '', closeTime: '' },
          wednesday: { isOpen: false, openTime: '', closeTime: '' },
          thursday: { isOpen: false, openTime: '', closeTime: '' },
          friday: { isOpen: false, openTime: '', closeTime: '' },
          saturday: { isOpen: false, openTime: '', closeTime: '' },
          sunday: { isOpen: false, openTime: '', closeTime: '' }
        },
        paymentMethods: {
          cash: false,
          creditCard: false,
          debitCard: false,
          pix: false
        },
        deliveryConfig: {
          radius: 5,
          fee: 5.00
        }
      };
      
      // Verificar se a configuração já existe
      if (config) {
        // Atualizar configuração existente
        const updatedConfig = {
          ...config,
          ...configData
        } as RestaurantConfiguration;
        
        await restaurantConfigService.updateRestaurantConfig(currentRestaurantId, updatedConfig);
      } else {
        // Criar nova configuração
        await restaurantConfigService.createRestaurantConfig({
          ...configData,
          restaurantId: currentRestaurantId
        });
      }
      
      // Redirecionar para próxima etapa
      router.push('/restaurant/setup/address');
    } catch (error) {
      console.error('Erro ao salvar:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleCategoryToggle = (category: RestaurantCategory) => {
    if (formData.secondaryCategories.includes(category)) {
      setFormData({
        ...formData,
        secondaryCategories: formData.secondaryCategories.filter(c => c !== category)
      });
    } else {
      setFormData({
        ...formData,
        secondaryCategories: [...formData.secondaryCategories, category]
      });
    }
  };

  const availableCategories = Object.keys(categoryDisplayNames) as RestaurantCategory[];
  const secondaryOptions = availableCategories.filter(cat => cat !== formData.category);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FaArrowLeft className="text-gray-600" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Dados Básicos</h1>
                <p className="text-sm text-gray-500">Etapa 1 de 7</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn btn-primary"
              >
                {saving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <FaSave className="mr-2" />
                )}
                Salvar e Continuar
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6">
            <div className="flex items-center mb-6">
              <div className="p-3 bg-primary/10 rounded-lg mr-4">
                <FaStore className="text-primary" size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Informações do Restaurante</h2>
                <p className="text-gray-600">Conte-nos sobre seu estabelecimento</p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Nome do Restaurante */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome do Restaurante *
                </label>
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors text-black ${
                    errors.displayName ? 'border-error' : 'border-gray-300'
                  }`}
                  placeholder="Ex: Pizzaria do João"
                />
                {errors.displayName && (
                  <p className="text-error text-sm mt-1">{errors.displayName}</p>
                )}
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none text-black ${
                    errors.description ? 'border-error' : 'border-gray-300'
                  }`}
                  placeholder="Descreva seu restaurante, especialidades e diferenciais..."
                />
                <div className="flex justify-between items-center mt-1">
                  {errors.description ? (
                    <p className="text-error text-sm">{errors.description}</p>
                  ) : (
                    <p className="text-gray-500 text-sm">Mínimo 20 caracteres</p>
                  )}
                  <p className="text-gray-400 text-sm">{formData.description.length}/500</p>
                </div>
              </div>

              {/* Categoria Principal */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoria Principal *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as RestaurantCategory })}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors text-black ${
                    errors.category ? 'border-error' : 'border-gray-300'
                  }`}
                >
                  <option value="">Selecione uma categoria</option>
                  {availableCategories.map((category) => (
                    <option key={category} value={category}>
                      {categoryDisplayNames[category]}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <p className="text-error text-sm mt-1">{errors.category}</p>
                )}
              </div>

              {/* Categorias Secundárias */}
              {formData.category && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Categorias Secundárias (opcional)
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {secondaryOptions.map((category) => {
                      const isSelected = formData.secondaryCategories.includes(category);
                      return (
                        <button
                          key={category}
                          type="button"
                          onClick={() => handleCategoryToggle(category)}
                          className={`p-3 text-sm border rounded-lg transition-all ${
                            isSelected
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-gray-300 hover:border-gray-400 text-gray-700'
                          }`}
                        >
                          {categoryDisplayNames[category]}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-gray-500 text-sm mt-2">
                    Selecione até 3 categorias adicionais que descrevem seu restaurante
                  </p>
                </div>
              )}

              {/* Upload de Imagens */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Logo do Restaurante
                  </label>
                  <div className="space-y-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors text-black file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary file:text-white hover:file:bg-primary/90"
                    />
                    {logoPreview && (
                      <div className="relative inline-block">
                        <img
                          src={logoPreview}
                          alt="Preview do logo"
                          className="w-20 h-20 object-cover rounded-lg border"
                        />
                        <button
                          type="button"
                          onClick={removeLogo}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                        >
                          <FaTimes />
                        </button>
                      </div>
                    )}
                  </div>
                  <p className="text-gray-500 text-sm mt-1">
                    Formatos aceitos: JPG, PNG, GIF (máx. 5MB)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Banner do Restaurante
                  </label>
                  <div className="space-y-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleBannerUpload}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors text-black file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary file:text-white hover:file:bg-primary/90"
                    />
                    {bannerPreview && (
                      <div className="relative inline-block">
                        <img
                          src={bannerPreview}
                          alt="Preview do banner"
                          className="w-full h-24 object-cover rounded-lg border max-w-xs"
                        />
                        <button
                          type="button"
                          onClick={removeBanner}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                        >
                          <FaTimes />
                        </button>
                      </div>
                    )}
                  </div>
                  <p className="text-gray-500 text-sm mt-1">
                    Formatos aceitos: JPG, PNG, GIF (máx. 5MB)
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t bg-gray-50 px-6 py-4 rounded-b-lg">
            <div className="flex justify-between items-center">
              <button
                onClick={() => router.push('/restaurant/setup')}
                className="btn btn-secondary"
              >
                <FaArrowLeft className="mr-2" />
                Voltar
              </button>
              
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn btn-primary"
              >
                {saving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <FaArrowRight className="mr-2" />
                )}
                Próxima Etapa
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}