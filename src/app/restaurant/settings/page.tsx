'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { 
  FaUser, FaEnvelope, FaPhone,
  FaSave, FaEdit, FaCalendarAlt,
  FaShieldAlt, FaKey
} from 'react-icons/fa';
import toast from 'react-hot-toast';
import { debugCookies } from '@/utils/debug-cookies';

interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  phone?: string;
  role: string;
  createdAt: any;
  updatedAt: any;
}


export default function RestaurantSettingsPage() {
  const { user, userData, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  
  // Form states
  const [formData, setFormData] = useState({
    displayName: '',
    phone: ''
  });

  useEffect(() => {
    if (!authLoading && user) {
      loadUserData();
    }
  }, [user, authLoading]);

  // Sincronizar formData quando userProfile ou restaurantInfo mudam
  useEffect(() => {
    if (userProfile) {
      console.log('🔄 [Settings] userProfile mudou, atualizando formData:', userProfile);
      setFormData(prev => ({
        ...prev,
        displayName: userProfile.displayName || '',
        phone: userProfile.phone || ''
      }));
    }
  }, [userProfile]);


  const loadUserData = async () => {
    try {
      setLoading(true);
      
      // Carregar dados do usuário
      if (userData) {
        const profile: UserProfile = {
          uid: user?.uid || '',
          displayName: userData.displayName || '',
          email: userData.email || '',
          phone: userData.phone || '',
          role: userData.role || '',
          createdAt: userData.createdAt,
          updatedAt: userData.updatedAt
        };
        setUserProfile(profile);
        
        // Atualizar form data
        setFormData(prev => ({
          ...prev,
          displayName: profile.displayName,
          phone: profile.phone || ''
        }));
      }

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar informações do perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Debug: verificar cookies disponíveis
      console.log('🔍 [Settings] Iniciando salvamento - verificando cookies...');
      debugCookies();
      
      // Verificar se houve mudanças nos dados do usuário
      const userDataChanged = 
        formData.displayName !== (userProfile?.displayName || '') ||
        formData.phone !== (userProfile?.phone || '');

      // Atualizar dados do usuário se necessário
      if (userDataChanged) {
        console.log('🔄 Atualizando dados do usuário...');
        const userResponse = await fetch('/api/user/update', {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json'
          },
          credentials: 'include', // Importante: inclui cookies automaticamente
          body: JSON.stringify({
            userData: {
              displayName: formData.displayName,
              phone: formData.phone
            }
          })
        });

        if (!userResponse.ok) {
          const error = await userResponse.json();
          throw new Error(error.error || 'Erro ao atualizar dados do usuário');
        }

        const userResult = await userResponse.json();
        console.log('✅ Dados do usuário atualizados:', userResult);
        
        // Atualizar estado local imediatamente
        if (userResult.userData) {
          console.log('🔄 [Settings] Atualizando userProfile local:', userResult.userData);
          setUserProfile(prev => ({
            ...prev,
            displayName: userResult.userData.displayName,
            phone: userResult.userData.phone,
            updatedAt: userResult.userData.updatedAt
          }));
        }
      } else {
        console.log('ℹ️ [Settings] Nenhuma mudança detectada nos dados do usuário');
      }

      toast.success('Perfil atualizado com sucesso!');
      setEditMode(false);
      
      // Nota: Estados já foram atualizados acima, não precisamos recarregar
      
    } catch (error) {
      console.error('❌ Erro ao salvar:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao atualizar perfil');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    try {
      const dateObj = date.toDate ? date.toDate() : new Date(date);
      return dateObj.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'N/A';
    }
  };

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-300">Carregando informações do perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 bg-[#101828] min-h-screen p-6">
      {/* Header */}
      <div className="bg-[#101828] rounded-xl shadow-sm border border-green-500 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center">
              <FaUser className="text-white text-2xl" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Configurações da Conta</h1>
              <p className="text-gray-300">Gerencie suas informações pessoais e do restaurante</p>
            </div>
          </div>
          <button
            onClick={() => setEditMode(!editMode)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              editMode 
                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            <FaEdit className="w-4 h-4" />
            <span>{editMode ? 'Cancelar' : 'Editar'}</span>
          </button>
        </div>
      </div>

      {/* Informações da Conta */}
      <div className="bg-[#101828] rounded-xl shadow-sm border border-green-500">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <FaShieldAlt className="text-red-600" />
            <h2 className="text-xl font-semibold text-white">Informações da Conta</h2>
          </div>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nome de Exibição */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome de Exibição
              </label>
              {editMode ? (
                <input
                  type="text"
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-green-500 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-white placeholder-gray-400 bg-gray-900"
                />
              ) : (
                <div className="flex items-center space-x-2">
                  <FaUser className="text-gray-400" />
                  <span className="text-white">{userProfile?.displayName || 'Não informado'}</span>
                </div>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email da Conta
              </label>
              <div className="flex items-center space-x-2">
                <FaEnvelope className="text-gray-400" />
                <span className="text-white">{userProfile?.email || 'Não informado'}</span>
                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Verificado</span>
              </div>
            </div>

            {/* Telefone Pessoal */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Telefone Pessoal
              </label>
              {editMode ? (
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="(11) 99999-9999"
                  className="w-full px-4 py-2 border border-green-500 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-white placeholder-gray-400 bg-gray-900"
                />
              ) : (
                <div className="flex items-center space-x-2">
                  <FaPhone className="text-gray-400" />
                  <span className="text-white">{userProfile?.phone || 'Não informado'}</span>
                </div>
              )}
            </div>

            {/* Tipo de Conta */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Conta
              </label>
              <div className="flex items-center space-x-2">
                <FaKey className="text-gray-400" />
                <span className="text-white capitalize">{userProfile?.role || 'Não definido'}</span>
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">Restaurante</span>
              </div>
            </div>
          </div>

          {/* Datas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-200">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Conta Criada em
              </label>
              <div className="flex items-center space-x-2">
                <FaCalendarAlt className="text-gray-400" />
                <span className="text-white">{formatDate(userProfile?.createdAt)}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Última Atualização
              </label>
              <div className="flex items-center space-x-2">
                <FaCalendarAlt className="text-gray-400" />
                <span className="text-white">{formatDate(userProfile?.updatedAt)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* Botões de Ação */}
      {editMode && (
        <div className="bg-[#101828] rounded-xl shadow-sm border border-green-500 p-6">
          <div className="flex items-center justify-end space-x-4">
            <button
              onClick={() => setEditMode(false)}
              className="px-6 py-2 border border-green-500 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center space-x-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {saving ? (
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
              ) : (
                <FaSave className="w-4 h-4" />
              )}
              <span>{saving ? 'Salvando...' : 'Salvar Alterações'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
