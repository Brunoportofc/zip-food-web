'use client';

import { useState } from 'react';
import AnimatedContainer from '@/components/AnimatedContainer';
import CustomButton from '@/components/CustomButton';
import CustomInput from '@/components/CustomInput';
import { useTranslation } from 'react-i18next';
import '@/i18n';

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
  const [menuItems, setMenuItems] = useState<MenuItem[]>([
    {
      id: '1',
      name: 'X-Burger Especial',
      description: 'Hambúrguer artesanal com queijo, bacon, alface e tomate',
      price: 29.9,
      category: 'Hambúrgueres',
      available: true,
    },
    {
      id: '2',
      name: 'Batata Frita Grande',
      description: 'Porção grande de batatas fritas crocantes',
      price: 15.9,
      category: 'Acompanhamentos',
      available: true,
    },
    {
      id: '3',
      name: 'Milk Shake de Chocolate',
      description: 'Milk shake cremoso de chocolate com calda e chantilly',
      price: 18.9,
      category: 'Bebidas',
      available: true,
    },
  ]);

  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItem, setNewItem] = useState<Partial<MenuItem>>({
    name: '',
    description: '',
    price: 0,
    category: '',
    available: true,
  });

  const handleAddItem = () => {
    if (!newItem.name || !newItem.description || !newItem.price || !newItem.category) {
      alert('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    const item: MenuItem = {
      id: Date.now().toString(),
      name: newItem.name,
      description: newItem.description,
      price: Number(newItem.price),
      category: newItem.category,
      available: newItem.available || true,
    };

    setMenuItems([...menuItems, item]);
    setNewItem({
      name: '',
      description: '',
      price: 0,
      category: '',
      available: true,
    });
    setIsAddingItem(false);
  };

  const handleToggleAvailability = (id: string) => {
    setMenuItems(
      menuItems.map((item) =>
        item.id === id ? { ...item, available: !item.available } : item
      )
    );
  };

  const handleDeleteItem = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este item?')) {
      setMenuItems(menuItems.filter((item) => item.id !== id));
    }
  };

  const categories = [...new Set(menuItems.map((item) => item.category))];

  return (
    <AnimatedContainer animation="fadeIn" className="h-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Cardápio</h1>
        <CustomButton
          title={isAddingItem ? 'Cancelar' : 'Adicionar Item'}
          onPress={() => setIsAddingItem(!isAddingItem)}
          style={{
            backgroundColor: isAddingItem ? '#f3f4f6' : undefined,
            color: isAddingItem ? '#374151' : undefined,
          }}
        />
      </div>

      {isAddingItem && (
        <AnimatedContainer animation="fadeInDown" className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Novo Item</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CustomInput
              label="Nome"
              placeholder="Nome do item"
              value={newItem.name}
              onChangeText={(text) => setNewItem({ ...newItem, name: text })}
            />
            <CustomInput
              label="Categoria"
              placeholder="Categoria do item"
              value={newItem.category}
              onChangeText={(text) => setNewItem({ ...newItem, category: text })}
            />
            <CustomInput
              label="Preço (R$)"
              placeholder="0.00"
              value={newItem.price?.toString() || ''}
              onChangeText={(text) => setNewItem({ ...newItem, price: parseFloat(text) || 0 })}
              keyboardType="numeric"
            />
            <div className="md:col-span-2">
              <CustomInput
                label="Descrição"
                placeholder="Descrição do item"
                value={newItem.description}
                onChangeText={(text) => setNewItem({ ...newItem, description: text })}
                multiline
              />
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <CustomButton title="Salvar Item" onPress={handleAddItem} />
          </div>
        </AnimatedContainer>
      )}

      {categories.map((category) => (
        <div key={category} className="mb-8">
          <h2 className="text-xl font-semibold mb-4">{category}</h2>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Preço</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {menuItems
                  .filter((item) => item.category === category)
                  .map((item) => (
                    <tr key={item.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-md"></div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{item.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-500 max-w-xs truncate">{item.description}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">R$ {item.price.toFixed(2)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${item.available ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-800'}`}
                        >
                          {item.available ? 'Disponível' : 'Indisponível'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleToggleAvailability(item.id)}
                          className="text-indigo-600 hover:text-indigo-900 mr-4"
                        >
                          {item.available ? 'Desativar' : 'Ativar'}
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Excluir
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {menuItems.length === 0 && (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500 mb-4">Seu cardápio está vazio</p>
          <CustomButton
            title="Adicionar Primeiro Item"
            onPress={() => setIsAddingItem(true)}
          />
        </div>
      )}
    </AnimatedContainer>
  );
}