'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';
import { restaurantService } from '@/services/restaurant.service';
import { RestaurantCategory, categoryDisplayNames } from '@/types/restaurant';
import { 
  FaStore, FaUtensils, FaImage, FaPlus, FaEdit, FaTrash, 
  FaSave, FaSpinner, FaArrowLeft, FaCheck 
} from 'react-icons/fa';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image?: string;
  available: boolean;
}

interface RestaurantData {
  name: string;
  category: RestaurantCategory | '';
  description: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  logo?: string;
  coverImage?: string;
  deliveryFee: number;
  minimumOrder: number;
  menuItems: MenuItem[];
}

// Usar as categorias do sistema sincronizadas
const categories = Object.entries(categoryDisplayNames);

const defaultMenuCategories = [
  'Entradas', 'Pratos Principais', 'Sobremesas', 'Bebidas', 'Especiais'
];

export default function RestaurantCadastro() {
  const router = useRouter();
  const { user, userRole, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | null>(null);
  const [customCategories, setCustomCategories] = useState<string[]>([]);

  const [formData, setFormData] = useState<RestaurantData>({
    name: '',
    category: '',
    description: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    deliveryFee: 0,
    minimumOrder: 0,
    menuItems: []
  });

  const [menuItemForm, setMenuItemForm] = useState<Omit<MenuItem, 'id'>>({
    name: '',
    description: '',
    price: 0,
    category: '',
    available: true
  });

  useEffect(() => {
    // Aguardar o carregamento da autenticação antes de fazer qualquer redirecionamento
    if (authLoading) return;
    
    if (!user || userRole !== 'restaurant') {
      console.log('[CADASTRO] ❌ Usuário não autorizado:', { user: !!user, userRole });
      router.push('/auth/sign-in');
    } else {
      console.log('[CADASTRO] ✅ Usuário autorizado para cadastro:', { uid: user.uid, userRole });
    }
  }, [user, userRole, authLoading, router]);

  const handleInputChange = (field: keyof RestaurantData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleMenuItemChange = (field: keyof Omit<MenuItem, 'id'>, value: any) => {
    setMenuItemForm(prev => ({
      ...prev,
      [field]: value
    }));

    // Se o campo for categoria e a categoria não existir nas listas, adiciona às categorias personalizadas
    if (field === 'category' && value && typeof value === 'string') {
      const allCategories = [...defaultMenuCategories, ...customCategories];
      if (!allCategories.includes(value)) {
        setCustomCategories(prev => [...prev, value]);
      }
    }
  };

  const addMenuItem = () => {
    if (!menuItemForm.name || !menuItemForm.price || !menuItemForm.category) {
      toast.error('Preencha todos os campos obrigatórios do item');
      return;
    }

    const newItem: MenuItem = {
      ...menuItemForm,
      id: Date.now().toString(),
    };

    if (editingMenuItem) {
      // Editando item existente
      setFormData(prev => ({
        ...prev,
        menuItems: prev.menuItems.map(item => 
          item.id === editingMenuItem.id ? { ...newItem, id: editingMenuItem.id } : item
        )
      }));
      setEditingMenuItem(null);
    } else {
      // Adicionando novo item
      setFormData(prev => ({
        ...prev,
        menuItems: [...prev.menuItems, newItem]
      }));
    }

    // Reset form
    setMenuItemForm({
      name: '',
      description: '',
      price: 0,
      category: '',
      available: true
    });
    setShowMenuModal(false);
    toast.success(editingMenuItem ? 'Item atualizado!' : 'Item adicionado!');
  };

  const editMenuItem = (item: MenuItem) => {
    setEditingMenuItem(item);
    setMenuItemForm({
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
      available: item.available
    });
    setShowMenuModal(true);
  };

  const deleteMenuItem = (id: string) => {
    setFormData(prev => ({
      ...prev,
      menuItems: prev.menuItems.filter(item => item.id !== id)
    }));
    toast.success('Item removido!');
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.category || !formData.address) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    if (formData.menuItems.length === 0) {
      toast.error('Adicione pelo menos um item ao cardápio');
      return;
    }

    if (!user) {
      toast.error('Você precisa estar logado para cadastrar um restaurante.');
      return;
    }

    setLoading(true);
    try {
      // Preparar dados do restaurante com ownerId
      const restaurantData = {
        name: formData.name,
        description: formData.description,
        address: formData.address,
        city: formData.city,
        cuisine_type: formData.category,
        phone: formData.phone,
        email: formData.email,
        delivery_fee: formData.deliveryFee,
        minimum_order: formData.minimumOrder,
        ownerId: user.uid, // ID do proprietário do restaurante
      };

      console.log('Dados do restaurante a serem enviados:', restaurantData);
      
      // Chamar o serviço para criar o restaurante
      const result = await restaurantService.createRestaurant(restaurantData);
      
      console.log('Restaurante criado com sucesso:', result);

      // ✨ CORREÇÃO CRÍTICA: Forçar atualização do token para obter novos custom claims
      try {
        console.log('🔄 Atualizando token do usuário para obter novos custom claims...');
        const newToken = await user.getIdToken(true); // Force refresh
        console.log('✅ Token atualizado com sucesso');
        
        // Aguardar um pouco para garantir que os claims foram propagados
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (tokenError) {
        console.warn('⚠️ Erro ao atualizar token:', tokenError);
        // Não falhar o fluxo se apenas a atualização do token falhar
      }

      toast.success('🎉 Restaurante cadastrado com sucesso! Redirecionando para o dashboard...');
      
      // Aguardar um pouco para garantir que os custom claims sejam atualizados
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mostrar próximos passos antes do redirecionamento
      toast.success('📍 Próximos passos: Configure seu menu e gerencie sua loja!');
      
      // Redirecionar para o dashboard
      router.push('/restaurant');
      
    } catch (error) {
      console.error('Erro ao cadastrar restaurante:', error);
      toast.error('Erro ao cadastrar restaurante. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (currentStep === 1) {
      if (!formData.name || !formData.category || !formData.address) {
        toast.error('Preencha todos os campos obrigatórios');
        return;
      }
    }
    setCurrentStep(prev => Math.min(prev + 1, 3));
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
              >
                <FaArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Cadastro do Restaurante</h1>
                <p className="text-gray-600">Configure seu restaurante e cardápio</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <FaStore className="w-8 h-8 text-primary-600" />
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                  currentStep >= step 
                    ? 'bg-red-600 text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {currentStep > step ? <FaCheck /> : step}
                </div>
                <div className="ml-3">
                  <p className={`font-medium ${currentStep >= step ? 'text-primary-600' : 'text-gray-600'}`}>
                    {step === 1 && 'Informações Básicas'}
                    {step === 2 && 'Cardápio'}
                    {step === 3 && 'Revisão'}
                  </p>
                </div>
                {step < 3 && (
                  <div className={`w-20 h-1 mx-4 ${
                    currentStep > step ? 'bg-red-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          {/* Step 1: Informações Básicas */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Informações do Restaurante</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome do Restaurante *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-black"
                    placeholder="Nome do seu restaurante"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categoria *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-black"
                  >
                    <option value="">Selecione uma categoria</option>
                    {categories.map(([key, name]) => (
                      <option key={key} value={key}>{name}</option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descrição
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-black"
                    placeholder="Descreva seu restaurante"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Imagem de Capa do Restaurante *
                  </label>
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <FaImage className="w-8 h-8 mb-4 text-gray-500" />
                        <p className="mb-2 text-sm text-gray-500">
                          <span className="font-semibold">Clique para enviar</span> a imagem de capa
                        </p>
                        <p className="text-xs text-gray-500">PNG, JPG ou JPEG (MAX. 5MB)</p>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            // Aqui você implementaria a lógica de upload
                            handleInputChange('coverImage', file.name);
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>
                  {formData.coverImage && (
                    <p className="mt-2 text-sm text-green-600">✓ {formData.coverImage}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Logo do Restaurante *
                  </label>
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <FaImage className="w-8 h-8 mb-4 text-gray-500" />
                        <p className="mb-2 text-sm text-gray-500">
                          <span className="font-semibold">Clique para enviar</span> o logo
                        </p>
                        <p className="text-xs text-gray-500">PNG, JPG ou JPEG (MAX. 5MB)</p>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            // Aqui você implementaria a lógica de upload
                            handleInputChange('logo', file.name);
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>
                  {formData.logo && (
                    <p className="mt-2 text-sm text-green-600">✓ {formData.logo}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telefone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-black"
                    placeholder="(11) 99999-9999"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    E-mail
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-black"
                    placeholder="contato@restaurante.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Endereço *
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-black"
                    placeholder="Rua, número, bairro"
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-black"
                    placeholder="Sua cidade"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Taxa de Entrega (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.deliveryFee}
                    onChange={(e) => handleInputChange('deliveryFee', parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-black"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pedido Mínimo (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.minimumOrder}
                    onChange={(e) => handleInputChange('minimumOrder', parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-black"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Cardápio */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Cardápio</h2>
                <button
                  onClick={() => setShowMenuModal(true)}
                  className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                >
                  <FaPlus className="w-4 h-4" />
                  <span>Adicionar Item</span>
                </button>
              </div>

              {formData.menuItems.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                  <FaUtensils className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Nenhum item no cardápio</p>
                  <p className="text-sm text-gray-500">Adicione itens para continuar</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {formData.menuItems.map((item) => (
                    <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-gray-900">{item.name}</h3>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => editMenuItem(item)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <FaEdit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteMenuItem(item.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <FaTrash className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-green-600">
                          R$ {item.price.toFixed(2)}
                        </span>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                          {item.category}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Revisão */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Revisão dos Dados</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-4">Informações do Restaurante</h3>
                  <div className="space-y-2 text-sm text-black">
                    <p><strong className="text-black">Nome:</strong> <span className="text-black">{formData.name}</span></p>
                    <p><strong className="text-black">Categoria:</strong> <span className="text-black">{formData.category}</span></p>
                    <p><strong className="text-black">Endereço:</strong> <span className="text-black">{formData.address}, {formData.city}</span></p>
                    <p><strong className="text-black">Telefone:</strong> <span className="text-black">{formData.phone}</span></p>
                    <p><strong className="text-black">E-mail:</strong> <span className="text-black">{formData.email}</span></p>
                    <p><strong className="text-black">Taxa de Entrega:</strong> <span className="text-black">R$ {formData.deliveryFee.toFixed(2)}</span></p>
                    <p><strong className="text-black">Pedido Mínimo:</strong> <span className="text-black">R$ {formData.minimumOrder.toFixed(2)}</span></p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-4">Cardápio ({formData.menuItems.length} itens)</h3>
                  <div className="space-y-2 text-sm max-h-64 overflow-y-auto">
                    {formData.menuItems.map((item) => (
                      <div key={item.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="text-black">{item.name}</span>
                        <span className="font-semibold text-black">R$ {item.price.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
            {/* Botão Anterior - aparece apenas na segunda fase (currentStep === 2) */}
            {currentStep === 2 && (
              <button
                onClick={prevStep}
                className="flex items-center space-x-2 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                <FaArrowLeft className="w-4 h-4" />
                <span>Anterior</span>
              </button>
            )}

            {/* Espaçador quando não há botão anterior */}
            {currentStep !== 2 && <div></div>}

            {/* Botão Próximo ou Finalizar */}
            {currentStep < 3 ? (
              <button
                onClick={nextStep}
                className="flex items-center space-x-2 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700"
              >
                <span>Próximo</span>
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center space-x-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <FaSpinner className="w-4 h-4 animate-spin" />
                    <span>Salvando...</span>
                  </>
                ) : (
                  <>
                    <FaSave className="w-4 h-4" />
                    <span>Finalizar Cadastro</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Menu Item Modal */}
      {showMenuModal && (
        <div className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50 modal-backdrop">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-4 modal-content">
            <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">
              {editingMenuItem ? 'Editar Item' : 'Adicionar Item ao Cardápio'}
            </h3>
            
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nome *</label>
                <input
                  type="text"
                  value={menuItemForm.name}
                  onChange={(e) => handleMenuItemChange('name', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 text-black transition-all duration-200 hover:border-gray-400"
                  placeholder="Nome do item"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Descrição</label>
                <textarea
                  value={menuItemForm.description}
                  onChange={(e) => handleMenuItemChange('description', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 text-black transition-all duration-200 hover:border-gray-400 resize-none"
                  placeholder="Descrição do item"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Preço (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={menuItemForm.price}
                    onChange={(e) => handleMenuItemChange('price', parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 text-black transition-all duration-200 hover:border-gray-400"
                    placeholder="0,00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Categoria *</label>
                  <input
                    type="text"
                    value={menuItemForm.category}
                    onChange={(e) => handleMenuItemChange('category', e.target.value)}
                    placeholder="Digite o nome da categoria"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 text-black transition-all duration-200 hover:border-gray-400"
                  />
                </div>
              </div>

              <div className="flex items-center bg-gray-50 p-3 rounded-xl">
                <input
                  type="checkbox"
                  id="available"
                  checked={menuItemForm.available}
                  onChange={(e) => handleMenuItemChange('available', e.target.checked)}
                  className="mr-3 rounded border-gray-300 text-red-600 focus:ring-red-500 w-4 h-4"
                />
                <label htmlFor="available" className="text-sm font-medium text-gray-700">
                  Item disponível para venda
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 mt-8">
              <button
                onClick={() => {
                  setShowMenuModal(false);
                  setEditingMenuItem(null);
                  setMenuItemForm({
                    name: '',
                    description: '',
                    price: 0,
                    category: '',
                    available: true
                  });
                }}
                className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-all duration-200 font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={addMenuItem}
                className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                {editingMenuItem ? 'Atualizar' : 'Adicionar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}