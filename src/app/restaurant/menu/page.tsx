'use client';

import { useState, useEffect } from 'react';
import AnimatedContainer from '@/components/AnimatedContainer';
import CustomButton from '@/components/CustomButton';
import CustomInput from '@/components/CustomInput';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);

  // Initialize menu items after translations are ready
  useEffect(() => {
    const initialMenuItems: MenuItem[] = [
      {
        id: '1',
        name: t('mock_data.menu_items.big_burger'),
        description: t('mock_data.menu_items.big_burger_desc'),
        price: 29.90,
        category: t('restaurant.mock_data.default_categories.hamburgers'),
        image: '/images/big-burger.jpg',
        available: true,
      },
      {
        id: '2',
        name: t('mock_data.menu_items.french_fries'),
        description: t('mock_data.menu_items.french_fries_desc'),
        price: 15.90,
        category: t('restaurant.mock_data.default_categories.sides'),
        image: '/images/french-fries.jpg',
        available: true,
      },
      {
        id: '3',
        name: t('mock_data.menu_items.chocolate_cake'),
        description: t('mock_data.menu_items.chocolate_cake_desc'),
        price: 18.90,
        category: t('restaurant.mock_data.default_categories.desserts'),
        image: '/images/chocolate-cake.jpg',
        available: true,
      },
      {
        id: '4',
        name: t('mock_data.menu_items.chicken_burger'),
        description: t('mock_data.menu_items.chicken_burger_desc'),
        price: 45.90,
        category: t('restaurant.mock_data.default_categories.hamburgers'),
        image: '/images/chicken-burger.jpg',
        available: true,
      },
      {
        id: '5',
        name: t('mock_data.menu_items.veggie_burger'),
        description: t('mock_data.menu_items.veggie_burger_desc'),
        price: 22.90,
        category: t('restaurant.mock_data.default_categories.hamburgers'),
        image: '/images/veggie-burger.jpg',
        available: false,
      }
    ];
    setMenuItems(initialMenuItems);
  }, [t]);

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

  const handleAddItem = () => {
    if (!newItem.name || !newItem.description || !newItem.price || !newItem.category) {
      toast.error(t('restaurant.menu.fill_required_fields'));
      return;
    }

    const item: MenuItem = {
      id: Date.now().toString(),
      name: newItem.name,
      description: newItem.description,
      price: Number(newItem.price),
      category: newItem.category,
      available: newItem.available || true,
      image: newItem.image || '/images/default-food.jpg'
    };

    setMenuItems([...menuItems, item]);
    resetForm();
    setIsAddingItem(false);
    toast.success(t('restaurant.menu.item_added_success'));
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

  const handleUpdateItem = () => {
    if (!editingItem || !newItem.name || !newItem.description || !newItem.price || !newItem.category) {
      toast.error(t('restaurant.menu.fill_required_fields'));
      return;
    }

    const updatedItem: MenuItem = {
      ...editingItem,
      name: newItem.name,
      description: newItem.description,
      price: Number(newItem.price),
      category: newItem.category,
      available: newItem.available || true,
      image: newItem.image || '/images/default-food.jpg'
    };

    setMenuItems(menuItems.map(item => 
      item.id === editingItem.id ? updatedItem : item
    ));
    resetForm();
    setIsAddingItem(false);
    setEditingItem(null);
    toast.success(t('restaurant.menu.item_updated_success'));
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

  const handleToggleAvailability = (id: string) => {
    setMenuItems(
      menuItems.map((item) =>
        item.id === id ? { ...item, available: !item.available } : item
      )
    );
    const item = menuItems.find(item => item.id === id);
    toast.success(`${item?.name} ${item?.available ? t('restaurant.menu.item_deactivated') : t('restaurant.menu.item_activated')} ${t('restaurant.menu.success')}!`);
  };

  const handleDeleteItem = (id: string) => {
    const item = menuItems.find(item => item.id === id);
    if (confirm(t('restaurant.menu.confirm_delete', { name: item?.name }))) {
      setMenuItems(menuItems.filter((item) => item.id !== id));
      toast.success(t('restaurant.menu.item_deleted_success'));
    }
  };

  const categories = ['Todos', ...new Set(menuItems.map((item) => item.category))];
  
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
                {t('restaurant.menu.title')}
              </h1>
              <p className="text-red-100 text-sm lg:text-lg hidden sm:block">{t('restaurant.menu.manage_items')}</p>
            </div>
            <button
              onClick={() => setIsAddingItem(!isAddingItem)}
              className="bg-white text-red-600 px-4 lg:px-6 py-2 lg:py-3 rounded-xl font-semibold hover:bg-red-50 transition-colors flex items-center space-x-2 text-sm lg:text-base w-full sm:w-auto justify-center"
            >
              {isAddingItem ? (
                <>
                  <MdClose size={18} />
                  <span>{t('restaurant.menu.cancel')}</span>
                </>
              ) : (
                <>
                  <MdAdd size={18} />
                  <span>{t('restaurant.menu.new_item')}</span>
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
                placeholder={t('restaurant.menu.search_placeholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 lg:py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm lg:text-base"
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
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category === 'Todos' ? t('restaurant.menu.all_categories') :
                       category === 'Hambúrgueres' ? t('restaurant.menu.categories.burgers') :
                       category === 'Pizzas' ? t('restaurant.menu.categories.pizzas') :
                       category === 'Bebidas' ? t('restaurant.menu.categories.drinks') :
                       category === 'Acompanhamentos' ? t('restaurant.menu.categories.sides') :
                       category === 'Saladas' ? t('restaurant.menu.categories.salads') :
                       category === 'Sobremesas' ? t('restaurant.menu.categories.desserts') :
                       category === 'Pratos Principais' ? t('restaurant.menu.categories.main_dishes') :
                       category === 'Entradas' ? t('restaurant.menu.categories.appetizers') :
                       category === 'Lanches' ? t('restaurant.menu.categories.snacks') :
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
                  {t('restaurant.menu.grid_view')}
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    viewMode === 'list' ? 'bg-white shadow-sm text-red-600' : 'text-gray-600'
                  }`}
                >
                  {t('restaurant.menu.list_view')}
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
              {editingItem ? t('restaurant.menu.edit_item') : t('restaurant.menu.new_item')}
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
              <CustomInput
                label={t('restaurant.menu.item_name')}
                placeholder={t('restaurant.menu.placeholders.item_name')}
                value={newItem.name}
                onChangeText={(text) => setNewItem({ ...newItem, name: text })}
              />
              <CustomInput
                label={t('restaurant.menu.category')}
                placeholder={t('restaurant.menu.placeholders.category')}
                value={newItem.category}
                onChangeText={(text) => setNewItem({ ...newItem, category: text })}
              />
              <CustomInput
                label={t('restaurant.menu.price')}
                placeholder="0.00"
                value={newItem.price?.toString() || ''}
                onChangeText={(text) => setNewItem({ ...newItem, price: parseFloat(text) || 0 })}
                keyboardType="numeric"
              />
              <CustomInput
                label={t('restaurant.menu.image_url')}
                placeholder={t('restaurant.menu.placeholders.image_url')}
                value={newItem.image}
                onChangeText={(text) => setNewItem({ ...newItem, image: text })}
              />
              <div className="md:col-span-2">
                <CustomInput
                  label={t('restaurant.menu.description')}
                  placeholder={t('restaurant.menu.placeholders.description')}
                  value={newItem.description}
                  onChangeText={(text) => setNewItem({ ...newItem, description: text })}
                  multiline
                />
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
                  {t('restaurant.menu.available_for_orders')}
                </label>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 mt-6 lg:mt-8">
              <button
                onClick={handleCancelEdit}
                className="px-4 lg:px-6 py-2 lg:py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2 text-sm lg:text-base"
              >
                <MdCancel size={18} />
                <span>{t('restaurant.menu.cancel')}</span>
              </button>
              <button
                onClick={editingItem ? handleUpdateItem : handleAddItem}
                className="px-4 lg:px-6 py-2 lg:py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors flex items-center justify-center space-x-2 text-sm lg:text-base"
              >
                <MdSave size={18} />
                <span>{editingItem ? t('restaurant.menu.update') : t('restaurant.menu.save')}</span>
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
              {searchTerm || selectedCategory !== 'Todos' ? t('restaurant.menu.no_items_found') : t('restaurant.menu.menu_empty')}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchTerm || selectedCategory !== 'Todos' 
                ? t('restaurant.menu.try_adjust_filters') 
                : t('restaurant.menu.start_adding_items')
              }
            </p>
            {!searchTerm && selectedCategory === 'Todos' && (
              <button
                onClick={() => setIsAddingItem(true)}
                className="bg-red-600 text-white px-6 py-3 rounded-xl hover:bg-red-700 transition-colors flex items-center space-x-2 mx-auto"
              >
                <MdAdd size={20} />
                <span>{t('restaurant.menu.add_first_item')}</span>
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
                            e.currentTarget.nextElementSibling.style.display = 'flex';
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
                        {item.available ? t('restaurant.menu.available') : t('restaurant.menu.unavailable')}
                      </span>
                    </div>
                  </div>
                  <div className="p-4 lg:p-6">
                    <h3 className="text-lg lg:text-xl font-bold text-gray-900 mb-2">{item.name}</h3>
                    <p className="text-gray-600 text-xs lg:text-sm mb-3 lg:mb-4 line-clamp-2">{item.description}</p>
                    <div className="flex items-center justify-between mb-3 lg:mb-4">
                      <span className="text-xl lg:text-2xl font-bold text-red-600">{t('mock_data.currency_symbol')} {item.price.toFixed(2)}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        onClick={() => handleEditItem(item)}
                        className="flex-1 bg-blue-50 text-blue-600 py-2 px-3 lg:px-4 rounded-xl hover:bg-blue-100 transition-colors flex items-center justify-center space-x-2 text-sm lg:text-base"
                      >
                        <MdEdit size={14} />
                        <span>{t('restaurant.menu.edit')}</span>
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
                        <span className="hidden sm:inline">{item.available ? t('restaurant.menu.hide') : t('restaurant.menu.show')}</span>
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="bg-red-50 text-red-600 py-2 px-3 lg:px-4 rounded-xl hover:bg-red-100 transition-colors flex items-center justify-center sm:w-auto w-full"
                      >
                        <MdDelete size={14} />
                        <span className="sm:hidden ml-2">{t('restaurant.menu.delete')}</span>
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
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('restaurant.menu.table.item')}</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('restaurant.menu.table.category')}</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('restaurant.menu.table.price')}</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('restaurant.menu.table.status')}</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('restaurant.menu.table.actions')}</th>
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
                                    e.currentTarget.nextElementSibling.style.display = 'flex';
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
                          <div className="font-semibold text-gray-900">{t('mock_data.currency_symbol')} {item.price.toFixed(2)}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                            item.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {item.available ? t('restaurant.menu.available') : t('restaurant.menu.unavailable')}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEditItem(item)}
                              className="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded-lg transition-colors"
                              title={t('restaurant.menu.edit')}
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
                              title={item.available ? t('restaurant.menu.hide') : t('restaurant.menu.show')}
                            >
                              {item.available ? <MdVisibilityOff size={16} /> : <MdVisibility size={16} />}
                            </button>
                            <button
                              onClick={() => handleDeleteItem(item.id)}
                              className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded-lg transition-colors"
                              title={t('restaurant.menu.delete')}
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