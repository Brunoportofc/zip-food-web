'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import restaurantService, { CreateRestaurantData } from '@/services/restaurant.service';
import { sanitizeXSS, validateSecureText } from '@/lib/security';
import SuccessMessage from '@/components/SuccessMessage';
import ImageUpload from '@/components/ImageUpload';
import { IMAGE_CONFIGS, ProcessedImage } from '@/lib/image-upload';
import { useGeolocation } from '@/hooks/useGeolocation';
import { getAddressFromCoordinates } from '@/lib/geocoding';
import { MapPin, Loader2 } from 'lucide-react';

// Componente de formulário de cadastro de restaurante
export default function RestaurantRegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [lang, setLang] = useState('en');
  const [errors, setErrors] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState<{
    title: string;
    message: string;
    isVisible: boolean;
  }>({
    title: '',
    message: '',
    isVisible: false
  });

  // Estados para upload de imagens
  const [coverImage, setCoverImage] = useState<ProcessedImage | null>(null);
  const [logoImage, setLogoImage] = useState<ProcessedImage | null>(null);
  const [imageErrors, setImageErrors] = useState<string[]>([]);

  // Estados para geolocalização
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const { getCurrentPosition } = useGeolocation();

  // Estado do formulário
  const [formData, setFormData] = useState<CreateRestaurantData>({
    name: '',
    description: '',
    address: '',
    city: '',
    country: 'Israel',
    cuisine_type: '',
    phone: '',
    email: '',
    delivery_fee: 0,
    minimum_order: 0,
    delivery_radius_km: 5,
    operating_hours: {
      sunday: { open: '10:00', close: '22:00' },
      monday: { open: '10:00', close: '22:00' },
      tuesday: { open: '10:00', close: '22:00' },
      wednesday: { open: '10:00', close: '22:00' },
      thursday: { open: '10:00', close: '22:00' },
      friday: { open: '10:00', close: '15:00' },
      saturday: { closed: true }
    }
  });

  // Textos internacionalizados
  const texts = {
    en: {
      title: 'Register Your Restaurant',
      subtitle: 'Join our delivery platform and reach more customers',
      name: 'Restaurant Name',
      namePlaceholder: 'Enter your restaurant name',
      description: 'Description',
      descriptionPlaceholder: 'Brief description of your restaurant',
      address: 'Address',
      addressPlaceholder: 'Full address of your restaurant',
      addressLocationHint: 'Click the location icon to automatically fill with your current location',
      city: 'City',
      cityPlaceholder: 'City name',
      country: 'Country',
      cuisineType: 'Cuisine Type',
      cuisineTypePlaceholder: 'Select cuisine type',
      phone: 'Phone Number',
      phonePlaceholder: '+972-XX-XXXXXXX',
      email: 'Email',
      emailPlaceholder: 'restaurant@example.com',
      deliveryFee: 'Delivery Fee (₪)',
      minimumOrder: 'Minimum Order (₪)',
      deliveryRadius: 'Delivery Radius (km)',
      operatingHours: 'Operating Hours',
      submit: 'Register Restaurant',
      submitting: 'Registering...',
      success: 'Restaurant registered successfully!',
      validationErrors: 'Please fix the following errors:',
      required: 'Required',
      optional: 'Optional',
      days: {
        sunday: 'Sunday',
        monday: 'Monday',
        tuesday: 'Tuesday',
        wednesday: 'Wednesday',
        thursday: 'Thursday',
        friday: 'Friday',
        saturday: 'Saturday'
      },
      closed: 'Closed',
      open: 'Open',
      close: 'Close'
    },
    he: {
      title: 'רישום המסעדה שלך',
      subtitle: 'הצטרף לפלטפורמת המשלוחים שלנו והגע ללקוחות נוספים',
      name: 'שם המסעדה',
      namePlaceholder: 'הכנס את שם המסעדה',
      description: 'תיאור',
      descriptionPlaceholder: 'תיאור קצר של המסעדה',
      address: 'כתובת',
      addressPlaceholder: 'כתובת מלאה של המסעדה',
      addressLocationHint: 'לחץ על סמל המיקום למילוי אוטומטי עם המיקום הנוכחי שלך',
      city: 'עיר',
      cityPlaceholder: 'שם העיר',
      country: 'מדינה',
      cuisineType: 'סוג מטבח',
      cuisineTypePlaceholder: 'בחר סוג מטבח',
      phone: 'מספר טלפון',
      phonePlaceholder: '972-XX-XXXXXXX+',
      email: 'אימייל',
      emailPlaceholder: 'restaurant@example.com',
      deliveryFee: 'עלות משלוח (₪)',
      minimumOrder: 'הזמנה מינימלית (₪)',
      deliveryRadius: 'רדיוס משלוח (ק"מ)',
      operatingHours: 'שעות פעילות',
      submit: 'רישום המסעדה',
      submitting: 'מבצע רישום...',
      success: 'המסעדה נרשמה בהצלחה!',
      validationErrors: 'אנא תקן את השגיאות הבאות:',
      required: 'חובה',
      optional: 'אופציונלי',
      days: {
        sunday: 'ראשון',
        monday: 'שני',
        tuesday: 'שלישי',
        wednesday: 'רביעי',
        thursday: 'חמישי',
        friday: 'שישי',
        saturday: 'שבת'
      },
      closed: 'סגור',
      open: 'פתיחה',
      close: 'סגירה'
    }
  };

  const t = texts[lang as keyof typeof texts];

  // Detectar idioma do navegador
  useEffect(() => {
    const browserLang = navigator.language.split('-')[0];
    if (browserLang === 'he') {
      setLang('he');
      restaurantService.setLanguage('he');
      document.dir = 'rtl';
    } else {
      setLang('en');
      restaurantService.setLanguage('en');
      document.dir = 'ltr';
    }
  }, []);

  // Obter tipos de cozinha
  const cuisineTypes = restaurantService.getCuisineTypes();

  // Manipular mudanças no formulário
  const handleInputChange = (field: keyof CreateRestaurantData, value: any) => {
    // Sanitizar dados de entrada para campos de texto
    let sanitizedValue = value;
    if (typeof value === 'string' && ['name', 'description', 'address', 'city'].includes(field)) {
      sanitizedValue = sanitizeXSS(value);
    }
    
    setFormData(prev => ({
      ...prev,
      [field]: sanitizedValue
    }));
    
    // Limpar erros quando o usuário começar a digitar
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  // Manipular mudanças nos horários de funcionamento
  const handleOperatingHoursChange = (day: string, field: 'open' | 'close' | 'closed', value: any) => {
    setFormData(prev => ({
      ...prev,
      operating_hours: {
        ...prev.operating_hours,
        [day]: field === 'closed' 
          ? { closed: value }
          : { ...prev.operating_hours?.[day], [field]: value }
      }
    }));
  };

  // Função para obter localização atual e preencher campos
  const handleGetCurrentLocation = async () => {
    try {
      setIsGettingLocation(true);
      
      console.log('🔍 Iniciando processo de geolocalização...');
      
      // Verificar se a API do Geoapify está configurada
        const apiKey = process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY;
        if (!apiKey || apiKey === 'SUA_CHAVE_GEOAPIFY_AQUI') {
          toast.error("⚠️ API do Geoapify não configurada. O sistema está usando endereços simulados.");
        }
      
      // Solicitar permissão e obter coordenadas com maior precisão
      const position = await getCurrentPosition();
      
      if (!position) {
        throw new Error('Não foi possível obter a localização');
      }
      
      const lat = position.lat;
      const lng = position.lng;
      
      console.log('📍 Coordenadas obtidas:', {
        latitude: lat,
        longitude: lng,
        timestamp: new Date().toISOString()
      });
      
      console.log('🌍 Iniciando geocodificação reversa...');
      
      // Converter coordenadas em endereço
      const addressData = await getAddressFromCoordinates(lat, lng);
      
      console.log('🏠 Dados do endereço obtidos:', {
        formattedAddress: addressData.formattedAddress,
        street: addressData.street,
        streetNumber: addressData.streetNumber,
        city: addressData.city,
        state: addressData.state,
        country: addressData.country,
        postalCode: addressData.postalCode
      });
      
      // Preencher campos do formulário com dados obtidos
      if (addressData.formattedAddress || addressData.street) {
        const fullAddress = addressData.formattedAddress || 
          `${addressData.streetNumber || ''} ${addressData.street || ''}`.trim();
        
        setFormData(prev => ({
          ...prev,
          address: fullAddress,
          city: addressData.city || prev.city,
          country: addressData.country || prev.country,
          latitude: lat,
          longitude: lng
        }));
        
        console.log('✅ Formulário preenchido com sucesso!');
        toast.success('Localização obtida com sucesso!');
        
      } else {
        console.error('❌ Endereço incompleto ou inválido:', addressData);
        throw new Error('Não foi possível obter um endereço válido da localização');
      }
      
    } catch (error: any) {
      console.error('❌ Erro ao obter localização:', error);
      
      // Mensagens de erro específicas
      if (error && typeof error === 'object' && 'code' in error) {
        const geoError = error as { code: number; message: string };
        switch (geoError.code) {
          case 1:
            toast.error('Permissão de localização negada. Por favor, permita o acesso à localização nas configurações do navegador.');
            break;
          case 2:
            toast.error('Localização indisponível. Verifique se o GPS está ativado e tente novamente.');
            break;
          case 3:
            toast.error('Tempo limite excedido ao obter localização. Verifique sua conexão e tente novamente.');
            break;
          default:
            toast.error('Erro ao obter localização. Tente novamente.');
        }
      } else if (error.message) {
        toast.error(error.message);
      } else {
        toast.error('Erro ao obter localização. Tente novamente.');
      }
    } finally {
      setIsGettingLocation(false);
    }
  };

  // Validar e enviar formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors([]);
    setImageErrors([]);

    try {
      // Validar dados no frontend
      const validation = restaurantService.validateRestaurantData(formData);
      
      if (!validation.isValid) {
        setErrors(validation.errors);
        setIsLoading(false);
        return;
      }

      // Enviar dados para o servidor
      const result = await restaurantService.createRestaurant(formData);
      
      // Mostrar mensagem de sucesso
      setSuccessMessage({
        title: 'Restaurante Cadastrado!',
        message: 'Seu restaurante foi cadastrado e aprovado automaticamente! Redirecionando para o dashboard...',
        isVisible: true
      });
      
      // Aguardar um pouco antes de redirecionar
      setTimeout(() => {
        router.push('/restaurant/dashboard');
      }, 2000);
      
    } catch (error) {
      console.error('Erro ao registrar restaurante:', error);
      toast.error(error instanceof Error ? error.message : 'Erro desconhecido');
    } finally {
      setIsLoading(false);
    }
  };

  // Função para fechar mensagem de sucesso
  const handleCloseSuccessMessage = () => {
    setSuccessMessage(prev => ({ ...prev, isVisible: false }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {t.title}
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {t.subtitle}
          </p>
        </div>

        {/* Seletor de idioma */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-lg p-1 shadow-sm border">
            <button
              onClick={() => {
                setLang('en');
                restaurantService.setLanguage('en');
                document.dir = 'ltr';
              }}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                lang === 'en' 
                  ? 'bg-orange-500 text-white' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              English
            </button>
            <button
              onClick={() => {
                setLang('he');
                restaurantService.setLanguage('he');
                document.dir = 'rtl';
              }}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                lang === 'he' 
                  ? 'bg-orange-500 text-white' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              עברית
            </button>
          </div>
        </div>

        {/* Erros de validação */}
        {errors.length > 0 && (
          <div className="mb-8 bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="text-red-800 font-medium mb-2">{t.validationErrors}</h3>
            <ul className="text-red-700 text-sm space-y-1">
              {errors.map((error, index) => (
                <li key={index} className="flex items-center">
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-2"></span>
                  {error}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Nome da Restaurante */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.name} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder={t.namePlaceholder}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors text-gray-900"
                required
              />
            </div>

            {/* Descrição */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.description} <span className="text-gray-400">({t.optional})</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder={t.descriptionPlaceholder}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors resize-none text-gray-900"
              />
            </div>

            {/* Endereço */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.address} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder={t.addressPlaceholder}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors text-gray-900"
                  required
                />
                <button
                  type="button"
                  onClick={handleGetCurrentLocation}
                  disabled={isGettingLocation}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-gray-500 hover:text-orange-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title={lang === 'he' ? 'השתמש במיקום הנוכחי שלי' : 'Usar minha localização atual'}
                >
                  {isGettingLocation ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <MapPin className="w-5 h-5" />
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                 {t.addressLocationHint}
               </p>
            </div>

            {/* Cidade */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.city} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                placeholder={t.cityPlaceholder}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors text-gray-900"
                required
              />
            </div>

            {/* País */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.country}
              </label>
              <input
                type="text"
                value={formData.country}
                onChange={(e) => handleInputChange('country', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors text-gray-900"
              />
            </div>

            {/* Tipo de Cozinha */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.cuisineType} <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.cuisine_type}
                onChange={(e) => handleInputChange('cuisine_type', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors text-gray-900"
                required
              >
                <option value="">{t.cuisineTypePlaceholder}</option>
                {cuisineTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {lang === 'he' ? type.labelHe : type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Telefone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.phone} <span className="text-gray-400">({t.optional})</span>
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder={t.phonePlaceholder}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors text-gray-900"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.email} <span className="text-gray-400">({t.optional})</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder={t.emailPlaceholder}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors text-gray-900"
              />
            </div>

            {/* Taxa de Entrega */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.deliveryFee}
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.delivery_fee}
                onChange={(e) => handleInputChange('delivery_fee', parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors text-gray-900"
              />
            </div>

            {/* Pedido Mínimo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.minimumOrder}
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.minimum_order}
                onChange={(e) => handleInputChange('minimum_order', parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors text-gray-900"
              />
            </div>

            {/* Raio de Entrega */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.deliveryRadius}
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={formData.delivery_radius_km}
                onChange={(e) => handleInputChange('delivery_radius_km', parseInt(e.target.value) || 5)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors text-gray-900"
              />
            </div>

            {/* Horários de Funcionamento */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-4">
                {t.operatingHours}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(t.days).map(([day, dayLabel]) => (
                  <div key={day} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium text-gray-700">{dayLabel}</span>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.operating_hours?.[day]?.closed || false}
                          onChange={(e) => handleOperatingHoursChange(day, 'closed', e.target.checked)}
                          className="mr-2 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                        />
                        <span className="text-sm text-gray-600">{t.closed}</span>
                      </label>
                    </div>
                    
                    {!formData.operating_hours?.[day]?.closed && (
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">{t.open}</label>
                          <input
                            type="time"
                            value={formData.operating_hours?.[day]?.open || '10:00'}
                            onChange={(e) => handleOperatingHoursChange(day, 'open', e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-orange-500 focus:border-transparent text-gray-900"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">{t.close}</label>
                          <input
                            type="time"
                            value={formData.operating_hours?.[day]?.close || '22:00'}
                            onChange={(e) => handleOperatingHoursChange(day, 'close', e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-orange-500 focus:border-transparent text-gray-900"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Upload de Imagens */}
            <div className="md:col-span-2">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 border-t pt-6">
                Imagens do Restaurante
              </h3>
              
              {/* Erros de imagem */}
              {imageErrors.length > 0 && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
                  <ul className="text-red-700 text-sm space-y-1">
                    {imageErrors.map((error, index) => (
                      <li key={index} className="flex items-center">
                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-2"></span>
                        {error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Imagem de Capa */}
                <ImageUpload
                  label="Imagem de Capa"
                  description="Imagem principal do restaurante (1200x800px recomendado)"
                  options={IMAGE_CONFIGS.RESTAURANT_COVER}
                  onImageProcessed={(processed) => {
                    setCoverImage(processed);
                    setImageErrors(prev => prev.filter(e => !e.includes('capa')));
                  }}
                  onError={(error) => {
                    setImageErrors(prev => [...prev.filter(e => !e.includes('capa')), `Imagem de capa: ${error}`]);
                  }}
                  required
                />

                {/* Logo */}
                <ImageUpload
                  label="Logo do Restaurante"
                  description="Logo com fundo transparente (400x400px recomendado)"
                  options={IMAGE_CONFIGS.RESTAURANT_LOGO}
                  onImageProcessed={(processed) => {
                    setLogoImage(processed);
                    setImageErrors(prev => prev.filter(e => !e.includes('logo')));
                  }}
                  onError={(error) => {
                    setImageErrors(prev => [...prev.filter(e => !e.includes('logo')), `Logo: ${error}`]);
                  }}
                  required
                />
              </div>
            </div>
          </div>

          {/* Botão de Envio */}
          <div className="mt-8 flex justify-center">
            <button
              type="submit"
              disabled={isLoading}
              className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-8 py-4 rounded-lg font-semibold text-lg shadow-lg hover:from-orange-600 hover:to-red-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
            >
              {isLoading ? t.submitting : t.submit}
            </button>
          </div>
        </form>
      </div>
      
      {/* Mensagem de Sucesso */}
      <SuccessMessage
        title={successMessage.title}
        message={successMessage.message}
        isVisible={successMessage.isVisible}
        onClose={handleCloseSuccessMessage}
      />
    </div>
  );
}