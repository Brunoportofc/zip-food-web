'use client';

import { useState, useEffect } from 'react';
import AnimatedContainer from '@/components/AnimatedContainer';
import CustomButton from '@/components/CustomButton';
import CustomInput from '@/components/CustomInput';
import useAuthStore, { User } from '@/store/auth.store';
import { toast } from 'react-hot-toast';
import { showSuccessAlert, showErrorAlert, showWarningAlert } from '@/components/AlertSystem';
import { useTranslation } from 'react-i18next';
import { 
  MdSettings, 
  MdStore, 
  MdLocationOn, 
  MdPhone, 
  MdAccessTime, 
  MdDeliveryDining, 
  MdAttachMoney, 
  MdCategory, 
  MdPayment, 
  MdAdd, 
  MdClose, 
  MdSave, 
  MdCheck,
  MdCreditCard,
  MdAccountBalance,
  MdMoney,
  MdQrCode
} from 'react-icons/md';

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
  const { user, login } = useAuthStore();
  const { t } = useTranslation();
  
  const [settings, setSettings] = useState<RestaurantSettings>({
    name: '',
    description: '',
    address: '',
    phone: '',
    openingHours: '',
    deliveryFee: 5,
    minOrderValue: 15,
    categories: [],
    paymentMethods: {
      creditCard: true,
      debitCard: true,
      cash: true,
      pix: true,
    },
  });

  // Initialize settings after translations are ready
  useEffect(() => {
    setSettings({
      name: user?.name || 'Usuário de Desenvolvimento',
      description: t('restaurant.mock_data.restaurant_description'),
      address: user?.address || 'Rua de Desenvolvimento, 123 - São Paulo, SP',
      phone: user?.phone || '(11) 99999-9999',
      openingHours: t('restaurant.mock_data.opening_hours'),
      deliveryFee: 5,
      minOrderValue: 15,
      categories: [
        t('restaurant.mock_data.default_categories.hamburgers'),
        t('restaurant.mock_data.default_categories.sides'),
        t('restaurant.mock_data.default_categories.drinks'),
        t('restaurant.mock_data.default_categories.desserts')
      ],
      paymentMethods: {
        creditCard: true,
        debitCard: true,
        cash: true,
        pix: true,
      },
    });
  }, [t, user]);

  const [newCategory, setNewCategory] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      // Validações básicas
      if (!settings.name.trim()) {
        showWarningAlert(t('restaurant.settings.required_field'), t('restaurant.settings.restaurant_name_required'));
        return;
      }
      
      if (!settings.phone.trim()) {
        showWarningAlert(t('restaurant.settings.required_field'), t('restaurant.settings.phone_required'));
        return;
      }
      
      if (settings.deliveryFee < 0) {
        showWarningAlert(t('restaurant.settings.invalid_value'), t('restaurant.settings.delivery_fee_negative'));
        return;
      }
      
      // Simular salvamento
      await new Promise(resolve => setTimeout(resolve, 2000));
      
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
      
      showSuccessAlert(
        t('restaurant.settings.settings_saved'),
        t('restaurant.settings.settings_saved_message')
      );
    } catch (error) {
      showErrorAlert(
        t('restaurant.settings.save_error'),
        t('restaurant.settings.save_error_message')
      );
    } finally {
      setIsSaving(false);
    }
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <AnimatedContainer animationType="fadeInDown" delay={0}>
        <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-4 lg:p-8 rounded-b-3xl shadow-2xl mb-6 lg:mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-3 lg:space-x-4">
              <div className="w-12 h-12 lg:w-16 lg:h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                <MdSettings size={24} className="text-white lg:hidden" />
                <MdSettings size={32} className="text-white hidden lg:block" />
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold">{t('restaurant.settings.title')}</h1>
                <p className="text-red-100 mt-1 text-sm lg:text-base hidden sm:block">{t('restaurant.settings.subtitle')}</p>
              </div>
            </div>
            <div className="text-left sm:text-right w-full sm:w-auto">
              <p className="text-red-100 text-xs lg:text-sm">{t('restaurant.settings.last_update')}</p>
              <p className="text-white font-semibold text-sm lg:text-base">{new Date().toLocaleString()}</p>
            </div>
          </div>
        </div>
      </AnimatedContainer>

      <div className="max-w-6xl mx-auto px-4 lg:px-6 pb-6 lg:pb-8">
        {/* Informações Básicas */}
        <AnimatedContainer animationType="fadeInUp" delay={100}>
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 lg:p-8 mb-6 lg:mb-8">
            <div className="flex items-center space-x-3 mb-4 lg:mb-6">
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <MdStore size={20} className="text-red-600 lg:hidden" />
                <MdStore size={24} className="text-red-600 hidden lg:block" />
              </div>
              <h2 className="text-xl lg:text-2xl font-bold text-gray-900">{t('restaurant.settings.basic_info')}</h2>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <CustomInput
                label={t('restaurant.settings.restaurant_name')}
                placeholder={t('restaurant.settings.restaurant_name_placeholder')}
                value={settings.name}
                onChangeText={(text) => setSettings({ ...settings, name: text })}
                icon={<MdStore size={20} className="text-gray-400" />}
              />
              <CustomInput
                label={t('restaurant.settings.phone')}
                placeholder={t('restaurant.settings.phone_placeholder')}
                value={settings.phone}
                onChangeText={(text) => setSettings({ ...settings, phone: text })}
                icon={<MdPhone size={20} className="text-gray-400" />}
              />
              <div className="lg:col-span-2">
                <CustomInput
                  label={t('restaurant.settings.address')}
                  placeholder={t('restaurant.settings.address_placeholder')}
                  value={settings.address}
                  onChangeText={(text) => setSettings({ ...settings, address: text })}
                  icon={<MdLocationOn size={20} className="text-gray-400" />}
                />
              </div>
              <div className="lg:col-span-2">
                <CustomInput
                  label={t('restaurant.settings.description')}
                  placeholder={t('restaurant.settings.description_placeholder')}
                  value={settings.description}
                  onChangeText={(text) => setSettings({ ...settings, description: text })}
                  multiline
                />
              </div>
              <CustomInput
                label={t('restaurant.settings.opening_hours')}
                placeholder={t('restaurant.settings.opening_hours_placeholder')}
                value={settings.openingHours}
                onChangeText={(text) => setSettings({ ...settings, openingHours: text })}
                icon={<MdAccessTime size={20} className="text-gray-400" />}
              />
            </div>
          </div>
        </AnimatedContainer>

        {/* Configurações de Entrega */}
        <AnimatedContainer animationType="fadeInUp" delay={200}>
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 lg:p-8 mb-6 lg:mb-8">
            <div className="flex items-center space-x-3 mb-4 lg:mb-6">
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <MdDeliveryDining size={20} className="text-blue-600 lg:hidden" />
                <MdDeliveryDining size={24} className="text-blue-600 hidden lg:block" />
              </div>
              <h2 className="text-xl lg:text-2xl font-bold text-gray-900">{t('restaurant.settings.delivery_settings')}</h2>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <CustomInput
                label={t('restaurant.settings.delivery_fee')}
                placeholder={t('restaurant.mock_data.placeholder_zero')}
                value={settings.deliveryFee.toString()}
                onChangeText={(text) => setSettings({ ...settings, deliveryFee: parseFloat(text) || 0 })}
                keyboardType="numeric"
                icon={<MdAttachMoney size={20} className="text-gray-400" />}
              />
              <CustomInput
                label={t('restaurant.settings.min_order_value')}
                placeholder={t('restaurant.mock_data.placeholder_zero')}
                value={settings.minOrderValue.toString()}
                onChangeText={(text) => setSettings({ ...settings, minOrderValue: parseFloat(text) || 0 })}
                keyboardType="numeric"
                icon={<MdAttachMoney size={20} className="text-gray-400" />}
              />
            </div>
          </div>
        </AnimatedContainer>

        {/* Categorias do Cardápio */}
        <AnimatedContainer animationType="fadeInUp" delay={300}>
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 lg:p-8 mb-6 lg:mb-8">
            <div className="flex items-center space-x-3 mb-4 lg:mb-6">
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <MdCategory size={20} className="text-green-600 lg:hidden" />
                <MdCategory size={24} className="text-green-600 hidden lg:block" />
              </div>
              <h2 className="text-xl lg:text-2xl font-bold text-gray-900">{t('restaurant.settings.menu_categories')}</h2>
            </div>
            
            <div className="flex flex-wrap gap-2 lg:gap-3 mb-4 lg:mb-6">
              {settings.categories.map((category) => (
                <div key={category} className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-xl px-3 lg:px-4 py-2 flex items-center space-x-2">
                  <span className="text-red-700 font-medium text-sm lg:text-base">{category}</span>
                  <button
                    onClick={() => handleRemoveCategory(category)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-200 rounded-full p-1 transition-all"
                  >
                    <MdClose size={14} />
                  </button>
                </div>
              ))}
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 lg:gap-4">
              <div className="flex-1">
                <CustomInput
                  placeholder={t('restaurant.settings.new_category')}
                  value={newCategory}
                  onChangeText={setNewCategory}
                  icon={<MdCategory size={20} className="text-gray-400" />}
                />
              </div>
              <button
                onClick={handleAddCategory}
                className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 lg:px-6 py-2 lg:py-3 rounded-xl font-semibold hover:from-green-600 hover:to-green-700 transition-all flex items-center justify-center space-x-2 shadow-lg text-sm lg:text-base"
              >
                <MdAdd size={18} />
                <span>{t('restaurant.settings.add')}</span>
              </button>
            </div>
          </div>
        </AnimatedContainer>

        {/* Métodos de Pagamento */}
        <AnimatedContainer animationType="fadeInUp" delay={400}>
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 lg:p-8 mb-6 lg:mb-8">
            <div className="flex items-center space-x-3 mb-4 lg:mb-6">
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <MdPayment size={20} className="text-purple-600 lg:hidden" />
                <MdPayment size={24} className="text-purple-600 hidden lg:block" />
              </div>
              <h2 className="text-xl lg:text-2xl font-bold text-gray-900">{t('restaurant.settings.payment_methods')}</h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
              <div className="bg-gray-50 rounded-xl p-3 lg:p-4 border-2 border-transparent hover:border-red-200 transition-all">
                <label className="flex items-center space-x-2 lg:space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.paymentMethods.creditCard}
                    onChange={() => handlePaymentMethodChange('creditCard')}
                    className="w-4 h-4 lg:w-5 lg:h-5 text-red-600 rounded focus:ring-red-500"
                  />
                  <div className="flex items-center space-x-2">
                    <MdCreditCard size={18} className="text-gray-600 lg:hidden" />
                    <MdCreditCard size={20} className="text-gray-600 hidden lg:block" />
                    <span className="font-medium text-gray-700 text-sm lg:text-base">{t('restaurant.settings.credit_card')}</span>
                  </div>
                </label>
              </div>
              
              <div className="bg-gray-50 rounded-xl p-3 lg:p-4 border-2 border-transparent hover:border-red-200 transition-all">
                <label className="flex items-center space-x-2 lg:space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.paymentMethods.debitCard}
                    onChange={() => handlePaymentMethodChange('debitCard')}
                    className="w-4 h-4 lg:w-5 lg:h-5 text-red-600 rounded focus:ring-red-500"
                  />
                  <div className="flex items-center space-x-2">
                    <MdAccountBalance size={18} className="text-gray-600 lg:hidden" />
                    <MdAccountBalance size={20} className="text-gray-600 hidden lg:block" />
                    <span className="font-medium text-gray-700 text-sm lg:text-base">{t('restaurant.settings.debit_card')}</span>
                  </div>
                </label>
              </div>
              
              <div className="bg-gray-50 rounded-xl p-3 lg:p-4 border-2 border-transparent hover:border-red-200 transition-all">
                <label className="flex items-center space-x-2 lg:space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.paymentMethods.cash}
                    onChange={() => handlePaymentMethodChange('cash')}
                    className="w-4 h-4 lg:w-5 lg:h-5 text-red-600 rounded focus:ring-red-500"
                  />
                  <div className="flex items-center space-x-2">
                    <MdMoney size={18} className="text-gray-600 lg:hidden" />
                    <MdMoney size={20} className="text-gray-600 hidden lg:block" />
                    <span className="font-medium text-gray-700 text-sm lg:text-base">{t('restaurant.settings.cash')}</span>
                  </div>
                </label>
              </div>
              
              <div className="bg-gray-50 rounded-xl p-3 lg:p-4 border-2 border-transparent hover:border-red-200 transition-all">
                <label className="flex items-center space-x-2 lg:space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.paymentMethods.pix}
                    onChange={() => handlePaymentMethodChange('pix')}
                    className="w-4 h-4 lg:w-5 lg:h-5 text-red-600 rounded focus:ring-red-500"
                  />
                  <div className="flex items-center space-x-2">
                    <MdQrCode size={18} className="text-gray-600 lg:hidden" />
                    <MdQrCode size={20} className="text-gray-600 hidden lg:block" />
                    <span className="font-medium text-gray-700 text-sm lg:text-base">{t('restaurant.settings.pix')}</span>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </AnimatedContainer>

        {/* Botão de Salvar */}
        <AnimatedContainer animationType="fadeInUp" delay={500}>
          <div className="flex justify-center sm:justify-end">
            <button
              onClick={handleSaveSettings}
              disabled={isSaving}
              className={`bg-gradient-to-r from-red-500 to-red-600 text-white px-6 lg:px-8 py-3 lg:py-4 rounded-2xl font-bold text-base lg:text-lg hover:from-red-600 hover:to-red-700 transition-all flex items-center space-x-2 lg:space-x-3 shadow-lg w-full sm:w-auto justify-center ${
                isSaving ? 'opacity-70 cursor-not-allowed' : 'hover:shadow-xl'
              }`}
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 lg:h-5 lg:w-5 border-b-2 border-white"></div>
                  <span>{t('restaurant.settings.saving')}</span>
                </>
              ) : (
                <>
                  <MdSave size={20} className="lg:hidden" />
                  <MdSave size={24} className="hidden lg:block" />
                  <span>{t('restaurant.settings.save_settings')}</span>
                </>
              )}
            </button>
          </div>
        </AnimatedContainer>
      </div>
    </div>
  );
}