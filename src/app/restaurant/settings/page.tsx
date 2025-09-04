'use client';

import { useState } from 'react';
import AnimatedContainer from '@/components/AnimatedContainer';
import CustomButton from '@/components/CustomButton';
import CustomInput from '@/components/CustomInput';
import useAuthStore, { User } from '@/store/auth.store';
import { useTranslation } from 'react-i18next';
import '@/i18n';

interface RestaurantSettings {
  name: string;
  description: string;
  address: string;
  phone: string;
  openingHours: string;
  deliveryFee: number;
  minOrderValue: number;
  categories: string[];
  paymentMethods: {
    creditCard: boolean;
    debitCard: boolean;
    cash: boolean;
    pix: boolean;
  };
}

export default function RestaurantSettings() {
  const { t } = useTranslation();
  const { user, login } = useAuthStore();
  
  const [settings, setSettings] = useState<RestaurantSettings>({
    name: user?.name || '',
    description: 'Restaurante especializado em hambúrgueres artesanais e porções',
    address: user?.address || '',
    phone: user?.phone || '',
    openingHours: '11:00 - 23:00',
    deliveryFee: 5,
    minOrderValue: 15,
    categories: ['Hambúrgueres', 'Acompanhamentos', 'Bebidas', 'Sobremesas'],
    paymentMethods: {
      creditCard: true,
      debitCard: true,
      cash: true,
      pix: true,
    },
  });

  const [newCategory, setNewCategory] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSaveSettings = () => {
    setIsSaving(true);
    
    // Simulação de salvamento
    setTimeout(() => {
      // Atualiza os dados do usuário no store
      if (user) {
        const updatedUser: User = {
          ...user,
          name: settings.name,
          address: settings.address,
          phone: settings.phone,
        };
        
        login(updatedUser, user.id); // Reusa o ID como token para simplificar
      }
      
      setIsSaving(false);
      setSaveSuccess(true);
      
      // Limpa a mensagem de sucesso após alguns segundos
      setTimeout(() => setSaveSuccess(false), 3000);
    }, 1000);
  };

  const handleAddCategory = () => {
    if (newCategory.trim() && !settings.categories.includes(newCategory.trim())) {
      setSettings({
        ...settings,
        categories: [...settings.categories, newCategory.trim()],
      });
      setNewCategory('');
    }
  };

  const handleRemoveCategory = (category: string) => {
    setSettings({
      ...settings,
      categories: settings.categories.filter((c) => c !== category),
    });
  };

  const handlePaymentMethodChange = (method: keyof RestaurantSettings['paymentMethods']) => {
    setSettings({
      ...settings,
      paymentMethods: {
        ...settings.paymentMethods,
        [method]: !settings.paymentMethods[method],
      },
    });
  };

  return (
    <AnimatedContainer animation="fadeIn" className="h-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-gray-600">Gerencie as informações do seu restaurante</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Informações Básicas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CustomInput
            label="Nome do Restaurante"
            placeholder="Nome do seu estabelecimento"
            value={settings.name}
            onChangeText={(text) => setSettings({ ...settings, name: text })}
          />
          <CustomInput
            label="Telefone"
            placeholder="(00) 00000-0000"
            value={settings.phone}
            onChangeText={(text) => setSettings({ ...settings, phone: text })}
          />
          <div className="md:col-span-2">
            <CustomInput
              label="Endereço"
              placeholder="Endereço completo"
              value={settings.address}
              onChangeText={(text) => setSettings({ ...settings, address: text })}
            />
          </div>
          <div className="md:col-span-2">
            <CustomInput
              label="Descrição"
              placeholder="Descreva seu restaurante"
              value={settings.description}
              onChangeText={(text) => setSettings({ ...settings, description: text })}
              multiline
            />
          </div>
          <CustomInput
            label="Horário de Funcionamento"
            placeholder="Ex: 11:00 - 23:00"
            value={settings.openingHours}
            onChangeText={(text) => setSettings({ ...settings, openingHours: text })}
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Configurações de Entrega</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CustomInput
            label="Taxa de Entrega (R$)"
            placeholder="0.00"
            value={settings.deliveryFee.toString()}
            onChangeText={(text) => setSettings({ ...settings, deliveryFee: parseFloat(text) || 0 })}
            keyboardType="numeric"
          />
          <CustomInput
            label="Valor Mínimo do Pedido (R$)"
            placeholder="0.00"
            value={settings.minOrderValue.toString()}
            onChangeText={(text) => setSettings({ ...settings, minOrderValue: parseFloat(text) || 0 })}
            keyboardType="numeric"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Categorias do Cardápio</h2>
        <div className="flex flex-wrap gap-2 mb-4">
          {settings.categories.map((category) => (
            <div key={category} className="bg-gray-100 rounded-full px-3 py-1 flex items-center">
              <span className="text-sm">{category}</span>
              <button
                onClick={() => handleRemoveCategory(category)}
                className="ml-2 text-gray-500 hover:text-red-500"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <div className="flex">
          <CustomInput
            placeholder="Nova categoria"
            value={newCategory}
            onChangeText={setNewCategory}
            containerStyle={{ flex: 1, marginRight: 8 }}
          />
          <CustomButton
            title="Adicionar"
            onPress={handleAddCategory}
            style={{ height: 40, paddingHorizontal: 16 }}
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Métodos de Pagamento</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="creditCard"
              checked={settings.paymentMethods.creditCard}
              onChange={() => handlePaymentMethodChange('creditCard')}
              className="mr-2 h-4 w-4"
            />
            <label htmlFor="creditCard">Cartão de Crédito</label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="debitCard"
              checked={settings.paymentMethods.debitCard}
              onChange={() => handlePaymentMethodChange('debitCard')}
              className="mr-2 h-4 w-4"
            />
            <label htmlFor="debitCard">Cartão de Débito</label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="cash"
              checked={settings.paymentMethods.cash}
              onChange={() => handlePaymentMethodChange('cash')}
              className="mr-2 h-4 w-4"
            />
            <label htmlFor="cash">Dinheiro</label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="pix"
              checked={settings.paymentMethods.pix}
              onChange={() => handlePaymentMethodChange('pix')}
              className="mr-2 h-4 w-4"
            />
            <label htmlFor="pix">PIX</label>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        {saveSuccess && (
          <div className="mr-4 bg-red-100 text-red-600 px-4 py-2 rounded-md flex items-center">
            <span className="mr-2">✓</span>
            <span>Configurações salvas com sucesso!</span>
          </div>
        )}
        <CustomButton
          title={isSaving ? 'Salvando...' : 'Salvar Configurações'}
          onPress={handleSaveSettings}
          disabled={isSaving}
          style={{
            opacity: isSaving ? 0.7 : 1,
          }}
        />
      </div>
    </AnimatedContainer>
  );
}