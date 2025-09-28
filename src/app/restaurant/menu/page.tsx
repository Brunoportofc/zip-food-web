'use client';

import React, { useState, useEffect } from 'react';
import { 
  MdAdd, 
  MdEdit, 
  MdDelete, 
  MdVisibility, 
  MdVisibilityOff,
  MdSearch,
  MdFilterList,
  MdPhotoCamera,
  MdSave,
  MdCancel
} from 'react-icons/md';
import { FaUtensils, FaImage } from 'react-icons/fa';
import ImageUpload from '@/components/ui/ImageUpload';

// Tipos
interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url?: string;
  is_available: boolean;
  preparation_time: number;
  ingredients?: string[];
  allergens?: string[];
  nutritional_info?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
  };
  created_at: Date;
  updated_at: Date;
}

interface MenuCategory {
  id: string;
  name: string;
  description?: string;
  order: number;
  is_active: boolean;
}

const MenuManagement = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showOnlyAvailable, setShowOnlyAvailable] = useState<boolean | null>(null);
  
  // Estados do modal
  const [showItemModal, setShowItemModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [editingCategory, setEditingCategory] = useState<MenuCategory | null>(null);
  const [isClosingModal, setIsClosingModal] = useState(false);

  // Estados do formulário de item
  const [itemForm, setItemForm] = useState({
    name: '',
    description: '',
    price: 0,
    category: '',
    image_url: '',
    is_available: true,
    preparation_time: 15,
    ingredients: [] as string[],
    allergens: [] as string[]
  });

  // Estados do formulário de categoria
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    order: 0,
    is_active: true
  });

  // Carregar dados iniciais
  useEffect(() => {
    loadMenuData();
  }, []);

  const loadMenuData = async () => {
    try {
      setLoading(true);
      await Promise.all([loadMenuItems(), loadCategories()]);
    } catch (error) {
      console.error('Erro ao carregar dados do menu:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMenuItems = async () => {
    try {
      const response = await fetch('/api/menu', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setMenuItems(data.data.items || []);
      }
    } catch (error) {
      console.error('Erro ao carregar itens do menu:', error);
    }
  };

  const loadCategories = async () => {
    // Por enquanto, categorias estáticas - depois podemos criar API
    const defaultCategories = [
      { id: 'entradas', name: 'Entradas', description: 'Pratos para começar', order: 1, is_active: true },
      { id: 'principais', name: 'Pratos Principais', description: 'Pratos principais', order: 2, is_active: true },
      { id: 'bebidas', name: 'Bebidas', description: 'Bebidas diversas', order: 3, is_active: true },
      { id: 'sobremesas', name: 'Sobremesas', description: 'Doces e sobremesas', order: 4, is_active: true },
      { id: 'lanches', name: 'Lanches', description: 'Lanches rápidos', order: 5, is_active: true },
      { id: 'pizzas', name: 'Pizzas', description: 'Pizzas variadas', order: 6, is_active: true },
      { id: 'massas', name: 'Massas', description: 'Massas e molhos', order: 7, is_active: true },
      { id: 'saladas', name: 'Saladas', description: 'Saladas frescas', order: 8, is_active: true }
    ];
    setCategories(defaultCategories);
  };

  // Filtrar itens
  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesAvailability = showOnlyAvailable === null || item.is_available === showOnlyAvailable;
    
    return matchesSearch && matchesCategory && matchesAvailability;
  });

  // Agrupar por categoria
  const itemsByCategory = filteredItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  // Funções CRUD de itens
  const handleSaveItem = async () => {
    try {
      const method = editingItem ? 'PUT' : 'POST';
      const url = editingItem ? `/api/menu?id=${editingItem.id}` : '/api/menu';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: itemForm.name,
          description: itemForm.description,
          price: Number(itemForm.price),
          category: itemForm.category,
          imageUrl: itemForm.image_url,
          isAvailable: itemForm.is_available,
          preparationTime: Number(itemForm.preparation_time),
          ingredients: itemForm.ingredients,
          allergens: itemForm.allergens
        })
      });

      if (response.ok) {
        await loadMenuItems();
        closeItemModal();
      } else {
        const error = await response.json();
        alert(error.message || 'Erro ao salvar item');
      }
    } catch (error) {
      console.error('Erro ao salvar item:', error);
      alert('Erro ao salvar item do menu');
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Tem certeza que deseja excluir este item?')) return;

    try {
      const response = await fetch(`/api/menu?id=${itemId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        await loadMenuItems();
      } else {
        const error = await response.json();
        alert(error.message || 'Erro ao excluir item');
      }
    } catch (error) {
      console.error('Erro ao excluir item:', error);
      alert('Erro ao excluir item do menu');
    }
  };

  const handleToggleAvailability = async (item: MenuItem) => {
    try {
      const response = await fetch(`/api/menu?id=${item.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          isAvailable: !item.is_available
        })
      });

      if (response.ok) {
        await loadMenuItems();
      }
    } catch (error) {
      console.error('Erro ao alterar disponibilidade:', error);
    }
  };

  // Funções de modal
  const openItemModal = (item?: MenuItem) => {
    if (item) {
      setEditingItem(item);
      setItemForm({
        name: item.name,
        description: item.description,
        price: item.price,
        category: item.category,
        image_url: item.image_url || '',
        is_available: item.is_available,
        preparation_time: item.preparation_time,
        ingredients: item.ingredients || [],
        allergens: item.allergens || []
      });
    } else {
      setEditingItem(null);
      setItemForm({
        name: '',
        description: '',
        price: 0,
        category: categories[0]?.id || '',
        image_url: '',
        is_available: true,
        preparation_time: 15,
        ingredients: [],
        allergens: []
      });
    }
    setShowItemModal(true);
  };

  const closeItemModal = () => {
    setIsClosingModal(true);
    setTimeout(() => {
      setShowItemModal(false);
      setEditingItem(null);
      setIsClosingModal(false);
    }, 200); // Tempo da animação de saída
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
          <FaUtensils className="mr-3 text-red-500" />
          Gestão do Menu
        </h1>
        <p className="text-gray-600">
          Gerencie os itens do seu menu, categorias e disponibilidade
        </p>
      </div>

      {/* Filtros e Busca */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          {/* Busca */}
          <div className="relative flex-1 max-w-md">
            <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl" />
            <input
              type="text"
              placeholder="Buscar itens do menu..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900 placeholder-gray-400"
            />
          </div>

          {/* Filtros */}
          <div className="flex gap-3">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 text-gray-900 bg-white"
            >
              <option value="all">Todas as categorias</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>

            <select
              value={showOnlyAvailable === null ? 'all' : showOnlyAvailable ? 'available' : 'unavailable'}
              onChange={(e) => {
                if (e.target.value === 'all') setShowOnlyAvailable(null);
                else setShowOnlyAvailable(e.target.value === 'available');
              }}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 text-gray-900 bg-white"
            >
              <option value="all">Todos os status</option>
              <option value="available">Disponíveis</option>
              <option value="unavailable">Indisponíveis</option>
            </select>

            <button
              onClick={() => openItemModal()}
              className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 hover:scale-105 transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl"
            >
              <MdAdd className="text-xl" />
              Novo Item
            </button>
          </div>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Total de Itens</h3>
          <p className="text-2xl font-bold text-gray-900">{menuItems.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Disponíveis</h3>
          <p className="text-2xl font-bold text-green-600">{menuItems.filter(item => item.is_available).length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Indisponíveis</h3>
          <p className="text-2xl font-bold text-red-600">{menuItems.filter(item => !item.is_available).length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Categorias</h3>
          <p className="text-2xl font-bold text-blue-600">{categories.length}</p>
        </div>
      </div>

      {/* Lista de Itens por Categoria */}
      <div className="space-y-6">
        {Object.entries(itemsByCategory).map(([categoryId, items]) => {
          const category = categories.find(c => c.id === categoryId);
          const categoryName = category?.name || categoryId;

          return (
            <div key={categoryId} className="bg-white rounded-xl shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">{categoryName}</h2>
                <p className="text-gray-600">{items.length} itens</p>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {items.map(item => (
                    <div key={item.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      {/* Imagem */}
                      <div className="relative mb-3">
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="w-full h-32 object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                            <FaImage className="text-gray-400 text-2xl" />
                          </div>
                        )}
                        
                        {/* Status Badge */}
                        <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium ${
                          item.is_available 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {item.is_available ? 'Disponível' : 'Indisponível'}
                        </div>
                      </div>

                      {/* Informações */}
                      <h3 className="font-semibold text-gray-900 mb-1">{item.name}</h3>
                      <p className="text-gray-600 text-sm mb-2 line-clamp-2">{item.description}</p>
                      <p className="text-lg font-bold text-red-500 mb-3">
                        R$ {item.price.toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500 mb-3">
                        Preparo: {item.preparation_time} min
                      </p>

                      {/* Ações */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleToggleAvailability(item)}
                          className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 ${
                            item.is_available
                              ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 hover:shadow-md'
                              : 'bg-green-100 text-green-800 hover:bg-green-200 hover:shadow-md'
                          }`}
                        >
                          {item.is_available ? <MdVisibilityOff /> : <MdVisibility />}
                        </button>
                        
                        <button
                          onClick={() => openItemModal(item)}
                          className="flex-1 px-3 py-2 bg-blue-100 text-blue-800 rounded-lg text-sm font-medium hover:bg-blue-200 hover:scale-105 hover:shadow-md transition-all duration-200"
                        >
                          <MdEdit />
                        </button>
                        
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="flex-1 px-3 py-2 bg-red-100 text-red-800 rounded-lg text-sm font-medium hover:bg-red-200 hover:scale-105 hover:shadow-md transition-all duration-200"
                        >
                          <MdDelete />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}

        {filteredItems.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <FaUtensils className="text-gray-300 text-6xl mb-4 mx-auto" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhum item encontrado</h3>
            <p className="text-gray-600 mb-6">
              {menuItems.length === 0 
                ? 'Comece adicionando itens ao seu menu' 
                : 'Tente ajustar os filtros ou criar um novo item'
              }
            </p>
            <button
              onClick={() => openItemModal()}
              className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Adicionar Primeiro Item
            </button>
          </div>
        )}
      </div>

      {/* Modal de Item */}
      {showItemModal && (
        <div 
          className={`fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-200 ${
            isClosingModal ? 'opacity-0' : 'opacity-100'
          }`}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeItemModal();
            }
          }}
        >
          <div className={`bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl transition-all duration-300 ${
            isClosingModal ? 'scale-95 opacity-0 translate-y-4' : 'scale-100 opacity-100 translate-y-0'
          }`}>
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingItem ? 'Editar Item' : 'Novo Item'}
              </h2>
            </div>

            <div className="p-6 space-y-4">
              {/* Nome */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome do Item *
                </label>
                <input
                  type="text"
                  value={itemForm.name}
                  onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 text-gray-900 placeholder-gray-400"
                  placeholder="Ex: Hambúrguer Artesanal"
                />
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição *
                </label>
                <textarea
                  value={itemForm.description}
                  onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 text-gray-900 placeholder-gray-400"
                  placeholder="Descreva o item do menu..."
                />
              </div>

              {/* Preço e Categoria */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preço (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={itemForm.price}
                    onChange={(e) => setItemForm({ ...itemForm, price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categoria *
                  </label>
                  <select
                    value={itemForm.category}
                    onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 text-gray-900 bg-white"
                  >
                    <option value="">Selecione uma categoria</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Upload da Imagem */}
              <div>
                <ImageUpload
                  type="cover"
                  currentImage={itemForm.image_url}
                  onImageChange={(url) => setItemForm({ ...itemForm, image_url: url })}
                  label="Imagem do Item"
                  disabled={false}
                />
              </div>

              {/* Tempo de Preparo e Disponibilidade */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tempo de Preparo (min)
                  </label>
                  <input
                    type="number"
                    value={itemForm.preparation_time}
                    onChange={(e) => setItemForm({ ...itemForm, preparation_time: parseInt(e.target.value) || 15 })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 text-gray-900"
                  />
                </div>

                <div className="flex items-center">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={itemForm.is_available}
                      onChange={(e) => setItemForm({ ...itemForm, is_available: e.target.checked })}
                      className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700">
                      Item disponível
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Ações do Modal */}
            <div className="p-6 border-t border-gray-200 flex gap-3 justify-end">
              <button
                onClick={closeItemModal}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <MdCancel />
                Cancelar
              </button>
              <button
                onClick={handleSaveItem}
                className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
              >
                <MdSave />
                {editingItem ? 'Atualizar' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuManagement;
