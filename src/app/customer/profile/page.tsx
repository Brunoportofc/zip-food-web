'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaUserAlt, FaMapMarkerAlt, FaSignOutAlt, FaEdit, FaTrash, FaPlus, FaSave, FaTimes } from 'react-icons/fa';
import { useAuthData, useAuthActions } from '@/store/auth.store';
import { toast } from 'react-hot-toast';


interface Address {
  id: string;
  label: string;
  street: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  isDefault?: boolean;
}



export default function CustomerProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuthData();
  const { logout } = useAuthActions();
  
  // Estados para edição
  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  const [personalData, setPersonalData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || ''
  });
  
  // Estados para endereços
  const [addresses, setAddresses] = useState<Address[]>([
    {
      id: '1',
      label: 'Casa',
      street: 'Rua Exemplo, 123',
      neighborhood: 'Bairro',
      city: 'Cidade',
      state: 'Estado',
      zipCode: '00000-000',
      isDefault: true
    }
  ]);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [newAddress, setNewAddress] = useState<Omit<Address, 'id'>>({
    label: '',
    street: '',
    neighborhood: '',
    city: '',
    state: '',
    zipCode: ''
  });
  

  
  useEffect(() => {
    // Não redirecionar se ainda estiver carregando
    if (isLoading) {
      return;
    }
    
    if (!isAuthenticated) {
      router.push('/auth/sign-in');
      return;
    }
    
    // Atualizar dados pessoais quando o usuário mudar
    if (user) {
      setPersonalData({
        name: user.name,
        email: user.email,
        phone: user.phone || ''
      });
    }
  }, [user, isAuthenticated, isLoading, router]);
  
  const handleSavePersonalData = () => {
    // Em produção, aqui faria a chamada para a API
    toast.success('Dados pessoais atualizados com sucesso');
    setIsEditingPersonal(false);
  };
  
  const handleAddAddress = () => {
    if (!newAddress.label || !newAddress.street || !newAddress.city) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    
    const address: Address = {
      ...newAddress,
      id: Date.now().toString()
    };
    
    setAddresses([...addresses, address]);
    setNewAddress({
      label: '',
      street: '',
      neighborhood: '',
      city: '',
      state: '',
      zipCode: ''
    });
    setIsAddingAddress(false);
    toast.success('Endereço adicionado com sucesso');
  };
  
  const handleRemoveAddress = (id: string) => {
    setAddresses(addresses.filter(addr => addr.id !== id));
    toast.success('Endereço removido com sucesso');
  };
  
  const handleAddPayment = () => {
    if (!newPayment.cardNumber || !newPayment.expiryDate || !newPayment.holderName) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    
    const payment: PaymentMethod = {
      ...newPayment,
      id: Date.now().toString(),
      cardNumber: `**** **** **** ${newPayment.cardNumber.slice(-4)}`
    };
    
    setPaymentMethods([...paymentMethods, payment]);
    setNewPayment({
      type: 'credit',
      cardNumber: '',
      expiryDate: '',
      holderName: ''
    });
    setIsAddingPayment(false);
    toast.success('Método de pagamento adicionado com sucesso');
  };

  const handleRemovePayment = (id: string) => {
    setPaymentMethods(paymentMethods.filter(payment => payment.id !== id));
    toast.success('Método de pagamento removido com sucesso');
  };
  
  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logout realizado com sucesso');
      router.push('/auth/sign-in');
    } catch (error) {
      toast.error('Erro ao fazer logout');
    }
  };
  
  if (isLoading || !isAuthenticated || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <div className="lg:w-1/4">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <h2 className="text-xl font-bold mb-6 text-gray-900">Menu</h2>
              <nav className="space-y-2">
                <div className="flex items-center space-x-3 px-4 py-3 rounded-xl bg-red-50 cursor-pointer border-2 border-red-100">
                  <FaUserAlt className="text-red-600" size={18} />
                  <span className="text-red-600 font-medium">Meus Dados</span>
                </div>
                
                <div className="flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-gray-50 cursor-pointer border-2 border-transparent hover:border-red-200">
                  <FaMapMarkerAlt className="text-gray-700" size={18} />
                  <span className="text-gray-800">Endereços</span>
                </div>
                
                <div 
                  className="flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-red-50 cursor-pointer border-2 border-transparent hover:border-red-200"
                  onClick={handleLogout}
                >
                  <FaSignOutAlt className="text-red-600" size={18} />
                  <span className="text-red-600 font-medium">Sair</span>
                </div>
              </nav>
            </div>
          </div>
          
          {/* Main Content */}
          <div className="lg:w-3/4">
            <div className="space-y-6">
              {/* Header */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                <h1 className="text-3xl font-bold text-red-600 mb-2">Meu Perfil</h1>
                <p className="text-gray-600">Gerencie suas informações pessoais e preferências</p>
              </div>
        
              {/* Profile Header */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                <div className="flex flex-col items-center">
                  <div className="w-24 h-24 rounded-full bg-gray-300 flex items-center justify-center mb-4">
                    {user.profileImage ? (
                      <img src={user.profileImage} alt="Profile" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <span className="text-3xl text-gray-800">👤</span>
                    )}
                  </div>
                  <h2 className="text-xl font-semibold">{user.name}</h2>
                  <p className="text-gray-700">{user.email}</p>
                </div>
              </div>

              {/* Personal Information */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Dados Pessoais</h2>
                  {!isEditingPersonal ? (
                    <button 
                      onClick={() => setIsEditingPersonal(true)}
                      className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors font-medium flex items-center gap-2"
                    >
                      <FaEdit /> Editar
                    </button>
                  ) : (
                    <div className="flex gap-3">
                      <button 
                        onClick={handleSavePersonalData}
                        className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors font-medium flex items-center gap-2"
                      >
                        <FaSave /> Salvar
                      </button>
                      <button 
                        onClick={() => setIsEditingPersonal(false)}
                        className="px-6 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors font-medium flex items-center gap-2"
                      >
                        <FaTimes /> Cancelar
                      </button>
                    </div>
                  )}
                </div>
                
                {isEditingPersonal ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Nome Completo</label>
                      <input
                        type="text"
                        value={personalData.name}
                        onChange={(e) => setPersonalData({...personalData, name: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-colors text-black"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">E-mail</label>
                      <input
                        type="email"
                        value={personalData.email}
                        onChange={(e) => setPersonalData({...personalData, email: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-colors text-black"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Telefone</label>
                      <input
                        type="tel"
                        value={personalData.phone}
                        onChange={(e) => setPersonalData({...personalData, phone: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-colors text-black"
                        placeholder="(11) 99999-9999"
                      />
                    </div>

                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Nome Completo</label>
                      <p className="text-gray-900 py-3">{personalData.name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">E-mail</label>
                      <p className="text-gray-900 py-3">{personalData.email}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Telefone</label>
                      <p className="text-gray-900 py-3">{personalData.phone || 'Não informado'}</p>
                    </div>

                  </div>
                )}
              </div>

              {/* Endereços */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Endereços</h3>
            
            {addresses.map((address) => (
              <div key={address.id} className="border border-gray-200 rounded-xl p-4 mb-4 bg-gray-50">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-gray-900">{address.label}</p>
                    <p className="text-gray-700">{address.street}</p>
                    <p className="text-gray-700">{address.neighborhood}, {address.city} - {address.state}</p>
                    <p className="text-gray-700">CEP: {address.zipCode}</p>
                  </div>
                  <div className="flex gap-3">
                    <button className="text-red-600 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-1">
                      <FaEdit size={16} /> Editar
                    </button>
                    <button 
                      onClick={() => handleRemoveAddress(address.id)}
                      className="text-red-600 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-1"
                    >
                      <FaTrash size={16} /> Remover
                    </button>
                  </div>
                </div>
              </div>
            ))}
            
            {isAddingAddress ? (
              <div className="bg-red-50 p-4 rounded-xl mb-4 border border-red-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                  <input
                    type="text"
                    placeholder="Nome do endereço (ex: Casa, Trabalho)"
                    value={newAddress.label}
                    onChange={(e) => setNewAddress({...newAddress, label: e.target.value})}
                    className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-colors text-black"
                  />
                  <input
                    type="text"
                    placeholder="Rua, número"
                    value={newAddress.street}
                    onChange={(e) => setNewAddress({...newAddress, street: e.target.value})}
                    className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-colors text-black"
                  />
                  <input
                    type="text"
                    placeholder="Bairro"
                    value={newAddress.neighborhood}
                    onChange={(e) => setNewAddress({...newAddress, neighborhood: e.target.value})}
                    className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-colors text-black"
                  />
                  <input
                    type="text"
                    placeholder="Cidade"
                    value={newAddress.city}
                    onChange={(e) => setNewAddress({...newAddress, city: e.target.value})}
                    className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-colors text-black"
                  />
                  <input
                    type="text"
                    placeholder="Estado"
                    value={newAddress.state}
                    onChange={(e) => setNewAddress({...newAddress, state: e.target.value})}
                    className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-colors text-black"
                  />
                  <input
                    type="text"
                    placeholder="CEP"
                    value={newAddress.zipCode}
                    onChange={(e) => setNewAddress({...newAddress, zipCode: e.target.value})}
                    className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-colors text-black"
                  />
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={handleAddAddress}
                    className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl flex items-center gap-2 font-medium focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
                  >
                    <FaSave /> Salvar
                  </button>
                  <button 
                    onClick={() => setIsAddingAddress(false)}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-xl flex items-center gap-2 font-medium focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                  >
                    <FaTimes /> Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <button 
                onClick={() => setIsAddingAddress(true)}
                className="bg-red-600 hover:bg-red-700 text-white py-3 px-6 rounded-xl flex items-center gap-2 mt-4 font-medium focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
              >
                <FaPlus /> Adicionar Novo Endereço
              </button>
            )}
          </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}