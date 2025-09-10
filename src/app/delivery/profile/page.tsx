'use client';

import { useState } from 'react';
import AnimatedContainer from '@/components/AnimatedContainer';
import CustomInput from '@/components/CustomInput';
import CustomButton from '@/components/CustomButton';
import { useAuthData, useAuthActions } from '@/store/auth.store';


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
  const { user } = useAuthData();
  const { logout } = useAuthActions();
  
  // Dados simulados do perfil do entregador
  const [profile, setProfile] = useState<DeliveryProfile>({
    name: user?.name || 'Carlos Oliveira',
    email: user?.email || 'carlos.oliveira@email.com',
    phone: '(11) 98765-4321',
    cpf: '123.456.789-00',
    birthDate: '1990-05-15',
    vehicleType: 'motorcycle',
    licensePlate: 'ABC1D23',
    bankInfo: {
      bankName: 'Nubank',
      accountType: 'checking',
      accountNumber: '12345678',
      agency: '0001',
      pixKey: 'carlos.oliveira@email.com',
    },
    address: {
      street: 'Rua das Flores',
      number: '123',
      complement: 'Apto 45',
      neighborhood: 'Jardim Primavera',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01234-567',
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
        return 'Moto';
      case 'bicycle':
        return 'Bicicleta';
      case 'car':
        return 'Carro';
      case 'on_foot':
        return 'A pé';
      default:
        return type;
    }
  };

  const getAccountTypeText = (type: string) => {
    return type === 'checking' ? 'Conta Corrente' : 'Poupança';
  };

  return (
    <AnimatedContainer animationType="fadeIn" className="h-full">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Perfil do Entregador</h1>
          <p className="text-gray-600">Gerencie suas informações pessoais e de entrega</p>
        </div>
        <div className="flex space-x-2">
          {!isEditing ? (
            <CustomButton
              title="Editar Perfil"
              onPress={() => setIsEditing(true)}
              variant="outline"
              className="px-4 py-2"
            />
          ) : (
            <>
              <CustomButton 
                title="Cancelar" 
                onPress={() => setIsEditing(false)} 
                variant="outline"
                className="px-4 py-2"
              />
              <CustomButton 
                title="Salvar" 
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
            Dados Pessoais
          </button>
          <button
            className={`px-4 py-3 font-medium ${activeTab === 'vehicle' ? 'text-primary border-b-2 border-primary' : 'text-gray-600'}`}
            onClick={() => setActiveTab('vehicle')}
          >
            Veículo
          </button>
          <button
            className={`px-4 py-3 font-medium ${activeTab === 'bank' ? 'text-primary border-b-2 border-primary' : 'text-gray-600'}`}
            onClick={() => setActiveTab('bank')}
          >
            Dados Bancários
          </button>
          <button
            className={`px-4 py-3 font-medium ${activeTab === 'address' ? 'text-primary border-b-2 border-primary' : 'text-gray-600'}`}
            onClick={() => setActiveTab('address')}
          >
            Endereço
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'personal' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                  {isEditing ? (
                    <CustomInput
                      label="Nome"
                      value={profile.name}
                      onChangeText={(text) => handleInputChange('name', text)}
                      placeholder="Nome Completo"
                    />
                  ) : (
                    <p className="text-gray-900">{profile.name}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">CPF</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Data de Nascimento</label>
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
                  title="Alterar Senha"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Veículo</label>
                {isEditing ? (
                  <select
                    value={profile.vehicleType}
                    onChange={(e) => handleInputChange('vehicleType', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="motorcycle">Moto</option>
                      <option value="bicycle">Bicicleta</option>
                      <option value="car">Carro</option>
                      <option value="on_foot">A pé</option>
                  </select>
                ) : (
                  <p className="text-gray-900">{getVehicleTypeText(profile.vehicleType)}</p>
                )}
              </div>

              {(profile.vehicleType === 'motorcycle' || profile.vehicleType === 'car') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Placa do Veículo</label>
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
                <h3 className="text-lg font-medium mb-2">Documentos</h3>
                <p className="text-sm text-gray-600 mb-4">Faça upload dos seus documentos para verificação</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border border-dashed border-gray-300 rounded-md p-4 text-center">
                    <p className="text-sm font-medium mb-2">Carteira de Habilitação</p>
                    <button className="text-primary text-sm font-medium">
                          {isEditing ? 'Fazer Upload' : 'Ver Documento'}
                        </button>
                  </div>
                  
                  {(profile.vehicleType === 'motorcycle' || profile.vehicleType === 'car') && (
                    <div className="border border-dashed border-gray-300 rounded-md p-4 text-center">
                      <p className="text-sm font-medium mb-2">Documento do Veículo</p>
                      <button className="text-primary text-sm font-medium">
                        {isEditing ? 'Fazer Upload' : 'Ver Documento'}
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Banco</label>
                {isEditing ? (
                  <CustomInput
                    label="Banco"
                    value={profile.bankInfo.bankName}
                    onChangeText={(text) => handleInputChange('bankInfo.bankName', text)}
                    placeholder="Nome do Banco"
                  />
                ) : (
                  <p className="text-gray-900">{profile.bankInfo.bankName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Conta</label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Agência</label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Número da Conta</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Chave PIX</label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rua</label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Número</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Complemento</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Bairro</label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">CEP</label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
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
          title="Sair"
          onPress={logout}
          variant="outline"
          className="px-4 py-2 text-red-500 border-red-500 hover:bg-red-50"
        />
      </div>
    </AnimatedContainer>
  );
}