'use client';

import { useState } from 'react';
import AnimatedContainer from '@/components/AnimatedContainer';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { useAuthStore } from '@/store/auth.store';


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
  const { user, signOut } = useAuthStore();
  
  const [activeTab, setActiveTab] = useState<'personal' | 'vehicle' | 'bank' | 'address'>('personal');
  const [isEditing, setIsEditing] = useState(false);
  
  const [profile, setProfile] = useState<DeliveryProfile>({
    name: user?.name || 'João Silva',
    email: user?.email || 'joao.silva@email.com',
    phone: '(11) 99999-9999',
    cpf: '123.456.789-00',
    birthDate: '1990-01-01',
    vehicleType: 'motorcycle',
    licensePlate: 'ABC-1234',
    bankInfo: {
      bankName: 'Banco do Brasil',
      accountType: 'checking',
      accountNumber: '12345-6',
      agency: '1234',
      pixKey: 'joao.silva@email.com'
    },
    address: {
      street: 'Rua das Flores',
      number: '123',
      complement: 'Apto 45',
      neighborhood: 'Centro',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01234-567'
    }
  });

  const handleInputChange = (field: string, value: string) => {
    const keys = field.split('.');
    setProfile(prev => {
      const newProfile = { ...prev };
      let current: any = newProfile;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = { ...current[keys[i]] };
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return newProfile;
    });
  };

  const handleSave = () => {
    // Aqui você salvaria os dados no backend
    console.log('Salvando perfil:', profile);
    setIsEditing(false);
  };

  const handleCancel = () => {
    // Aqui você recarregaria os dados originais
    setIsEditing(false);
  };

  const getVehicleTypeLabel = (type: string) => {
    const labels = {
      motorcycle: 'Moto',
      bicycle: 'Bicicleta',
      car: 'Carro',
      on_foot: 'A pé'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getAccountTypeLabel = (type: string) => {
    return type === 'checking' ? 'Conta Corrente' : 'Poupança';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <AnimatedContainer animationType="fadeIn">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Meu Perfil</h1>
                <p className="text-gray-600">Gerencie suas informações pessoais e de entrega</p>
              </div>
              <div className="flex gap-3 mt-4 sm:mt-0">
                {isEditing ? (
                  <>
                    <Button onClick={handleSave} variant="primary">
                      Salvar
                    </Button>
                    <Button onClick={handleCancel} variant="outline">
                      Cancelar
                    </Button>
                  </>
                ) : (
                  <Button onClick={() => setIsEditing(true)} variant="primary">
                    Editar Perfil
                  </Button>
                )}
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 mb-6">
              <nav className="flex space-x-8">
                {[
                  { id: 'personal', label: 'Dados Pessoais' },
                  { id: 'vehicle', label: 'Veículo' },
                  { id: 'bank', label: 'Dados Bancários' },
                  { id: 'address', label: 'Endereço' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-red-500 text-red-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            {activeTab === 'personal' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                    {isEditing ? (
                      <Input
                        label="Nome"
                        value={profile.name}
                        onChangeText={(text) => handleInputChange('name', text)}
                        placeholder="Nome completo"
                      />
                    ) : (
                      <p className="text-gray-900">{profile.name}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                    {isEditing ? (
                      <Input
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                    {isEditing ? (
                      <Input
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
                      <Input
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
                    <Input
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
                  <Button
                    onClick={() => {}}
                    variant="outline"
                    className="text-red-600 border-red-600 hover:bg-red-50"
                  >
                    Sair da Conta
                  </Button>
                </div>
              </div>
            )}

            {activeTab === 'vehicle' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Veículo</label>
                  {isEditing ? (
                    <select
                      value={profile.vehicleType}
                      onChange={(e) => handleInputChange('vehicleType', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-black"
                    >
                      <option value="motorcycle">Moto</option>
                      <option value="bicycle">Bicicleta</option>
                      <option value="car">Carro</option>
                      <option value="on_foot">A pé</option>
                    </select>
                  ) : (
                    <p className="text-gray-900">{getVehicleTypeLabel(profile.vehicleType)}</p>
                  )}
                </div>

                {(profile.vehicleType === 'motorcycle' || profile.vehicleType === 'car') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Placa do Veículo</label>
                    {isEditing ? (
                      <Input
                        label="Placa do Veículo"
                        value={profile.licensePlate || ''}
                        onChangeText={(text) => handleInputChange('licensePlate', text)}
                        placeholder="ABC-1234"
                      />
                    ) : (
                      <p className="text-gray-900">{profile.licensePlate || 'Não informado'}</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'bank' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Banco</label>
                  {isEditing ? (
                    <Input
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-black"
                    >
                      <option value="checking">Conta Corrente</option>
                      <option value="savings">Poupança</option>
                    </select>
                  ) : (
                    <p className="text-gray-900">{getAccountTypeLabel(profile.bankInfo.accountType)}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Agência</label>
                    {isEditing ? (
                      <Input
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
                      <Input
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
                    <Input
                      label="Chave PIX"
                      value={profile.bankInfo.pixKey || ''}
                      onChangeText={(text) => handleInputChange('bankInfo.pixKey', text)}
                      placeholder="Chave PIX (opcional)"
                    />
                  ) : (
                    <p className="text-gray-900">{profile.bankInfo.pixKey || 'Não informado'}</p>
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
                      <Input
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
                      <Input
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
                    <Input
                      label="Complemento"
                      value={profile.address.complement || ''}
                      onChangeText={(text) => handleInputChange('address.complement', text)}
                      placeholder="Complemento (opcional)"
                    />
                  ) : (
                    <p className="text-gray-900">{profile.address.complement || 'Não informado'}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bairro</label>
                    {isEditing ? (
                      <Input
                        label="Bairro"
                        value={profile.address.neighborhood}
                        onChangeText={(text) => handleInputChange('address.neighborhood', text)}
                        placeholder="Bairro"
                      />
                    ) : (
                      <p className="text-gray-900">{profile.address.neighborhood}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
                    {isEditing ? (
                      <Input
                        label="Cidade"
                        value={profile.address.city}
                        onChangeText={(text) => handleInputChange('address.city', text)}
                        placeholder="Cidade"
                      />
                    ) : (
                      <p className="text-gray-900">{profile.address.city}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                    {isEditing ? (
                      <Input
                        label="Estado"
                        value={profile.address.state}
                        onChangeText={(text) => handleInputChange('address.state', text)}
                        placeholder="Estado"
                      />
                    ) : (
                      <p className="text-gray-900">{profile.address.state}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CEP</label>
                    {isEditing ? (
                      <Input
                        label="CEP"
                        value={profile.address.zipCode}
                        onChangeText={(text) => handleInputChange('address.zipCode', text)}
                        placeholder="CEP"
                      />
                    ) : (
                      <p className="text-gray-900">{profile.address.zipCode}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </AnimatedContainer>
      </div>
    </div>
  );
}