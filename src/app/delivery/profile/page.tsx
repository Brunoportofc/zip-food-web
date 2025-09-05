'use client';

import { useState } from 'react';
import AnimatedContainer from '@/components/AnimatedContainer';
import CustomInput from '@/components/CustomInput';
import CustomButton from '@/components/CustomButton';
import { useAuthData, useAuthActions } from '@/store/auth.store';
import { useTranslation } from 'react-i18next';
import '@/i18n';

interface DeliveryProfile {
  name: string;
  email: string;
  phone: string;
  cpf: string;
  birthDate: string;
  vehicleType: 'motorcycle' | 'bicycle' | 'car' | 'on_foot';
  licensePlate?: string;
  bankInfo: {
    bankName: string;
    accountType: 'checking' | 'savings';
    accountNumber: string;
    agency: string;
    pixKey?: string;
  };
  address: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
}

export default function DeliveryProfile() {
  const { t } = useTranslation();
  const { user } = useAuthData();
  const { logout } = useAuthActions();
  
  // Dados simulados do perfil do entregador
  const [profile, setProfile] = useState<DeliveryProfile>({
    name: user?.name || t('delivery.profile.mock_data.name', 'Carlos Oliveira'),
    email: user?.email || t('delivery.profile.mock_data.email', 'carlos.oliveira@email.com'),
    phone: t('delivery.profile.mock_data.phone', '(11) 98765-4321'),
    cpf: t('delivery.profile.mock_data.cpf', '123.456.789-00'),
    birthDate: t('delivery.profile.mock_data.birth_date', '1990-05-15'),
    vehicleType: 'motorcycle',
    licensePlate: t('delivery.profile.mock_data.license_plate', 'ABC1D23'),
    bankInfo: {
      bankName: t('delivery.profile.mock_data.bank_name', 'Nubank'),
      accountType: 'checking',
      accountNumber: t('delivery.profile.mock_data.account_number', '12345678'),
      agency: t('delivery.profile.mock_data.agency', '0001'),
      pixKey: t('delivery.profile.mock_data.pix_key', 'carlos.oliveira@email.com'),
    },
    address: {
      street: t('delivery.profile.mock_data.street', 'Rua das Flores'),
      number: t('delivery.profile.mock_data.number', '123'),
      complement: t('delivery.profile.mock_data.complement', 'Apto 45'),
      neighborhood: t('delivery.profile.mock_data.neighborhood', 'Jardim Primavera'),
      city: t('delivery.profile.mock_data.city', 'São Paulo'),
      state: t('delivery.profile.mock_data.state', 'SP'),
      zipCode: t('delivery.profile.mock_data.zip_code', '01234-567'),
    },
  });

  const [activeTab, setActiveTab] = useState<'personal' | 'vehicle' | 'bank' | 'address'>('personal');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    const fieldParts = field.split('.');
    
    if (fieldParts.length === 1) {
      setProfile({ ...profile, [field]: value });
    } else if (fieldParts.length === 2) {
      const [section, subfield] = fieldParts;
      const currentSection = profile[section as keyof DeliveryProfile];
      if (typeof currentSection === 'object' && currentSection !== null) {
        setProfile({
          ...profile,
          [section]: {
            ...currentSection,
            [subfield]: value,
          },
        });
      }
    }
  };

  const handleSaveProfile = () => {
    setIsSaving(true);
    
    // Simulação de salvamento no backend
    setTimeout(() => {
      setIsSaving(false);
      setIsEditing(false);
    }, 1500);
  };

  const getVehicleTypeText = (type: string) => {
    switch (type) {
      case 'motorcycle':
        return t('delivery.profile.vehicle_types.motorcycle');
      case 'bicycle':
        return t('delivery.profile.vehicle_types.bicycle');
      case 'car':
        return t('delivery.profile.vehicle_types.car');
      case 'on_foot':
        return t('delivery.profile.vehicle_types.walking');
      default:
        return type;
    }
  };

  const getAccountTypeText = (type: string) => {
    return type === 'checking' ? t('delivery.profile.account_types.checking') : t('delivery.profile.account_types.savings');
  };

  return (
    <AnimatedContainer animationType="fadeIn" className="h-full">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">{t('delivery.profile.title')}</h1>
          <p className="text-gray-600">{t('delivery.profile.subtitle')}</p>
        </div>
        <div className="flex space-x-2">
          {!isEditing ? (
            <CustomButton
              title={t('delivery.profile.edit_profile')}
              onPress={() => setIsEditing(true)}
              variant="outline"
              className="px-4 py-2"
            />
          ) : (
            <>
              <CustomButton 
                title={t('delivery.profile.cancel')} 
                onPress={() => setIsEditing(false)} 
                variant="outline"
                className="px-4 py-2"
              />
              <CustomButton 
                title={t('delivery.profile.save')} 
                onPress={handleSaveProfile} 
                isLoading={isSaving}
                className="px-4 py-2"
              />
            </>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="flex border-b">
          <button
            className={`px-4 py-3 font-medium ${activeTab === 'personal' ? 'text-primary border-b-2 border-primary' : 'text-gray-600'}`}
            onClick={() => setActiveTab('personal')}
          >
            {t('delivery.profile.personal_data')}
          </button>
          <button
            className={`px-4 py-3 font-medium ${activeTab === 'vehicle' ? 'text-primary border-b-2 border-primary' : 'text-gray-600'}`}
            onClick={() => setActiveTab('vehicle')}
          >
            {t('delivery.profile.vehicle')}
          </button>
          <button
            className={`px-4 py-3 font-medium ${activeTab === 'bank' ? 'text-primary border-b-2 border-primary' : 'text-gray-600'}`}
            onClick={() => setActiveTab('bank')}
          >
            {t('delivery.profile.bank_data')}
          </button>
          <button
            className={`px-4 py-3 font-medium ${activeTab === 'address' ? 'text-primary border-b-2 border-primary' : 'text-gray-600'}`}
            onClick={() => setActiveTab('address')}
          >
            {t('delivery.profile.address')}
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'personal' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('delivery.profile.full_name')}</label>
                  {isEditing ? (
                    <CustomInput
                      label="Nome"
                      value={profile.name}
                      onChangeText={(text) => handleInputChange('name', text)}
                      placeholder={t('delivery.profile.full_name')}
                    />
                  ) : (
                    <p className="text-gray-900">{profile.name}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('delivery.profile.email')}</label>
                  {isEditing ? (
                    <CustomInput
                      label="E-mail"
                      value={profile.email}
                      onChangeText={(text) => handleInputChange('email', text)}
                      placeholder="E-mail"
                      keyboardType="email-address"
                    />
                  ) : (
                    <p className="text-gray-900">{profile.email}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('delivery.profile.phone')}</label>
                  {isEditing ? (
                    <CustomInput
                      label="Telefone"
                      value={profile.phone}
                      onChangeText={(text) => handleInputChange('phone', text)}
                      placeholder="Telefone"
                      keyboardType="phone-pad"
                    />
                  ) : (
                    <p className="text-gray-900">{profile.phone}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('delivery.profile.cpf')}</label>
                  {isEditing ? (
                    <CustomInput
                      label="CPF"
                      value={profile.cpf}
                      onChangeText={(text) => handleInputChange('cpf', text)}
                      placeholder="CPF"
                    />
                  ) : (
                    <p className="text-gray-900">{profile.cpf}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('delivery.profile.birth_date')}</label>
                {isEditing ? (
                  <CustomInput
                    label="Data de Nascimento"
                    value={profile.birthDate}
                    onChangeText={(text) => handleInputChange('birthDate', text)}
                    placeholder="Data de Nascimento"
                  />
                ) : (
                  <p className="text-gray-900">{new Date(profile.birthDate).toLocaleDateString()}</p>
                )}
              </div>

              <div className="pt-4 mt-4 border-t">
                <CustomButton
                  title={t('delivery.profile.change_password')}
                  onPress={() => {}}
                  variant="outline"
                  className="px-4 py-2"
                />
              </div>
            </div>
          )}

          {activeTab === 'vehicle' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('delivery.profile.vehicle_type')}</label>
                {isEditing ? (
                  <select
                    value={profile.vehicleType}
                    onChange={(e) => handleInputChange('vehicleType', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="motorcycle">{t('delivery.profile.vehicle_types.motorcycle')}</option>
                      <option value="bicycle">{t('delivery.profile.vehicle_types.bicycle')}</option>
                      <option value="car">{t('delivery.profile.vehicle_types.car')}</option>
                      <option value="on_foot">{t('delivery.profile.vehicle_types.walking')}</option>
                  </select>
                ) : (
                  <p className="text-gray-900">{getVehicleTypeText(profile.vehicleType)}</p>
                )}
              </div>

              {(profile.vehicleType === 'motorcycle' || profile.vehicleType === 'car') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('delivery.profile.vehicle_plate')}</label>
                  {isEditing ? (
                    <CustomInput
                      label="Placa do Veículo"
                      value={profile.licensePlate || ''}
                      onChangeText={(text) => handleInputChange('licensePlate', text)}
                      placeholder="Placa do Veículo"
                    />
                  ) : (
                    <p className="text-gray-900">{profile.licensePlate}</p>
                  )}
                </div>
              )}

              <div className="pt-4 mt-4 border-t">
                <h3 className="text-lg font-medium mb-2">{t('delivery.profile.documents')}</h3>
                <p className="text-sm text-gray-600 mb-4">{t('delivery.profile.documents_description')}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border border-dashed border-gray-300 rounded-md p-4 text-center">
                    <p className="text-sm font-medium mb-2">{t('delivery.profile.drivers_license')}</p>
                    <button className="text-primary text-sm font-medium">
                          {isEditing ? t('delivery.profile.upload_document') : t('delivery.profile.view_document')}
                        </button>
                  </div>
                  
                  {(profile.vehicleType === 'motorcycle' || profile.vehicleType === 'car') && (
                    <div className="border border-dashed border-gray-300 rounded-md p-4 text-center">
                      <p className="text-sm font-medium mb-2">{t('delivery.profile.vehicle_document')}</p>
                      <button className="text-primary text-sm font-medium">
                        {isEditing ? t('delivery.profile.upload_document') : t('delivery.profile.view_document')}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'bank' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('delivery.profile.bank')}</label>
                {isEditing ? (
                  <CustomInput
                    label="Banco"
                    value={profile.bankInfo.bankName}
                    onChangeText={(text) => handleInputChange('bankInfo.bankName', text)}
                    placeholder={t('delivery.profile.bank_name')}
                  />
                ) : (
                  <p className="text-gray-900">{profile.bankInfo.bankName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('delivery.profile.account_type')}</label>
                {isEditing ? (
                  <select
                    value={profile.bankInfo.accountType}
                    onChange={(e) => handleInputChange('bankInfo.accountType', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="checking">Conta Corrente</option>
                    <option value="savings">Conta Poupança</option>
                  </select>
                ) : (
                  <p className="text-gray-900">{getAccountTypeText(profile.bankInfo.accountType)}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('delivery.profile.agency')}</label>
                  {isEditing ? (
                    <CustomInput
                      label="Agência"
                      value={profile.bankInfo.agency}
                      onChangeText={(text) => handleInputChange('bankInfo.agency', text)}
                      placeholder="Agência"
                    />
                  ) : (
                    <p className="text-gray-900">{profile.bankInfo.agency}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('delivery.profile.account_number')}</label>
                  {isEditing ? (
                    <CustomInput
                      label="Número da Conta"
                      value={profile.bankInfo.accountNumber}
                      onChangeText={(text) => handleInputChange('bankInfo.accountNumber', text)}
                      placeholder="Número da Conta"
                    />
                  ) : (
                    <p className="text-gray-900">{profile.bankInfo.accountNumber}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('delivery.profile.pix_key')}</label>
                {isEditing ? (
                  <CustomInput
                    label="Chave PIX"
                    value={profile.bankInfo.pixKey || ''}
                    onChangeText={(text) => handleInputChange('bankInfo.pixKey', text)}
                    placeholder="Chave PIX"
                  />
                ) : (
                  <p className="text-gray-900">{profile.bankInfo.pixKey || '-'}</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'address' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('delivery.profile.street')}</label>
                  {isEditing ? (
                    <CustomInput
                      label="Rua"
                      value={profile.address.street}
                      onChangeText={(text) => handleInputChange('address.street', text)}
                      placeholder="Rua"
                    />
                  ) : (
                    <p className="text-gray-900">{profile.address.street}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('delivery.profile.number')}</label>
                  {isEditing ? (
                    <CustomInput
                      label="Número"
                      value={profile.address.number}
                      onChangeText={(text) => handleInputChange('address.number', text)}
                      placeholder="Número"
                    />
                  ) : (
                    <p className="text-gray-900">{profile.address.number}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('delivery.profile.complement')}</label>
                {isEditing ? (
                  <CustomInput
                    label="Complemento"
                    value={profile.address.complement || ''}
                    onChangeText={(text) => handleInputChange('address.complement', text)}
                    placeholder="Complemento"
                  />
                ) : (
                  <p className="text-gray-900">{profile.address.complement || '-'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('delivery.profile.neighborhood')}</label>
                {isEditing ? (
                  <CustomInput
                    label="Bairro"
                    value={profile.address.neighborhood}
                    onChangeText={(text) => handleInputChange('address.neighborhood', text)}
                    placeholder="Bairro"
                  />
                ) : (
                  <p className="text-gray-900">{profile.address.neighborhood}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('delivery.profile.zip_code')}</label>
                  {isEditing ? (
                    <CustomInput
                      label="CEP"
                      value={profile.address.zipCode}
                      onChangeText={(text) => handleInputChange('address.zipCode', text)}
                      placeholder="CEP"
                    />
                  ) : (
                    <p className="text-gray-900">{profile.address.zipCode}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('delivery.profile.city')}</label>
                  {isEditing ? (
                    <CustomInput
                      label="Cidade"
                      value={profile.address.city}
                      onChangeText={(text) => handleInputChange('address.city', text)}
                      placeholder="Cidade"
                    />
                  ) : (
                    <p className="text-gray-900">{profile.address.city}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('delivery.profile.state')}</label>
                  {isEditing ? (
                    <CustomInput
                      label="Estado"
                      value={profile.address.state}
                      onChangeText={(text) => handleInputChange('address.state', text)}
                      placeholder="Estado"
                    />
                  ) : (
                    <p className="text-gray-900">{profile.address.state}</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6">
        <CustomButton
          title={t('delivery.profile.logout')}
          onPress={logout}
          variant="outline"
          className="px-4 py-2 text-red-500 border-red-500 hover:bg-red-50"
        />
      </div>
    </AnimatedContainer>
  );
}