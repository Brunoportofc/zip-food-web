'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaUserAlt, FaMapMarkerAlt, FaSignOutAlt, FaEdit, FaTrash, FaPlus, FaSave, FaTimes, FaBell } from 'react-icons/fa';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'react-hot-toast';
import { profileService, Address, PaymentMethod, PersonalData } from '@/services/profile.service';
import NotificationManager from '@/components/NotificationManager';

export default function CustomerProfilePage() {
  const router = useRouter();
  const { user, userData, userRole, loading, signOut } = useAuth();
  const isAuthenticated = !!(user && userData);
  const isLoading = loading;
  
  // Estados para edição
  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  const [personalData, setPersonalData] = useState({
    name: user?.displayName || '',
    email: user?.email || '',
    phone: userData?.phone || ''
  });
  
  // Estados para endereços
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [newAddress, setNewAddress] = useState<Omit<Address, 'id' | 'userId'>>({
    label: '',
    street: '',
    neighborhood: '',
    city: '',
    state: '',
    zipCode: ''
  });
  
  // Estados para métodos de pagamento
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isAddingPayment, setIsAddingPayment] = useState(false);
  const [newPayment, setNewPayment] = useState<Omit<PaymentMethod, 'id' | 'userId'>>({
    type: 'credit',
    cardNumber: '',
    holderName: '',
    expiryDate: ''
  });
  const [profileLoading, setProfileLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'personal' | 'addresses' | 'notifications'>('personal');

  
  const loadProfileData = async () => {
    if (!user?.uid) return;
    
    try {
      setProfileLoading(true);
      const [userAddresses, userPaymentMethods] = await Promise.all([
        profileService.getUserAddresses(user.uid),
        profileService.getUserPaymentMethods(user.uid)
      ]);
      
      setAddresses(userAddresses);
      setPaymentMethods(userPaymentMethods);
    } catch (error) {
      console.error('Erro ao carregar dados do perfil:', error);
      toast.error('Erro ao carregar dados do perfil');
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    // Aguardar o carregamento da autenticação antes de fazer qualquer redirecionamento
    if (isLoading) {
      return;
    }
    
    if (!isAuthenticated) {
      router.push('/auth/sign-in');
      return;
    }
    
    // Atualizar dados pessoais quando o usuário mudar
    if (user && userData) {
      setPersonalData({
        name: user.displayName || '',
        email: user.email || '',
        phone: userData.phone || ''
      });
      loadProfileData();
    }
  }, [user, isAuthenticated, isLoading, router]);
  
  const handleSavePersonalData = async () => {
    if (!user?.uid) return;
    
    try {
      await profileService.updatePersonalData(user.uid, personalData);
      toast.success('Dados pessoais atualizados com sucesso');
      setIsEditingPersonal(false);
    } catch (error) {
      console.error('Erro ao atualizar dados:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao atualizar dados');
    }
  };
  
  const handleAddAddress = async () => {
    if (!user?.uid) return;
    
    try {
      await profileService.addAddress(user.uid, newAddress);
      await loadProfileData(); // Recarregar dados
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
    } catch (error) {
      console.error('Erro ao adicionar endereço:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao adicionar endereço');
    }
  };
  
  const handleRemoveAddress = async (id: string) => {
    if (!user?.uid) return;
    
    try {
      await profileService.removeAddress(user.uid, id);
      await loadProfileData(); // Recarregar dados
      toast.success('Endereço removido com sucesso');
    } catch (error) {
      console.error('Erro ao remover endereço:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao remover endereço');
    }
  };
  
  const handleAddPayment = async () => {
    if (!user?.uid) return;
    
    try {
      await profileService.addPaymentMethod(user.uid, newPayment);
      await loadProfileData(); // Recarregar dados
      setNewPayment({
         type: 'credit',
         cardNumber: '',
         expiryDate: '',
         holderName: ''
       });
       setIsAddingPayment(false);
       toast.success('Método de pagamento adicionado com sucesso');
     } catch (error) {
       console.error('Erro ao adicionar método de pagamento:', error);
       toast.error(error instanceof Error ? error.message : 'Erro ao adicionar método de pagamento');
     }
   };

  const handleRemovePayment = async (id: string) => {
    if (!user?.uid) return;
    
    try {
      await profileService.removePaymentMethod(user.uid, id);
       await loadProfileData(); // Recarregar dados
       toast.success('Método de pagamento removido com sucesso');
     } catch (error) {
       console.error('Erro ao remover método de pagamento:', error);
       toast.error(error instanceof Error ? error.message : 'Erro ao remover método de pagamento');
     }
   };
  
  const handleLogout = async () => {
    try {
      await signOut();
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
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#101828] p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <div className="lg:w-1/4">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <h2 className="text-xl font-bold mb-6 text-gray-900">Menu</h2>
              <nav className="space-y-2">
                <div 
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl cursor-pointer border-2 transition-colors ${
                    activeTab === 'personal' 
                      ? 'bg-primary-50 border-primary-100 text-primary-600' 
                      : 'border-transparent hover:border-primary-200 hover:bg-[#101828] text-gray-700'
                  }`}
                  onClick={() => setActiveTab('personal')}
                >
                  <FaUserAlt size={18} />
                  <span className="font-medium">Meus Dados</span>
                </div>
                
                <div 
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl cursor-pointer border-2 transition-colors ${
                    activeTab === 'addresses' 
                      ? 'bg-primary-50 border-primary-100 text-primary-600' 
                      : 'border-transparent hover:border-primary-200 hover:bg-[#101828] text-gray-700'
                  }`}
                  onClick={() => setActiveTab('addresses')}
                >
                  <FaMapMarkerAlt size={18} />
                  <span className="font-medium">Endereços</span>
                </div>
                
                <div 
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl cursor-pointer border-2 transition-colors ${
                    activeTab === 'notifications' 
                      ? 'bg-primary-50 border-primary-100 text-primary-600' 
                      : 'border-transparent hover:border-primary-200 hover:bg-[#101828] text-gray-700'
                  }`}
                  onClick={() => setActiveTab('notifications')}
                >
                  <FaBell size={18} />
                  <span className="font-medium">Notificações</span>
                </div>
                
                <div 
                  className="flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-primary-50 cursor-pointer border-2 border-transparent hover:border-primary-200"
                  onClick={handleLogout}
                >
                  <FaSignOutAlt className="text-primary-600" size={18} />
                  <span className="text-primary-600 font-medium">Sair</span>
                </div>
              </nav>
            </div>
          </div>
          
          {/* Main Content */}
          <div className="lg:w-3/4">
            <div className="space-y-6">
              {/* Header */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                <h1 className="text-3xl font-bold text-primary-600 mb-2">Meu Perfil</h1>
                <p className="text-gray-600">Gerencie suas informações pessoais e preferências</p>
              </div>
        
              {/* Profile Header */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                <div className="flex flex-col items-center">
                  <div className="w-24 h-24 rounded-full bg-gray-300 flex items-center justify-center mb-4">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt="Profile" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <span className="text-3xl text-gray-800">👤</span>
                    )}
                  </div>
                  <h2 className="text-xl font-semibold">{user.displayName}</h2>
                  <p className="text-gray-700">{user.email}</p>
                </div>
              </div>

              {/* Personal Information */}
              {activeTab === 'personal' && (
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Dados Pessoais</h2>
                  {!isEditingPersonal ? (
                    <button 
                      onClick={() => setIsEditingPersonal(true)}
                      className="px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors font-medium flex items-center gap-2"
                    >
                      <FaEdit /> Editar
                    </button>
                  ) : (
                    <div className="flex gap-3">
                      <button 
                        onClick={handleSavePersonalData}
                        className="px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors font-medium flex items-center gap-2"
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
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors text-black"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">E-mail</label>
                      <input
                        type="email"
                        value={personalData.email}
                        onChange={(e) => setPersonalData({...personalData, email: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors text-black"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Telefone</label>
                      <input
                        type="tel"
                        value={personalData.phone}
                        onChange={(e) => setPersonalData({...personalData, phone: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors text-black"
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
              )}

              {/* Endereços */}
              {activeTab === 'addresses' && (
                <div className="mb-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                    <FaMapMarkerAlt className="text-primary-600" />
                    Endereços
                  </h2>
                  <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">Meus Endereços</h3>
            
            {addresses.map((address) => (
              <div key={address.id} className="border border-gray-200 rounded-xl p-4 mb-4 bg-[#101828]">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-gray-900">{address.label}</p>
                    <p className="text-gray-700">{address.street}</p>
                    <p className="text-gray-700">{address.neighborhood}, {address.city} - {address.state}</p>
                    <p className="text-gray-700">CEP: {address.zipCode}</p>
                  </div>
                  <div className="flex gap-3">
                    <button className="text-primary-600 hover:text-primary-700 p-2 rounded-lg hover:bg-primary-50 transition-colors flex items-center gap-1">
                      <FaEdit size={16} /> Editar
                    </button>
                    <button 
                      onClick={() => handleRemoveAddress(address.id)}
                      className="text-primary-600 hover:text-primary-700 p-2 rounded-lg hover:bg-primary-50 transition-colors flex items-center gap-1"
                    >
                      <FaTrash size={16} /> Remover
                    </button>
                  </div>
                </div>
              </div>
            ))}
            
            {isAddingAddress ? (
              <div className="bg-primary-50 p-4 rounded-xl mb-4 border border-primary-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                  <input
                    type="text"
                    placeholder="Nome do endereço (ex: Casa, Trabalho)"
                    value={newAddress.label}
                    onChange={(e) => setNewAddress({...newAddress, label: e.target.value})}
                    className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors text-black"
                  />
                  <input
                    type="text"
                    placeholder="Rua, número"
                    value={newAddress.street}
                    onChange={(e) => setNewAddress({...newAddress, street: e.target.value})}
                    className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors text-black"
                  />
                  <input
                    type="text"
                    placeholder="Bairro"
                    value={newAddress.neighborhood}
                    onChange={(e) => setNewAddress({...newAddress, neighborhood: e.target.value})}
                    className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors text-black"
                  />
                  <input
                    type="text"
                    placeholder="Cidade"
                    value={newAddress.city}
                    onChange={(e) => setNewAddress({...newAddress, city: e.target.value})}
                    className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors text-black"
                  />
                  <input
                    type="text"
                    placeholder="Estado"
                    value={newAddress.state}
                    onChange={(e) => setNewAddress({...newAddress, state: e.target.value})}
                    className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors text-black"
                  />
                  <input
                    type="text"
                    placeholder="CEP"
                    value={newAddress.zipCode}
                    onChange={(e) => setNewAddress({...newAddress, zipCode: e.target.value})}
                    className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors text-black"
                  />
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={handleAddAddress}
                    className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-xl flex items-center gap-2 font-medium focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
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
                className="bg-primary-600 hover:bg-primary-700 text-white py-3 px-6 rounded-xl flex items-center gap-2 mt-4 font-medium focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
              >
                <FaPlus /> Adicionar Novo Endereço
              </button>
            )}
                  </div>
                </div>
              )}

              {/* Notificações */}
              {activeTab === 'notifications' && (
                <div className="mb-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                    <FaBell className="text-primary-600" />
                    Notificações
                  </h2>
                  <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                    <NotificationManager userId={user.uid} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}