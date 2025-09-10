'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FaUtensils, 
  FaArrowLeft, 
  FaArrowRight, 
  FaPlus,
  FaEdit,
  FaTrash,
  FaImage,
  FaSave,
  FaEye,
  FaEyeSlash
} from 'react-icons/fa';
import { MdDragIndicator } from 'react-icons/md';
import restaurantConfigService from '../../../../services/restaurant-config.service';
import { Menu, MenuSection, Product, ProductCategory } from '../../../../types/menu';
import { categoryDisplayMap } from '../../../../types/menu';

interface ProductFormData {
  name: string;
  description: string;
  price: number;
  category: ProductCategory;
  imageUrl: string;
  available: boolean;
  options: Array<{
    name: string;
    required: boolean;
    maxSelections: number;
    choices: Array<{
      name: string;
      price: number;
    }>;
  }>;
}

export default function MenuPage() {
  const router = useRouter();
  const [currentRestaurantId] = useState('rest-1');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [menu, setMenu] = useState<Menu | null>(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [productForm, setProductForm] = useState<ProductFormData>({
    name: '',
    description: '',
    price: 0,
    category: 'main' as ProductCategory,
    imageUrl: '',
    available: true,
    options: []
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [sectionForm, setSectionForm] = useState({ name: '', description: '' });
  const [sectionErrors, setSectionErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadMenuData();
  }, []);

  const loadMenuData = async () => {
    try {
      setLoading(true);
      let menuData = await restaurantConfigService.getRestaurantMenu(currentRestaurantId);
      
      // Se não existe menu, cria um com seções padrão
      if (!menuData) {
        const defaultMenu = {
          restaurantId: currentRestaurantId,
          sections: [
            {
              id: `section-${Date.now()}-1`,
              name: 'Pratos Principais',
              description: 'Nossos pratos principais',
              products: []
            },
            {
              id: `section-${Date.now()}-2`,
              name: 'Bebidas',
              description: 'Bebidas e sucos',
              products: []
            },
            {
              id: `section-${Date.now()}-3`,
              name: 'Sobremesas',
              description: 'Doces e sobremesas',
              products: []
            }
          ]
        };
        
        menuData = await restaurantConfigService.createMenu(defaultMenu);
      }
      
      setMenu(menuData);
    } catch (error) {
      console.error('Erro ao carregar cardápio:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateProductForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!productForm.name.trim()) {
      newErrors.name = 'Nome do produto é obrigatório';
    }
    
    if (!productForm.description.trim()) {
      newErrors.description = 'Descrição é obrigatória';
    }
    
    if (productForm.price <= 0) {
      newErrors.price = 'Preço deve ser maior que zero';
    }
    
    if (!selectedSection) {
      newErrors.section = 'Selecione uma seção do cardápio';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveProduct = async () => {
    if (!validateProductForm() || !menu) return;
    
    try {
      setSaving(true);
      
      const newProduct: Product = {
        id: editingProduct?.id || `prod-${Date.now()}`,
        name: productForm.name,
        description: productForm.description,
        price: productForm.price,
        category: productForm.category,
        imageUrl: productForm.imageUrl,
        available: productForm.available,
        options: productForm.options
      };
      
      const updatedMenu = { ...menu };
      const sectionIndex = updatedMenu.sections.findIndex(s => s.id === selectedSection);
      
      if (sectionIndex !== -1) {
        if (editingProduct) {
          // Editar produto existente
          const productIndex = updatedMenu.sections[sectionIndex].products.findIndex(p => p.id === editingProduct.id);
          if (productIndex !== -1) {
            updatedMenu.sections[sectionIndex].products[productIndex] = newProduct;
          }
        } else {
          // Adicionar novo produto
          updatedMenu.sections[sectionIndex].products.push(newProduct);
        }
      }
      
      await restaurantConfigService.updateRestaurantMenu(currentRestaurantId, updatedMenu);
      setMenu(updatedMenu);
      closeProductModal();
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async (sectionId: string, productId: string) => {
    if (!menu || !confirm('Tem certeza que deseja excluir este produto?')) return;
    
    try {
      const updatedMenu = { ...menu };
      const sectionIndex = updatedMenu.sections.findIndex(s => s.id === sectionId);
      
      if (sectionIndex !== -1) {
        updatedMenu.sections[sectionIndex].products = 
          updatedMenu.sections[sectionIndex].products.filter(p => p.id !== productId);
        
        await restaurantConfigService.updateRestaurantMenu(currentRestaurantId, updatedMenu);
        setMenu(updatedMenu);
      }
    } catch (error) {
      console.error('Erro ao excluir produto:', error);
    }
  };

  const openProductModal = (product?: Product, sectionId?: string) => {
    if (product) {
      setEditingProduct(product);
      setProductForm({
        name: product.name,
        description: product.description,
        price: product.price,
        category: product.category,
        imageUrl: product.imageUrl || '',
        available: product.available,
        options: product.options || []
      });
      // Encontrar a seção do produto
      const section = menu?.sections.find(s => s.products.some(p => p.id === product.id));
      setSelectedSection(section?.id || '');
    } else {
      setEditingProduct(null);
      setProductForm({
        name: '',
        description: '',
        price: 0,
        category: 'main' as ProductCategory,
        imageUrl: '',
        available: true,
        options: []
      });
      setSelectedSection(sectionId || '');
    }
    setShowProductModal(true);
    setErrors({});
  };

  const closeProductModal = () => {
    setShowProductModal(false);
    setEditingProduct(null);
    setErrors({});
  };

  const addOption = () => {
    setProductForm({
      ...productForm,
      options: [...productForm.options, {
        name: '',
        required: false,
        maxSelections: 1,
        choices: [{ name: '', price: 0 }]
      }]
    });
  };

  const removeOption = (index: number) => {
    setProductForm({
      ...productForm,
      options: productForm.options.filter((_, i) => i !== index)
    });
  };

  const addChoice = (optionIndex: number) => {
    const updatedOptions = [...productForm.options];
    updatedOptions[optionIndex].choices.push({ name: '', price: 0 });
    setProductForm({ ...productForm, options: updatedOptions });
  };

  const removeChoice = (optionIndex: number, choiceIndex: number) => {
    const updatedOptions = [...productForm.options];
    updatedOptions[optionIndex].choices = updatedOptions[optionIndex].choices.filter((_, i) => i !== choiceIndex);
    setProductForm({ ...productForm, options: updatedOptions });
  };

  // === FUNÇÕES DE SEÇÃO ===
  const validateSectionForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!sectionForm.name.trim()) {
      newErrors.name = 'Nome da seção é obrigatório';
    }
    
    if (!sectionForm.description.trim()) {
      newErrors.description = 'Descrição é obrigatória';
    }
    
    setSectionErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveSection = async () => {
    if (!validateSectionForm() || !menu) return;
    
    try {
      const newSection: MenuSection = {
        id: `section-${Date.now()}`,
        name: sectionForm.name,
        description: sectionForm.description,
        products: []
      };
      
      const updatedMenu = {
        ...menu,
        sections: [...menu.sections, newSection]
      };
      
      await restaurantConfigService.updateRestaurantMenu(currentRestaurantId, updatedMenu);
      setMenu(updatedMenu);
      closeSectionModal();
    } catch (error) {
      console.error('Erro ao criar seção:', error);
    }
  };

  const closeSectionModal = () => {
    setShowSectionModal(false);
    setSectionForm({ name: '', description: '' });
    setSectionErrors({});
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando cardápio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FaArrowLeft className="text-gray-600" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Cardápio</h1>
                <p className="text-sm text-gray-500">Etapa 7 de 7</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => router.push('/restaurant/setup')}
                className="btn btn-primary"
              >
                <FaSave className="mr-2" />
                Finalizar Configuração
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="p-3 bg-primary/10 rounded-lg mr-4">
                  <FaUtensils className="text-primary" size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Gerenciar Cardápio</h2>
                  <p className="text-gray-600">Organize seus produtos por seções</p>
                </div>
              </div>
              <button
                onClick={() => setShowSectionModal(true)}
                className="btn btn-secondary"
              >
                <FaPlus className="mr-2" />
                Nova Seção
              </button>
            </div>

            {/* Menu Sections */}
            <div className="space-y-8">
              {menu?.sections.map((section) => (
                <div key={section.id} className="border border-gray-200 rounded-lg">
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{section.name}</h3>
                        <p className="text-sm text-gray-600">{section.description}</p>
                      </div>
                      <button
                        onClick={() => openProductModal(undefined, section.id)}
                        className="btn btn-primary btn-sm"
                      >
                        <FaPlus className="mr-2" size={14} />
                        Adicionar Produto
                      </button>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    {section.products.length === 0 ? (
                      <div className="text-center py-8">
                        <FaUtensils className="mx-auto text-gray-400 mb-4" size={48} />
                        <p className="text-gray-500 mb-4">Nenhum produto nesta seção</p>
                        <button
                          onClick={() => openProductModal(undefined, section.id)}
                          className="btn btn-primary"
                        >
                          <FaPlus className="mr-2" />
                          Adicionar Primeiro Produto
                        </button>
                      </div>
                    ) : (
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {section.products.map((product) => (
                          <div key={product.id} className="card border border-gray-200">
                            {product.imageUrl && (
                              <div className="aspect-video bg-gray-100 rounded-t-lg overflow-hidden">
                                <img
                                  src={product.imageUrl}
                                  alt={product.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                            
                            <div className="p-4">
                              <div className="flex items-start justify-between mb-2">
                                <h4 className="font-semibold text-gray-900 flex-1">{product.name}</h4>
                                <div className="flex items-center space-x-1 ml-2">
                                  {product.available ? (
                                    <FaEye className="text-success" size={14} />
                                  ) : (
                                    <FaEyeSlash className="text-gray-400" size={14} />
                                  )}
                                </div>
                              </div>
                              
                              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                {product.description}
                              </p>
                              
                              <div className="flex items-center justify-between">
                                <span className="text-lg font-bold text-primary">
                                  R$ {product.price.toFixed(2)}
                                </span>
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => openProductModal(product)}
                                    className="p-2 text-gray-600 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                  >
                                    <FaEdit size={14} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteProduct(section.id, product.id)}
                                    className="p-2 text-gray-600 hover:text-error hover:bg-error/10 rounded-lg transition-colors"
                                  >
                                    <FaTrash size={14} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="border-t bg-gray-50 px-6 py-4 rounded-b-lg">
            <div className="flex justify-between items-center">
              <button
                onClick={() => router.push('/restaurant/setup/delivery')}
                className="btn btn-secondary"
              >
                <FaArrowLeft className="mr-2" />
                Etapa Anterior
              </button>
              
              <button
                onClick={() => router.push('/restaurant/setup')}
                className="btn btn-primary"
              >
                <FaSave className="mr-2" />
                Finalizar Configuração
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  {editingProduct ? 'Editar Produto' : 'Novo Produto'}
                </h3>
                <button
                  onClick={closeProductModal}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <FaTrash className="text-gray-600" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Seção */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Seção do Cardápio *
                  </label>
                  <select
                    value={selectedSection}
                    onChange={(e) => setSelectedSection(e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors ${
                      errors.section ? 'border-error' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Selecione uma seção</option>
                    {menu?.sections.map((section) => (
                      <option key={section.id} value={section.id}>
                        {section.name}
                      </option>
                    ))}
                  </select>
                  {errors.section && (
                    <p className="text-error text-sm mt-1">{errors.section}</p>
                  )}
                </div>

                {/* Nome */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome do Produto *
                  </label>
                  <input
                    type="text"
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors ${
                      errors.name ? 'border-error' : 'border-gray-300'
                    }`}
                    placeholder="Ex: Pizza Margherita"
                  />
                  {errors.name && (
                    <p className="text-error text-sm mt-1">{errors.name}</p>
                  )}
                </div>

                {/* Descrição */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descrição *
                  </label>
                  <textarea
                    value={productForm.description}
                    onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                    rows={3}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none ${
                      errors.description ? 'border-error' : 'border-gray-300'
                    }`}
                    placeholder="Descreva os ingredientes e características do produto..."
                  />
                  {errors.description && (
                    <p className="text-error text-sm mt-1">{errors.description}</p>
                  )}
                </div>

                {/* Preço e Categoria */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Preço (R$) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={productForm.price}
                      onChange={(e) => setProductForm({ ...productForm, price: parseFloat(e.target.value) || 0 })}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors ${
                        errors.price ? 'border-error' : 'border-gray-300'
                      }`}
                      placeholder="0.00"
                    />
                    {errors.price && (
                      <p className="text-error text-sm mt-1">{errors.price}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Categoria
                    </label>
                    <select
                      value={productForm.category}
                      onChange={(e) => setProductForm({ ...productForm, category: e.target.value as ProductCategory })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                    >
                      {Object.entries(categoryDisplayMap).map(([key, value]) => (
                        <option key={key} value={key}>
                          {value}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Imagem */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    URL da Imagem
                  </label>
                  <input
                    type="url"
                    value={productForm.imageUrl}
                    onChange={(e) => setProductForm({ ...productForm, imageUrl: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                    placeholder="https://exemplo.com/imagem.jpg"
                  />
                  {productForm.imageUrl && (
                    <div className="mt-2">
                      <img
                        src={productForm.imageUrl}
                        alt="Preview"
                        className="w-32 h-24 object-cover rounded-lg border"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Disponibilidade */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="available"
                    checked={productForm.available}
                    onChange={(e) => setProductForm({ ...productForm, available: e.target.checked })}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  />
                  <label htmlFor="available" className="ml-2 text-sm text-gray-700">
                    Produto disponível para pedidos
                  </label>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end space-x-3 mt-6 pt-6 border-t">
                <button
                  onClick={closeProductModal}
                  className="btn btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveProduct}
                  disabled={saving}
                  className="btn btn-primary"
                >
                  {saving ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <FaSave className="mr-2" />
                  )}
                  {editingProduct ? 'Salvar Alterações' : 'Adicionar Produto'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Nova Seção */}
      {showSectionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Nova Seção</h3>
                <button
                  onClick={closeSectionModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              {/* Form */}
              <div className="space-y-4">
                {/* Nome da Seção */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome da Seção *
                  </label>
                  <input
                    type="text"
                    value={sectionForm.name}
                    onChange={(e) => setSectionForm({ ...sectionForm, name: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                      sectionErrors.name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Ex: Pratos Principais, Bebidas, Sobremesas"
                  />
                  {sectionErrors.name && (
                    <p className="text-red-500 text-sm mt-1">{sectionErrors.name}</p>
                  )}
                </div>

                {/* Descrição */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descrição *
                  </label>
                  <textarea
                    value={sectionForm.description}
                    onChange={(e) => setSectionForm({ ...sectionForm, description: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                      sectionErrors.description ? 'border-red-500' : 'border-gray-300'
                    }`}
                    rows={3}
                    placeholder="Descreva esta seção do cardápio"
                  />
                  {sectionErrors.description && (
                    <p className="text-red-500 text-sm mt-1">{sectionErrors.description}</p>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end space-x-3 mt-6 pt-6 border-t">
                <button
                  onClick={closeSectionModal}
                  className="btn btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveSection}
                  className="btn btn-primary"
                >
                  <FaPlus className="mr-2" />
                  Criar Seção
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}