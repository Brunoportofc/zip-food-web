'use client';

import React, { useState, useEffect } from 'react';
import { 
  FaPlus, FaEdit, FaTrash, FaEye, FaEyeSlash, 
  FaUtensils, FaSearch, FaFilter, FaSave, FaSpinner 
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image?: string;
  available: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const menuCategories = [
  'Entradas', 'Pratos Principais', 'Sobremesas', 'Bebidas', 'Especiais'
];

export default function MenuTab() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [saving, setSaving] = useState(false);

  const [itemForm, setItemForm] = useState({
    name: '',
    description: '',
    price: 0,
    category: '',
    available: true
  });

  useEffect(() => {
    loadMenuItems();
  }, []);

  const loadMenuItems = async () => {
    try {
      setLoading(true);
      
      // Dados simulados - em produção viria da API
      const mockItems: MenuItem[] = [
        {
          id: '1',
          name: 'Pizza Margherita',
          description: 'Pizza tradicional com molho de tomate, mussarela e manjericão',
          price: 35.90,
          category: 'Pratos Principais',
          available: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: '2',
          name: 'Hambúrguer Artesanal',
          description: 'Hambúrguer 180g com queijo, alface, tomate e batata frita',
          price: 28.50,
          category: 'Pratos Principais',
          available: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: '3',
          name: 'Salada Caesar',
          description: 'Alface americana, croutons, parmesão e molho caesar',
          price: 22.90,
          category: 'Entradas',
          available: false,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: '4',
          name: 'Tiramisu',
          description: 'Sobremesa italiana com café, mascarpone e cacau',
          price: 18.90,
          category: 'Sobremesas',
          available: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: '5',
          name: 'Refrigerante Lata',
          description: 'Coca-Cola, Pepsi, Guaraná ou Fanta - 350ml',
          price: 5.50,
          category: 'Bebidas',
          available: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      
      setMenuItems(mockItems);
    } catch (error) {
      console.error('Erro ao carregar cardápio:', error);
      toast.error('Erro ao carregar cardápio');
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleInputChange = (field: string, value: any) => {
    setItemForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const openModal = (item?: MenuItem) => {
    if (item) {
      setEditingItem(item);
      setItemForm({
        name: item.name,
        description: item.description,
        price: item.price,
        category: item.category,
        available: item.available
      });
    } else {
      setEditingItem(null);
      setItemForm({
        name: '',
        description: '',
        price: 0,
        category: '',
        available: true
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingItem(null);
    setItemForm({
      name: '',
      description: '',
      price: 0,
      category: '',
      available: true
    });
  };

  const handleSubmit = async () => {
    if (!itemForm.name || !itemForm.category || itemForm.price <= 0) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setSaving(true);
    try {
      if (editingItem) {
        // Atualizar item existente
        const updatedItem: MenuItem = {
          ...editingItem,
          ...itemForm,
          updatedAt: new Date()
        };
        
        setMenuItems(prev => prev.map(item => 
          item.id === editingItem.id ? updatedItem : item
        ));
        
        toast.success('Item atualizado com sucesso!');
      } else {
        // Criar novo item
        const newItem: MenuItem = {
          id: Date.now().toString(),
          ...itemForm,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        setMenuItems(prev => [...prev, newItem]);
        toast.success('Item adicionado com sucesso!');
      }
      
      closeModal();
    } catch (error) {
      console.error('Erro ao salvar item:', error);
      toast.error('Erro ao salvar item');
    } finally {
      setSaving(false);
    }
  };

  const toggleAvailability = async (id: string) => {
    try {
      setMenuItems(prev => prev.map(item => 
        item.id === id 
          ? { ...item, available: !item.available, updatedAt: new Date() }
          : item
      ));
      
      const item = menuItems.find(item => item.id === id);
      toast.success(`Item ${item?.available ? 'desabilitado' : 'habilitado'} com sucesso!`);
    } catch (error) {
      console.error('Erro ao alterar disponibilidade:', error);
      toast.error('Erro ao alterar disponibilidade');
    }
  };

  const deleteItem = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este item?')) {
      return;
    }

    try {
      setMenuItems(prev => prev.filter(item => item.id !== id));
      toast.success('Item excluído com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir item:', error);
      toast.error('Erro ao excluir item');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando cardápio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Cardápio</h2>
          <p className="text-gray-600 mt-1">Gerencie os itens do seu cardápio</p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
        >
          <FaPlus className="w-4 h-4" />
          <span>Adicionar Item</span>
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex-1">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar itens..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <FaFilter className="text-gray-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500"
              >
                <option value="">Todas as categorias</option>
                {menuCategories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Itens */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Itens do Cardápio ({filteredItems.length})
          </h3>
        </div>
        
        {filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <FaUtensils className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">
              {searchTerm || selectedCategory ? 'Nenhum item encontrado' : 'Nenhum item no cardápio'}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              {searchTerm || selectedCategory ? 'Tente ajustar os filtros' : 'Adicione itens para começar'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredItems.map((item) => (
              <div key={item.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h4 className="text-lg font-semibold text-gray-900">{item.name}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        item.available 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {item.available ? 'Disponível' : 'Indisponível'}
                      </span>
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                        {item.category}
                      </span>
                    </div>
                    <p className="text-gray-600 mt-1">{item.description}</p>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-2xl font-bold text-green-600">
                        R$ {item.price.toFixed(2)}
                      </span>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => toggleAvailability(item.id)}
                          className={`p-2 rounded-lg transition-colors ${
                            item.available
                              ? 'text-green-600 hover:bg-green-100'
                              : 'text-red-600 hover:bg-red-100'
                          }`}
                          title={item.available ? 'Desabilitar item' : 'Habilitar item'}
                        >
                          {item.available ? <FaEye /> : <FaEyeSlash />}
                        </button>
                        <button
                          onClick={() => openModal(item)}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                          title="Editar item"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => deleteItem(item.id)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                          title="Excluir item"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Adicionar/Editar Item */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingItem ? 'Editar Item' : 'Adicionar Item'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nome *</label>
                <input
                  type="text"
                  value={itemForm.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="Nome do item"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
                <textarea
                  value={itemForm.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="Descrição do item"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Preço (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={itemForm.price}
                    onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Categoria *</label>
                  <select
                    value={itemForm.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  >
                    <option value="">Selecione</option>
                    {menuCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="available"
                  checked={itemForm.available}
                  onChange={(e) => handleInputChange('available', e.target.checked)}
                  className="mr-2 rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
                <label htmlFor="available" className="text-sm text-gray-700">
                  Item disponível
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                onClick={closeModal}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                disabled={saving}
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <FaSpinner className="w-4 h-4 animate-spin" />
                    <span>Salvando...</span>
                  </>
                ) : (
                  <>
                    <FaSave className="w-4 h-4" />
                    <span>{editingItem ? 'Atualizar' : 'Adicionar'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}