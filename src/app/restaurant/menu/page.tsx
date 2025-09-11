'use client';

import { useState, useEffect } from 'react';
import AnimatedContainer from '@/components/AnimatedContainer';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

import { 
  MdAdd, 
  MdEdit, 
  MdDelete, 
  MdVisibility, 
  MdVisibilityOff,
  MdRestaurantMenu,
  MdSearch,
  MdFilterList,
  MdClose,
  MdSave,
  MdCancel
} from 'react-icons/md';
import toast from 'react-hot-toast';
import { menuService, MenuItem as MenuServiceItem, MenuCategory } from '@/services/menu.service';
import { restaurantConfigService } from '@/services/restaurant-config.service';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image?: string;
  available: boolean;
}

export default function RestaurantMenu() {

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [restaurantId] = useState('restaurant-1'); // Em produção, viria da autenticação

  // Initialize menu items after translations are ready
  useEffect(() => {
    loadMenuData();
  }, []);

  const loadMenuData = async () => {
    try {
      setLoading(true);
      
      // Sincronizar menu com dados do restaurante
      await menuService.syncWithRestaurantData(restaurantId);
      
      // Carregar itens e categorias
      const [items, cats] = await Promise.all([
        menuService.getMenuItems(restaurantId),
        menuService.getMenuCategories(restaurantId)
      ]);
      
      // Converter para o formato local
      const convertedItems: MenuItem[] = items.map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        price: item.price,
        category: item.category,
        image: item.image,
        available: item.available
      }));
      
      setMenuItems(convertedItems);
      setCategories(cats);
      
      // Configurar listener para atualizações em tempo real
      const unsubscribe = menuService.addListener((updatedItems) => {
        const filteredItems = updatedItems.filter(item => item.restaurantId === restaurantId);
        const convertedUpdatedItems: MenuItem[] = filteredItems.map(item => ({
          id: item.id,
          name: item.name,
          description: item.description,
          price: item.price,
          category: item.category,
          image: item.image,
          available: item.available
        }));
        setMenuItems(convertedUpdatedItems);
      });
      
      return () => unsubscribe();
    } catch (error) {
      console.error('Erro ao carregar menu:', error);
      toast.error('Erro ao carregar menu');
    } finally {
      setLoading(false);
    }
  };

  const [isAddingItem, setIsAddingItem] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [newItem, setNewItem] = useState<Partial<MenuItem>>({
    name: '',
    description: '',
    price: 0,
    category: '',
    available: true,
    image: ''
  });

  const handleAddItem = async () => {
    try {
      const menuServiceItem: Omit<MenuServiceItem, 'id'> = {
        restaurantId,
        name: newItem.name || '',
        description: newItem.description || '',
        price: Number(newItem.price) || 0,
        category: newItem.category || '',
        available: newItem.available || true,
        image: newItem.image,
        preparationTime: 15
      };

      await menuService.addMenuItem(menuServiceItem);
      await loadMenuData(); // Recarregar dados
      resetForm();
      setIsAddingItem(false);
      toast.success('Item adicionado com sucesso!');
    } catch (error) {
      console.error('Erro ao adicionar item:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao adicionar item');
    }
  };

  const handleEditItem = (item: MenuItem) => {
    setEditingItem(item);
    setNewItem({
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
      available: item.available,
      image: item.image
    });
    setIsAddingItem(true);
  };

  const handleUpdateItem = async () => {
    if (!editingItem) return;

    try {
      const updatedData = {
        name: newItem.name,
        description: newItem.description,
        price: Number(newItem.price),
        category: newItem.category,
        available: newItem.available || true,
        image: newItem.image
      };

      await menuService.updateMenuItem(editingItem.id, updatedData);
      await loadMenuData(); // Recarregar dados
      resetForm();
      setIsAddingItem(false);
      setEditingItem(null);
      toast.success('Item atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar item:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao atualizar item');
    }
  };

  const resetForm = () => {
    setNewItem({
      name: '',
      description: '',
      price: 0,
      category: '',
      available: true,
      image: ''
    });
  };

  const handleCancelEdit = () => {
    resetForm();
    setIsAddingItem(false);
    setEditingItem(null);
  };

  const handleToggleAvailability = async (id: string) => {
    try {
      const item = menuItems.find(item => item.id === id);
      if (!item) return;

      await menuService.updateMenuItem(id, { available: !item.available });
      await loadMenuData(); // Recarregar dados
      toast.success(`${item.name} ${item.available ? 'desativado' : 'ativado'} com sucesso!`);
    } catch (error) {
      console.error('Erro ao alterar disponibilidade:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao alterar disponibilidade');
    }
  };

  const handleDeleteItem = async (id: string) => {
    const item = menuItems.find(item => item.id === id);
    if (confirm(`Tem certeza que deseja excluir "${item?.name}"?`)) {
      try {
        await menuService.deleteMenuItem(id);
        await loadMenuData(); // Recarregar dados
        toast.success('Item excluído com sucesso!');
      } catch (error) {
        console.error('Erro ao excluir item:', error);
        toast.error(error instanceof Error ? error.message : 'Erro ao excluir item');
      }
    }
  };

  const filterCategories = ['Todos', ...new Set(menuItems.map((item) => item.category))];
  
  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'Todos' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryColor = (category: string) => {
    const colors = {
      'Hambúrgueres': 'bg-red-100 text-red-800',
      'Pizzas': 'bg-orange-100 text-orange-800',
      'Bebidas': 'bg-blue-100 text-blue-800',
      'Acompanhamentos': 'bg-yellow-100 text-yellow-800',
      'Saladas': 'bg-green-100 text-green-800',
      'Sobremesas': 'bg-purple-100 text-purple-800',
      'Pratos Principais': 'bg-red-100 text-red-800',
      'Entradas': 'bg-green-100 text-green-800',
      'Lanches': 'bg-yellow-100 text-yellow-800'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <AnimatedContainer animationType="fadeInDown" delay={100}>
        <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-2xl p-4 lg:p-8 text-white">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
            <div>
              <h1 className="text-2xl lg:text-4xl font-bold mb-2 flex items-center">
                <MdRestaurantMenu className="mr-2 lg:mr-3" size={24} />
                Gerenciar Menu
              </h1>
              <p className="text-red-100 text-sm lg:text-lg hidden sm:block">Adicione, edite e organize os itens do seu cardápio</p>
            </div>
            <button
              onClick={() => setIsAddingItem(!isAddingItem)}
              className="bg-white text-red-600 px-4 lg:px-6 py-2 lg:py-3 rounded-xl font-semibold hover:bg-red-50 transition-colors flex items-center space-x-2 text-sm lg:text-base w-full sm:w-auto justify-center"
            >
              {isAddingItem ? (
                <>
                  <MdClose size={18} />
                  <span>Cancelar</span>
                </>
              ) : (
                <>
                  <MdAdd size={18} />
                  <span>Novo Item</span>
                </>
              )}
            </button>
          </div>
        </div>
      </AnimatedContainer>

      {/* Search and Filters */}
      <AnimatedContainer animationType="fadeInUp" delay={200}>
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 lg:p-6">
          <div className="flex flex-col gap-4">
            <div className="flex-1 relative">
              <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Buscar itens do menu..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 lg:py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm lg:text-base text-black"
              />
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1 sm:flex-none">
                <MdFilterList className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full pl-10 pr-8 py-2 lg:py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent appearance-none bg-white text-sm lg:text-base"
                >
                  {filterCategories.map(category => (
                    <option key={category} value={category}>
                      {category === 'Todos' ? 'Todas as Categorias' :
            category === 'Hambúrgueres' ? 'Hambúrgueres' :
            category === 'Pizzas' ? 'Pizzas' :
            category === 'Bebidas' ? 'Bebidas' :
            category === 'Acompanhamentos' ? 'Acompanhamentos' :
            category === 'Saladas' ? 'Saladas' :
            category === 'Sobremesas' ? 'Sobremesas' :
            category === 'Pratos Principais' ? 'Pratos Principais' :
            category === 'Entradas' ? 'Entradas' :
            category === 'Lanches' ? 'Lanches' :
            category}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex bg-gray-100 rounded-xl p-1 w-full sm:w-auto">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`flex-1 sm:flex-none px-3 lg:px-4 py-2 rounded-lg transition-colors text-sm lg:text-base ${
                    viewMode === 'grid' ? 'bg-white shadow-sm text-red-600' : 'text-gray-600'
                  }`}
                >
                  Grade
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    viewMode === 'list' ? 'bg-white shadow-sm text-red-600' : 'text-gray-600'
                  }`}
                >
                  Lista
                </button>
              </div>
            </div>
          </div>
        </div>
      </AnimatedContainer>

      {/* Add/Edit Form */}
      {isAddingItem && (
        <AnimatedContainer animationType="fadeInDown" delay={100}>
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 lg:p-8">
            <h2 className="text-xl lg:text-2xl font-bold text-gray-900 mb-4 lg:mb-6 flex items-center">
              {editingItem ? <MdEdit className="mr-2" size={20} /> : <MdAdd className="mr-2" size={20} />}
              {editingItem ? 'Editar Item' : 'Novo Item'}
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
              <Input
                label="Nome do Item"
                placeholder="Ex: Big Burger"
                value={newItem.name || ''}
                onChangeText={(text) => setNewItem({ ...newItem, name: text })}
              />
              <Input
                label="Categoria"
                placeholder="Selecione uma categoria"
                value={newItem.category || ''}
                onChangeText={(text) => setNewItem({ ...newItem, category: text })}
              />
              <Input
                label="Preço"
                placeholder="0.00"
                value={newItem.price?.toString() || ''}
                onChangeText={(text) => setNewItem({ ...newItem, price: parseFloat(text) || 0 })}
                keyboardType="numeric"
              />
              <Input
                label="URL da Imagem"
                placeholder="https://exemplo.com/imagem.jpg"
                value={newItem.image || ''}
                onChangeText={(text) => setNewItem({ ...newItem, image: text })}
              />
              <div className="md:col-span-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descrição
                  </label>
                  <textarea
                    placeholder="Descreva o item do menu..."
                    value={newItem.description || ''}
                    onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 resize-none text-black"
                  />
                </div>
              </div>
              <div className="md:col-span-2 flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="available"
                  checked={newItem.available}
                  onChange={(e) => setNewItem({ ...newItem, available: e.target.checked })}
                  className="w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500"
                />
                <label htmlFor="available" className="text-gray-700 font-medium">
                  Disponível para pedidos
                </label>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 mt-6 lg:mt-8">
              <button
                onClick={handleCancelEdit}
                className="px-4 lg:px-6 py-2 lg:py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2 text-sm lg:text-base"
              >
                <MdCancel size={18} />
                <span>Cancelar</span>
              </button>
              <button
                onClick={editingItem ? handleUpdateItem : handleAddItem}
                className="px-4 lg:px-6 py-2 lg:py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors flex items-center justify-center space-x-2 text-sm lg:text-base"
              >
                <MdSave size={18} />
                <span>{editingItem ? 'Atualizar' : 'Salvar'}</span>
              </button>
            </div>
          </div>
        </AnimatedContainer>
      )}

      {/* Menu Items */}
      {filteredItems.length === 0 ? (
        <AnimatedContainer animationType="fadeInUp" delay={300}>
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
            <MdRestaurantMenu className="mx-auto text-gray-300 mb-4" size={64} />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {searchTerm || selectedCategory !== 'Todos' ? 'Nenhum item encontrado' : 'Menu vazio'}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchTerm || selectedCategory !== 'Todos' 
                ? 'Tente ajustar os filtros de busca'
          : 'Comece adicionando itens ao seu menu'
              }
            </p>
            {!searchTerm && selectedCategory === 'Todos' && (
              <button
                onClick={() => setIsAddingItem(true)}
                className="bg-red-600 text-white px-6 py-3 rounded-xl hover:bg-red-700 transition-colors flex items-center space-x-2 mx-auto"
              >
                <MdAdd size={20} />
                <span>Adicionar Primeiro Item</span>
              </button>
            )}
          </div>
        </AnimatedContainer>
      ) : (
        <AnimatedContainer animationType="fadeInUp" delay={300}>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
              {filteredItems.map((item, index) => (
                <div key={item.id} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow">
                  <div className="relative">
                    <div className="h-40 lg:h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                      {item.image ? (
                        <img 
                          src={item.image} 
                          alt={item.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                            if (nextElement) {
                              nextElement.style.display = 'flex';
                            }
                          }}
                        />
                      ) : null}
                      <div className="flex items-center justify-center text-gray-400" style={{display: item.image ? 'none' : 'flex'}}>
                        <MdRestaurantMenu size={48} />
                      </div>
                    </div>
                    <div className="absolute top-4 left-4">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getCategoryColor(item.category)}`}>
                        {item.category}
                      </span>
                    </div>
                    <div className="absolute top-4 right-4">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        item.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {item.available ? 'Disponível' : 'Indisponível'}
                      </span>
                    </div>
                  </div>
                  <div className="p-4 lg:p-6">
                    <h3 className="text-lg lg:text-xl font-bold text-gray-900 mb-2">{item.name}</h3>
                    <p className="text-gray-600 text-xs lg:text-sm mb-3 lg:mb-4 line-clamp-2">{item.description}</p>
                    <div className="flex items-center justify-between mb-3 lg:mb-4">
                      <span className="text-xl lg:text-2xl font-bold text-red-600">R$ {item.price.toFixed(2)}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        onClick={() => handleEditItem(item)}
                        className="flex-1 bg-blue-50 text-blue-600 py-2 px-3 lg:px-4 rounded-xl hover:bg-blue-100 transition-colors flex items-center justify-center space-x-2 text-sm lg:text-base"
                      >
                        <MdEdit size={14} />
                        <span>Editar</span>
                      </button>
                      <button
                        onClick={() => handleToggleAvailability(item.id)}
                        className={`flex-1 py-2 px-3 lg:px-4 rounded-xl transition-colors flex items-center justify-center space-x-2 text-sm lg:text-base ${
                          item.available 
                            ? 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100' 
                            : 'bg-green-50 text-green-600 hover:bg-green-100'
                        }`}
                      >
                        {item.available ? <MdVisibilityOff size={14} /> : <MdVisibility size={14} />}
                        <span className="hidden sm:inline">{item.available ? 'Ocultar' : 'Mostrar'}</span>
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="bg-red-50 text-red-600 py-2 px-3 lg:px-4 rounded-xl hover:bg-red-100 transition-colors flex items-center justify-center sm:w-auto w-full"
                      >
                        <MdDelete size={14} />
                        <span className="sm:hidden ml-2">Excluir</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoria</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Preço</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredItems.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center">
                              {item.image ? (
                                <img 
                                  src={item.image} 
                                  alt={item.name}
                                  className="w-full h-full object-cover rounded-xl"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                                    if (nextElement) {
                                      nextElement.style.display = 'flex';
                                    }
                                  }}
                                />
                              ) : null}
                              <MdRestaurantMenu className="text-gray-400" size={20} style={{display: item.image ? 'none' : 'block'}} />
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">{item.name}</div>
                              <div className="text-sm text-gray-500 max-w-xs truncate">{item.description}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getCategoryColor(item.category)}`}>
                            {item.category}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-gray-900">R$ {item.price.toFixed(2)}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                            item.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {item.available ? 'Disponível' : 'Indisponível'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEditItem(item)}
                              className="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Editar"
                            >
                              <MdEdit size={16} />
                            </button>
                            <button
                              onClick={() => handleToggleAvailability(item.id)}
                              className={`p-2 rounded-lg transition-colors ${
                                item.available 
                                  ? 'text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50' 
                                  : 'text-green-600 hover:text-green-800 hover:bg-green-50'
                              }`}
                              title={item.available ? 'Ocultar' : 'Mostrar'}
                            >
                              {item.available ? <MdVisibilityOff size={16} /> : <MdVisibility size={16} />}
                            </button>
                            <button
                              onClick={() => handleDeleteItem(item.id)}
                              className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded-lg transition-colors"
                              title="Excluir"
                            >
                              <MdDelete size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </AnimatedContainer>
      )}
    </div>
  );
}