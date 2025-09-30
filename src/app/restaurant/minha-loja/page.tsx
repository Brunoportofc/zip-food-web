'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { 
  MdEdit, 
  MdSave, 
  MdCancel, 
  MdStar, 
  MdAccessTime, 
  MdDeliveryDining,
  MdLocationOn,
  MdPhone,
  MdEmail,
  MdImage,
  MdCameraAlt,
  MdPreview
} from 'react-icons/md';
import { toast } from 'react-hot-toast';
import { categoryDisplayNames, RestaurantCategory } from '@/types/restaurant';
import { categoryConfig } from '@/constants';
import ImageUpload from '@/components/ui/ImageUpload';

interface RestaurantData {
  id: string;
  name: string;
  description: string;
  category: RestaurantCategory;
  address: string;
  city: string;
  phone: string;
  email: string;
  logo_url?: string;
  cover_image_url?: string;
  image?: string; // Campo da API de listagem
  delivery_fee: number;
  deliveryFee?: number; // Campo da API de listagem
  minimum_order: number;
  minimumOrder?: number; // Campo da API de listagem
  estimated_delivery_time: string;
  estimatedDeliveryTime?: string; // Campo da API de listagem
  rating: number;
  is_active: boolean;
  created_at: Date;
  createdAt?: Date; // Campo da API de listagem
  operating_hours: any;
}

interface FormData {
  name: string;
  description: string;
  logo_url: string;
  cover_image_url: string;
  category: RestaurantCategory | '';
  delivery_fee: number;
  minimum_order: number;
  estimated_delivery_time: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  rating: number;
  is_active: boolean;
  created_at: Date | null;
  operating_hours: any;
}

export default function MinhaLojaPage() {
  const { user } = useAuth();
  const [restaurantData, setRestaurantData] = useState<RestaurantData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [lastUpdate, setLastUpdate] = useState(0); // Para forçar re-renderização

  // Criar formData baseado no restaurantData usando os MESMOS campos que a área do cliente
  const formData = useMemo((): FormData => {
    if (!restaurantData) {
      return {
        name: '',
        description: '',
        logo_url: '',
        cover_image_url: '',
        category: '',
        delivery_fee: 0,
        minimum_order: 0,
        estimated_delivery_time: '30-45 min',
        address: '',
        city: '',
        phone: '',
        email: '',
        rating: 0,
        is_active: true,
        created_at: null,
        operating_hours: {
          monday: { open: '08:00', close: '22:00', closed: false },
          tuesday: { open: '08:00', close: '22:00', closed: false },
          wednesday: { open: '08:00', close: '22:00', closed: false },
          thursday: { open: '08:00', close: '22:00', closed: false },
          friday: { open: '08:00', close: '22:00', closed: false },
          saturday: { open: '08:00', close: '22:00', closed: false },
          sunday: { open: '08:00', close: '22:00', closed: false }
        }
      };
    }

    // Usar os MESMOS campos que a área do cliente usa
    return {
      name: restaurantData.name || '',
      description: restaurantData.description || '',
      // Usar os campos que vêm da API de listagem (mesma que o cliente usa)
      logo_url: restaurantData.logo_url || '',
      cover_image_url: restaurantData.cover_image_url || restaurantData.image || '',
      category: restaurantData.category || '',
      // Usar os campos com nomes da API de listagem
      delivery_fee: restaurantData.deliveryFee !== undefined ? restaurantData.deliveryFee : (restaurantData.delivery_fee || 0),
      minimum_order: restaurantData.minimumOrder !== undefined ? restaurantData.minimumOrder : (restaurantData.minimum_order || 0),
      estimated_delivery_time: restaurantData.estimatedDeliveryTime || restaurantData.estimated_delivery_time || '30-45 min',
      address: restaurantData.address || '',
      city: restaurantData.city || '',
      phone: restaurantData.phone || '',
      email: restaurantData.email || '',
      rating: restaurantData.rating || 0,
      is_active: restaurantData.is_active !== undefined ? restaurantData.is_active : true,
      created_at: restaurantData.created_at || restaurantData.createdAt || null,
      operating_hours: restaurantData.operating_hours || {
        monday: { open: '08:00', close: '22:00', closed: false },
        tuesday: { open: '08:00', close: '22:00', closed: false },
        wednesday: { open: '08:00', close: '22:00', closed: false },
        thursday: { open: '08:00', close: '22:00', closed: false },
        friday: { open: '08:00', close: '22:00', closed: false },
        saturday: { open: '08:00', close: '22:00', closed: false },
        sunday: { open: '08:00', close: '22:00', closed: false }
      }
    };
  }, [restaurantData, lastUpdate]);

  // Estado separado para edição
  const [editFormData, setEditFormData] = useState<FormData>(formData);

  // Atualizar editFormData quando formData mudar
  useEffect(() => {
    setEditFormData(formData);
  }, [formData]);

  // Carregar dados do restaurante usando a MESMA API que a área do cliente usa
  const loadRestaurantData = useCallback(async () => {
    if (!user?.uid) return;

    try {
      setLoading(true);
      console.log('🔄 [Minha Loja] Carregando dados do restaurante...', { userId: user.uid });
      
      // PRIMEIRO: Buscar o ID do restaurante
      const checkResponse = await fetch('/api/restaurant/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid })
      });

      if (checkResponse.ok) {
        const checkData = await checkResponse.json();
        console.log('📥 [Minha Loja] Resposta do check:', checkData);
        
        if (checkData.restaurantData) {
          // SEGUNDO: Buscar dados usando a MESMA API que a área do cliente usa
          const restaurantResponse = await fetch(`/api/restaurants?owner=${user.uid}`, {
            credentials: 'include'
          });
          
          if (restaurantResponse.ok) {
            const restaurantListData = await restaurantResponse.json();
            console.log('📥 [Minha Loja] Dados da API de listagem:', restaurantListData);
            
            // Encontrar nosso restaurante na lista (deve ter apenas 1)
            const myRestaurant = restaurantListData.data.find((r: any) => r.id === checkData.restaurantData.id);
            
            if (myRestaurant) {
              console.log('📥 [Minha Loja] Dados do meu restaurante (mesma API do cliente):', myRestaurant);
              setRestaurantData(myRestaurant);
              setLastUpdate(Date.now()); // Forçar atualização
              console.log('✅ [Minha Loja] RestaurantData atualizado com dados da API do cliente');
            } else {
              console.error('❌ [Minha Loja] Restaurante não encontrado na lista');
            }
          } else {
            console.error('❌ [Minha Loja] Erro ao buscar dados da API de listagem:', restaurantResponse.status);
          }
        } else {
          console.log('⚠️ [Minha Loja] Nenhum restaurante encontrado para o usuário');
        }
      } else {
        console.error('❌ [Minha Loja] Erro no check:', checkResponse.status);
      }
    } catch (error) {
      console.error('❌ [Minha Loja] Erro ao carregar dados do restaurante:', error);
      toast.error('Erro ao carregar dados do restaurante');
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  // Carregar itens do menu
  const loadMenuItems = useCallback(async () => {
    try {
      const response = await fetch('/api/menu', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setMenuItems(data.data.items || []);
      }
    } catch (error) {
      console.error('Erro ao carregar menu:', error);
    }
  }, []);

  // Carregar dados iniciais
  useEffect(() => {
    if (user) {
      loadRestaurantData();
      loadMenuItems();
    }
  }, [user, loadRestaurantData, loadMenuItems]);

  // Função para atualizar campos do formulário de edição
  const handleInputChange = useCallback((field: string, value: string | number) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  // Função para atualizar horários de funcionamento
  const handleOperatingHourChange = useCallback((day: string, field: 'open' | 'close' | 'closed', value: string | boolean) => {
    setEditFormData(prev => {
      const currentDay = prev.operating_hours[day] || {};
      
      if (field === 'closed' && value === false) {
        return {
          ...prev,
          operating_hours: {
            ...prev.operating_hours,
            [day]: {
              open: currentDay.open || '08:00',
              close: currentDay.close || '22:00',
              closed: false
            }
          }
        };
      }
      
      return {
        ...prev,
        operating_hours: {
          ...prev.operating_hours,
          [day]: {
            ...currentDay,
            [field]: value
          }
        }
      };
    });
  }, []);

  // Função para salvar alterações
  const handleSave = useCallback(async () => {
    if (!restaurantData?.id) return;

    try {
      setSaving(true);
      
      const saveData = {
        name: editFormData.name,
        description: editFormData.description,
        logo_url: editFormData.logo_url,
        cover_image_url: editFormData.cover_image_url,
        category: editFormData.category,
        cuisine_type: editFormData.category,
        delivery_fee: editFormData.delivery_fee,
        minimum_order: editFormData.minimum_order,
        estimated_delivery_time: editFormData.estimated_delivery_time,
        operating_hours: editFormData.operating_hours
      };
      
      console.log('💾 [Minha Loja] Salvando dados:', {
        restaurantId: restaurantData.id,
        saveData,
        timestamp: new Date().toISOString()
      });
      
      const response = await fetch(`/api/restaurants/${restaurantData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(saveData)
      });

      console.log('📡 [Minha Loja] Resposta da API:', {
        status: response.status,
        ok: response.ok,
        timestamp: new Date().toISOString()
      });

      if (response.ok) {
        const responseData = await response.json();
        console.log('✅ [Minha Loja] Dados salvos com sucesso:', responseData);
        
        toast.success('Loja atualizada com sucesso!');
        setEditMode(false);
        
        // Recarregar dados após um pequeno delay
        setTimeout(() => {
          loadRestaurantData();
        }, 1000);
        
      } else {
        const error = await response.json();
        console.error('❌ [Minha Loja] Erro na resposta da API:', error);
        throw new Error(error.error || 'Erro ao atualizar loja');
      }
    } catch (error) {
      console.error('❌ [Minha Loja] Erro ao salvar:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao atualizar loja');
    } finally {
      setSaving(false);
    }
  }, [restaurantData?.id, editFormData, loadRestaurantData]);

  // Função para cancelar edição
  const handleCancel = useCallback(() => {
    setEditFormData(formData);
    setEditMode(false);
  }, [formData]);

  // Função para formatar data
  const formatDate = useCallback((date: any) => {
    if (!date) return 'N/A';
    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      return dateObj.toLocaleDateString('pt-BR');
    } catch {
      return 'Data inválida';
    }
  }, []);

  // Dados para exibição (usa editFormData no modo de edição, formData no modo de visualização)
  const displayData = editMode ? editFormData : formData;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!restaurantData) {
    return (
      <div className="text-center py-12">
        <h3 className="text-xl font-bold text-white mb-2">Restaurante não encontrado</h3>
        <p className="text-gray-300">Complete seu cadastro primeiro.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 bg-[#101828] min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Minha Loja</h1>
          <p className="text-gray-300">Veja como sua loja aparece para os clientes</p>
        </div>
        
        {!editMode ? (
          <div className="flex gap-3">
            <button
              onClick={() => setEditMode(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-md"
            >
              <MdEdit size={20} />
              Editar Loja
            </button>
          </div>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-colors duration-200 shadow-md ${
                saving 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {saving ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <MdSave size={20} />
              )}
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
            
            <button
              onClick={handleCancel}
              disabled={saving}
              className="flex items-center gap-2 bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors duration-200 shadow-md"
            >
              <MdCancel size={20} />
              Cancelar
            </button>
          </div>
        )}
      </div>

      {/* Preview da Loja */}
      <div className="bg-[#101828] rounded-2xl shadow-lg border border-green-500 overflow-hidden">
        {/* Badge de Preview */}
        <div className="bg-blue-50 border-b border-blue-200 px-6 py-3">
          <div className="flex items-center gap-2 text-blue-700">
            <MdPreview size={20} />
            <span className="font-medium">Visualização do Cliente</span>
            <span className="text-sm text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
              Como os clientes veem sua loja
            </span>
          </div>
        </div>

        {/* Imagem de Capa */}
        <div className="relative h-64">
          <img
            src={displayData.cover_image_url || restaurantData?.image || '/images/restaurants/default-cover.svg'}
            alt="Capa do restaurante"
            className="w-full h-full object-cover"
          />

          {/* Overlay com informações */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent">
            <div className="absolute bottom-6 left-6 right-6 text-white">
              <div className="flex items-end justify-between">
                <div className="flex-1">
                  {editMode ? (
                    <input
                      type="text"
                      value={displayData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="text-3xl font-bold bg-transparent border-b-2 border-white/50 focus:border-white focus:outline-none text-white placeholder-white/70 w-full"
                      placeholder="Nome do restaurante"
                    />
                  ) : (
                    <h1 className="text-3xl font-bold mb-2">{displayData.name}</h1>
                  )}
                  
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <MdStar className="text-yellow-400" size={16} />
                      <span className="font-bold">{(displayData.rating ?? 0).toFixed(1)}</span>
                      <span className="opacity-80">(50+ avaliações)</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MdAccessTime size={16} />
                      <span>{displayData.estimated_delivery_time}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MdDeliveryDining size={16} />
                      <span>
                        {(displayData.delivery_fee ?? 0) === 0 
                          ? 'Grátis' 
                          : `R$ ${(displayData.delivery_fee ?? 0).toFixed(2)}`
                        }
                      </span>
                    </div>
                  </div>
                </div>

                {/* Logo */}
                <div className="ml-6">
                  <div className="w-24 h-24 bg-gray-900 rounded-full p-2 shadow-lg">
                    <img
                      src={displayData.logo_url || '/images/restaurants/default-logo.svg'}
                      alt="Logo"
                      className="w-full h-full object-cover rounded-full"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Informações Detalhadas */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Coluna da Esquerda */}
            <div>
              <h3 className="text-xl font-bold text-white mb-4">Sobre o restaurante</h3>
              
              {editMode ? (
                <textarea
                  value={displayData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={4}
                      className="w-full p-3 border border-green-500 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder-gray-400 bg-gray-900"
                  placeholder="Descreva seu restaurante..."
                />
              ) : (
                <p className="text-gray-300 mb-6">
                  {displayData.description || 'Bem-vindos ao nosso restaurante! Oferecemos os melhores pratos com ingredientes frescos e muito carinho.'}
                </p>
              )}

              {/* Categoria */}
              <div className="mb-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="text-red-600">
                    {categoryConfig[displayData.category as RestaurantCategory]?.icon || '🍴'}
                  </div>
                  <span className="font-medium text-white">
                    {categoryDisplayNames[displayData.category as RestaurantCategory] || displayData.category}
                  </span>
                </div>
              </div>

              {/* Upload de Logo - apenas no modo de edição */}
              {editMode && (
                <div className="mb-6">
                  <ImageUpload
                    type="logo"
                    currentImage={displayData.logo_url}
                    onImageChange={(url) => handleInputChange('logo_url', url)}
                    label="Logo do Restaurante"
                    disabled={saving}
                  />
                </div>
              )}

              {/* Upload de Capa - apenas no modo de edição */}
              {editMode && (
                <div className="mb-6">
                  <ImageUpload
                    type="cover"
                    currentImage={displayData.cover_image_url}
                    onImageChange={(url) => handleInputChange('cover_image_url', url)}
                    label="Imagem de Capa"
                    disabled={saving}
                  />
                </div>
              )}

              {/* Informações de Contato */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm text-gray-300">
                  <MdLocationOn className="text-red-600" size={18} />
                  <span>{displayData.address}, {displayData.city}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-300">
                  <MdPhone className="text-red-600" size={18} />
                  <span>{displayData.phone}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-300">
                  <MdEmail className="text-red-600" size={18} />
                  <span>{displayData.email}</span>
                </div>
              </div>
            </div>

            {/* Coluna da Direita */}
            <div>
              <h3 className="text-xl font-bold text-white mb-4">Informações de Entrega</h3>
              
              <div className="bg-gray-50 rounded-xl p-4 space-y-4">
                {editMode ? (
                  <>
                    {/* Taxa de entrega - editável */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Taxa de entrega (R$)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={displayData.delivery_fee}
                        onChange={(e) => handleInputChange('delivery_fee', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-green-500 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-white"
                        placeholder="0.00"
                      />
                    </div>
                    
                    {/* Pedido mínimo - editável */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Pedido mínimo (R$)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={displayData.minimum_order}
                        onChange={(e) => handleInputChange('minimum_order', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-green-500 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-white"
                        placeholder="0.00"
                      />
                    </div>
                    
                    {/* Tempo de entrega - editável */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Tempo de entrega
                      </label>
                      <input
                        type="text"
                        value={displayData.estimated_delivery_time}
                        onChange={(e) => handleInputChange('estimated_delivery_time', e.target.value)}
                        className="w-full px-3 py-2 border border-green-500 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-white"
                        placeholder="Ex: 30-45 min"
                      />
                    </div>
                    
                    {/* Categoria - editável */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Categoria do Restaurante
                      </label>
                      <select
                        value={displayData.category}
                        onChange={(e) => handleInputChange('category', e.target.value)}
                        className="w-full px-3 py-2 border border-green-500 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-white bg-gray-900"
                      >
                        <option value="">Selecione uma categoria</option>
                        {Object.entries(categoryDisplayNames).map(([key, name]) => (
                          <option key={key} value={key}>{name}</option>
                        ))}
                      </select>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Taxa de entrega:</span>
                      <span className="font-bold text-white">
                        {(displayData.delivery_fee ?? 0) === 0 
                          ? 'Grátis' 
                          : `R$ ${(displayData.delivery_fee ?? 0).toFixed(2)}`
                        }
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Pedido mínimo:</span>
                      <span className="font-bold text-white">
                        R$ {(displayData.minimum_order ?? 0).toFixed(2)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Tempo de entrega:</span>
                      <span className="font-bold text-white">
                        {displayData.estimated_delivery_time}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Status:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        displayData.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {displayData.is_active ? '🟢 Ativo' : '🔴 Inativo'}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Horário de Funcionamento */}
              <div className="mt-6">
                <h4 className="font-bold text-white mb-3">Horário de funcionamento</h4>
                {editMode ? (
                  <div className="space-y-3">
                    {[
                      { key: 'monday', label: 'Segunda-feira' },
                      { key: 'tuesday', label: 'Terça-feira' },
                      { key: 'wednesday', label: 'Quarta-feira' },
                      { key: 'thursday', label: 'Quinta-feira' },
                      { key: 'friday', label: 'Sexta-feira' },
                      { key: 'saturday', label: 'Sábado' },
                      { key: 'sunday', label: 'Domingo' }
                    ].map(({ key, label }) => (
                      <div key={key} className="bg-gray-900 p-3 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-white">{label}</span>
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={displayData.operating_hours[key] ? !displayData.operating_hours[key].closed : false}
                              onChange={(e) => handleOperatingHourChange(key, 'closed', !e.target.checked)}
                              className="mr-2"
                            />
                            <span className="text-sm text-gray-300">Aberto</span>
                          </label>
                        </div>
                        {displayData.operating_hours[key] && !displayData.operating_hours[key].closed && (
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-xs text-gray-300 mb-1">Abertura</label>
                              <input
                                type="time"
                                value={displayData.operating_hours[key]?.open || '08:00'}
                                onChange={(e) => handleOperatingHourChange(key, 'open', e.target.value)}
                                className="w-full px-2 py-1 border border-green-500 rounded text-sm text-white"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-300 mb-1">Fechamento</label>
                              <input
                                type="time"
                                value={displayData.operating_hours[key]?.close || '22:00'}
                                onChange={(e) => handleOperatingHourChange(key, 'close', e.target.value)}
                                className="w-full px-2 py-1 border border-green-500 rounded text-sm text-white"
                              />
                            </div>
                          </div>
                        )}
                        {displayData.operating_hours[key] && displayData.operating_hours[key].closed && (
                          <p className="text-sm text-red-600">Fechado</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2 text-sm">
                    {[
                      { key: 'monday', label: 'Segunda-feira' },
                      { key: 'tuesday', label: 'Terça-feira' },
                      { key: 'wednesday', label: 'Quarta-feira' },
                      { key: 'thursday', label: 'Quinta-feira' },
                      { key: 'friday', label: 'Sexta-feira' },
                      { key: 'saturday', label: 'Sábado' },
                      { key: 'sunday', label: 'Domingo' }
                    ].map(({ key, label }) => {
                      const hours = displayData.operating_hours[key];
                      if (!hours) return null;
                      
                      return (
                        <div key={key} className="flex justify-between">
                          <span className="text-gray-300">{label}:</span>
                          <span className="text-white">
                            {hours.closed ? 'Fechado' : `${hours.open} - ${hours.close}`}
                          </span>
                        </div>
                      );
                    }).filter(Boolean)}
                  </div>
                )}
              </div>

              {/* Data de Criação */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-300">
                  <span>Criado em: {formatDate(displayData.created_at)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Menu do Restaurante */}
      {!editMode && menuItems.length > 0 && (
        <div className="mt-8">
          <div className="bg-gray-900 rounded-xl shadow-lg overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-white">Menu</h2>
              <p className="text-gray-300 mt-1">Confira nossos pratos disponíveis</p>
            </div>
            
            <div className="p-6">
              {/* Agrupar por categoria */}
              {(() => {
                const itemsByCategory = menuItems.reduce((acc, item) => {
                  if (!acc[item.category]) {
                    acc[item.category] = [];
                  }
                  acc[item.category].push(item);
                  return acc;
                }, {} as Record<string, any[]>);

                return Object.entries(itemsByCategory).map(([category, items]) => (
                  <div key={category} className="mb-8 last:mb-0">
                    <h3 className="text-xl font-semibold text-white mb-4 pb-2 border-b border-gray-100">
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {(items as any[]).filter((item: any) => item.is_available).map((item: any) => (
                        <div key={item.id} className="flex gap-4 p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                          {/* Imagem do item */}
                          {item.image_url ? (
                            <img 
                              src={item.image_url} 
                              alt={item.name}
                              className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                            />
                          ) : (
                            <div className="w-20 h-20 bg-gray-100 rounded-lg flex-shrink-0 flex items-center justify-center">
                              <MdImage className="text-gray-400 text-2xl" />
                            </div>
                          )}
                          
                          {/* Informações do item */}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-white truncate">{item.name}</h4>
                            <p className="text-gray-300 text-sm line-clamp-2 mt-1">{item.description}</p>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-lg font-bold text-red-600">
                                R$ {item.price.toFixed(2)}
                              </span>
                              <span className="text-xs text-gray-300">
                                ⏱️ {item.preparation_time}min
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ));
              })()}
              
              {/* Link para gerenciar menu */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg text-center">
                <p className="text-gray-300 mb-3">
                  Quer atualizar seu menu? Adicione, edite ou remova itens facilmente.
                </p>
                <a 
                  href="/restaurant/menu"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  <MdEdit />
                  Gerenciar Menu
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Menu vazio */}
      {!editMode && menuItems.length === 0 && (
        <div className="mt-8">
          <div className="bg-gray-900 rounded-xl shadow-lg p-8 text-center">
            <div className="text-gray-300 text-6xl mb-4">🍽️</div>
            <h3 className="text-xl font-semibold text-white mb-2">Menu em construção</h3>
            <p className="text-gray-300 mb-6">
              Sua loja ainda não tem itens no menu. Adicione seus primeiros pratos para que os clientes possam fazer pedidos.
            </p>
            <a 
              href="/restaurant/menu"
              className="inline-flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              <MdEdit />
              Criar Menu
            </a>
          </div>
        </div>
      )}

      {/* Dicas de Otimização */}
      {editMode && (
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="text-lg font-bold text-blue-900 mb-4">💡 Dicas para sua loja</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
            <div>
              <h4 className="font-semibold mb-2">📸 Imagens</h4>
              <ul className="space-y-1">
                <li>• Use uma capa atrativa com seus pratos</li>
                <li>• Logo deve ser clara e reconhecível</li>
                <li>• Imagens em alta resolução (1200x400px para capa)</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">📝 Descrição</h4>
              <ul className="space-y-1">
                <li>• Descreva sua especialidade</li>
                <li>• Mencione ingredientes únicos</li>
                <li>• Inclua sua história ou diferencial</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}