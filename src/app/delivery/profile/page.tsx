'use client';

import { useState } from 'react';
import AnimatedContainer from '@/components/AnimatedContainer';
import CustomInput from '@/components/CustomInput';
import CustomButton from '@/components/CustomButton';
import { useAuthStore } from '@/store/auth.store';
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
  const { user, logout } = useAuthStore();
  
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
      setProfile({
        ...profile,
        [section]: {
          ...profile[section as keyof DeliveryProfile],
          [subfield]: value,
        },
      });
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
        return 'Motocicleta';
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
    return type === 'checking' ? 'Conta Corrente' : 'Conta Poupança';
  };

  return (
    <AnimatedContainer animation="fadeIn" className="h-full">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Meu Perfil</h1>
          <p className="text-gray-600">Gerencie suas informações pessoais</p>
        </div>
        <div className="flex space-x-2">
          {!isEditing ? (
            <CustomButton 
              text="Editar Perfil" 
              onClick={() => setIsEditing(true)} 
              variant="outlined"
              className="px-4 py-2"
            />
          ) : (
            <>
              <CustomButton 
                text="Cancelar" 
                onClick={() => setIsEditing(false)} 
                variant="outlined"
                className="px-4 py-2"
              />
              <CustomButton 
                text="Salvar" 
                onClick={handleSaveProfile} 
                loading={isSaving}
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
                      value={profile.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Nome completo"
                    />
                  ) : (
                    <p className="text-gray-900">{profile.name}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                  {isEditing ? (
                    <CustomInput
                      value={profile.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="E-mail"
                      type="email"
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
                      value={profile.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="Telefone"
                    />
                  ) : (
                    <p className="text-gray-900">{profile.phone}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CPF</label>
                  {isEditing ? (
                    <CustomInput
                      value={profile.cpf}
                      onChange={(e) => handleInputChange('cpf', e.target.value)}
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
                    value={profile.birthDate}
                    onChange={(e) => handleInputChange('birthDate', e.target.value)}
                    placeholder="Data de Nascimento"
                    type="date"
                  />
                ) : (
                  <p className="text-gray-900">{new Date(profile.birthDate).toLocaleDateString()}</p>
                )}
              </div>

              <div className="pt-4 mt-4 border-t">
                <CustomButton 
                  text="Alterar Senha" 
                  onClick={() => {}} 
                  variant="outlined"
                  className="px-4 py-2"
                />
              </div>
            </div>
          )}

          {activeTab === 'vehicle' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Veículo</label>
                {isEditing ? (
                  <select
                    value={profile.vehicleType}
                    onChange={(e) => handleInputChange('vehicleType', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="motorcycle">Motocicleta</option>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Placa do Veículo</label>
                  {isEditing ? (
                    <CustomInput
                      value={profile.licensePlate || ''}
                      onChange={(e) => handleInputChange('licensePlate', e.target.value)}
                      placeholder="Placa do Veículo"
                    />
                  ) : (
                    <p className="text-gray-900">{profile.licensePlate}</p>
                  )}
                </div>
              )}

              <div className="pt-4 mt-4 border-t">
                <h3 className="text-lg font-medium mb-2">Documentos</h3>
                <p className="text-sm text-gray-600 mb-4">Envie fotos dos seus documentos para verificação</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border border-dashed border-gray-300 rounded-md p-4 text-center">
                    <p className="text-sm font-medium mb-2">CNH (Frente e Verso)</p>
                    <button className="text-primary text-sm font-medium">
                      {isEditing ? 'Enviar documento' : 'Ver documento'}
                    </button>
                  </div>
                  
                  {(profile.vehicleType === 'motorcycle' || profile.vehicleType === 'car') && (
                    <div className="border border-dashed border-gray-300 rounded-md p-4 text-center">
                      <p className="text-sm font-medium mb-2">Documento do Veículo</p>
                      <button className="text-primary text-sm font-medium">
                        {isEditing ? 'Enviar documento' : 'Ver documento'}
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Banco</label>
                {isEditing ? (
                  <CustomInput
                    value={profile.bankInfo.bankName}
                    onChange={(e) => handleInputChange('bankInfo.bankName', e.target.value)}
                    placeholder="Nome do Banco"
                  />
                ) : (
                  <p className="text-gray-900">{profile.bankInfo.bankName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Conta</label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Agência</label>
                  {isEditing ? (
                    <CustomInput
                      value={profile.bankInfo.agency}
                      onChange={(e) => handleInputChange('bankInfo.agency', e.target.value)}
                      placeholder="Agência"
                    />
                  ) : (
                    <p className="text-gray-900">{profile.bankInfo.agency}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Número da Conta</label>
                  {isEditing ? (
                    <CustomInput
                      value={profile.bankInfo.accountNumber}
                      onChange={(e) => handleInputChange('bankInfo.accountNumber', e.target.value)}
                      placeholder="Número da Conta"
                    />
                  ) : (
                    <p className="text-gray-900">{profile.bankInfo.accountNumber}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Chave PIX</label>
                {isEditing ? (
                  <CustomInput
                    value={profile.bankInfo.pixKey || ''}
                    onChange={(e) => handleInputChange('bankInfo.pixKey', e.target.value)}
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
                      value={profile.address.street}
                      onChange={(e) => handleInputChange('address.street', e.target.value)}
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
                      value={profile.address.number}
                      onChange={(e) => handleInputChange('address.number', e.target.value)}
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
                    value={profile.address.complement || ''}
                    onChange={(e) => handleInputChange('address.complement', e.target.value)}
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
                    value={profile.address.neighborhood}
                    onChange={(e) => handleInputChange('address.neighborhood', e.target.value)}
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
                      value={profile.address.zipCode}
                      onChange={(e) => handleInputChange('address.zipCode', e.target.value)}
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
                      value={profile.address.city}
                      onChange={(e) => handleInputChange('address.city', e.target.value)}
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
                      value={profile.address.state}
                      onChange={(e) => handleInputChange('address.state', e.target.value)}
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
          text="Sair da Conta" 
          onClick={logout} 
          variant="outlined"
          className="px-4 py-2 text-red-500 border-red-500 hover:bg-red-50"
        />
      </div>
    </AnimatedContainer>
  );
}