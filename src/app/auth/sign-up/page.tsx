'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { Eye, EyeOff, Mail, Lock, User, Phone, ArrowRight, Users, Store, Truck, Trash2 } from 'lucide-react';
import AnimatedContainer from '@/components/AnimatedContainer';
import LottieAnimation from '@/components/LottieAnimation';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/services/auth.service';
import { cleanupOrphanAccount } from '@/utils/cleanup-orphan-accounts';

export default function SignUpPage() {
  const router = useRouter();
  const { signUp, loading } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    user_type: 'customer' as UserRole,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showOrphanCleanup, setShowOrphanCleanup] = useState(false);
  const [orphanEmail, setOrphanEmail] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUserTypeSelect = (userType: UserRole) => {
    setFormData(prev => ({
      ...prev,
      user_type: userType
    }));
  };

  const handleCleanupOrphan = async () => {
    if (!orphanEmail || !formData.password) {
      toast.error('Email e senha são necessários para limpar a conta');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await cleanupOrphanAccount(orphanEmail, formData.password);
      
      if (result.success) {
        toast.success(result.message);
        if (result.accountDeleted) {
          setShowOrphanCleanup(false);
          setOrphanEmail('');
          // Tentar criar a conta novamente
          setTimeout(() => {
            handleSubmit(new Event('submit') as any);
          }, 1000);
        }
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Erro ao limpar conta órfã');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Validações básicas
    if (formData.password !== formData.confirmPassword) {
      toast.error('As senhas não coincidem');
      setIsSubmitting(false);
      return;
    }

    if (formData.password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      setIsSubmitting(false);
      return;
    }

    try {
      const result = await signUp(
        formData.email,
        formData.password,
        formData.name,
        formData.user_type
      );
      
      if (result.success) {
        toast.success('Conta criada com sucesso!');
        // O middleware cuidará do redirecionamento baseado no papel do usuário
        router.push('/');
      } else {
        // Se o erro for de email já em uso, mostrar opção de limpeza
        if (result.error?.includes('já está sendo usado')) {
          setOrphanEmail(formData.email);
          setShowOrphanCleanup(true);
          toast.error('Este email já está registrado. Você pode tentar limpar a conta órfã.');
        } else {
          toast.error(result.error || 'Erro ao criar conta');
        }
      }
    } catch (error) {
      toast.error('Erro inesperado ao criar conta');
    } finally {
      setIsSubmitting(false);
    }
  };

  const userTypeOptions = [
    { 
      value: 'customer' as UserRole, 
      label: 'Cliente', 
      description: 'Quero pedir comida',
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      hoverColor: 'hover:from-blue-600 hover:to-blue-700'
    },
    { 
      value: 'restaurant' as UserRole, 
      label: 'Restaurante', 
      description: 'Quero vender comida',
      icon: Store,
      color: 'from-green-500 to-green-600',
      hoverColor: 'hover:from-green-600 hover:to-green-700'
    },
    { 
      value: 'delivery' as UserRole, 
      label: 'Delivery', 
      description: 'Quero entregar comida',
      icon: Truck,
      color: 'from-purple-500 to-purple-600',
      hoverColor: 'hover:from-purple-600 hover:to-purple-700'
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50">
      <div className="flex flex-col lg:flex-row min-h-screen">
        {/* Left Side - User Type Selection */}
        <div className="flex-1 flex flex-col justify-center items-center p-4 lg:p-8 bg-white">
          <AnimatedContainer className="w-full max-w-lg">
            <div className="bg-white p-6 lg:p-8 rounded-lg shadow-lg">
              <div className="text-center mb-6 lg:mb-8">
                <h2 className="text-xl lg:text-2xl font-bold text-gray-900 mb-2 lg:mb-3">
                  Escolha seu Tipo de Conta
                </h2>
                <p className="text-gray-600 mb-4 lg:mb-6 text-sm lg:text-base">
                  Selecione como você quer usar nossa plataforma
                </p>
              </div>

             {/* Lottie Animation */}
             <div className="mb-6 lg:mb-8 flex justify-center">
               <LottieAnimation 
                 userType={formData.user_type}
                 width={150}
                 height={150}
                 className="drop-shadow-lg lg:w-[200px] lg:h-[200px]"
               />
             </div>

            {/* User Type Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4 w-full">
              {userTypeOptions.map((option) => {
                const IconComponent = option.icon;
                const isSelected = formData.user_type === option.value;
                
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleUserTypeSelect(option.value)}
                    className={`p-3 lg:p-4 rounded-xl border-2 transition-all duration-300 transform hover:scale-105 ${
                      isSelected 
                        ? 'border-red-500 bg-red-500 shadow-lg' 
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                    }`}
                  >
                    <div className="flex flex-col items-center space-y-2">
                      <div className={`p-2 lg:p-3 rounded-full ${
                        isSelected 
                          ? 'bg-red-600' 
                          : 'bg-gray-100'
                      }`}>
                        <IconComponent className={`w-5 h-5 lg:w-6 lg:h-6 ${
                          isSelected ? 'text-white' : 'text-gray-600'
                        }`} />
                      </div>
                      <span className={`font-medium text-sm lg:text-base ${
                        isSelected 
                          ? 'text-white' 
                          : 'text-gray-700'
                      }`}>
                        {option.label}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
            </div>
          </AnimatedContainer>
        </div>

        {/* Right Side - Form */}
        <div className="flex-1 flex flex-col justify-center items-center p-4 lg:p-8 bg-gray-50">
          <AnimatedContainer className="w-full max-w-md">
            <div className="bg-white rounded-2xl shadow-xl p-6 lg:p-8">
              {/* Header */}
              <div className="text-center mb-6 lg:mb-8">
                <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                  Criar Conta
                </h2>
                <p className="text-gray-600 text-sm lg:text-base">
                  Preencha seus dados para começar
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4 lg:space-y-6">
                {/* Name */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1 lg:mb-2">
                    Nome Completo
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 lg:w-5 lg:h-5" />
                    <input
                       type="text"
                       id="name"
                       name="name"
                       value={formData.name}
                       onChange={handleInputChange}
                       className="w-full pl-9 lg:pl-10 pr-3 lg:pr-4 py-2 lg:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors text-sm lg:text-base bg-white text-gray-900 placeholder-gray-500"
                       placeholder="Seu nome completo"
                       required
                      disabled={loading || isSubmitting}
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1 lg:mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 lg:w-5 lg:h-5" />
                    <input
                       type="email"
                       id="email"
                       name="email"
                       value={formData.email}
                       onChange={handleInputChange}
                       className="w-full pl-9 lg:pl-10 pr-3 lg:pr-4 py-2 lg:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors text-sm lg:text-base bg-white text-gray-900 placeholder-gray-500"
                       placeholder="seu@email.com"
                       required
                      disabled={loading || isSubmitting}
                    />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1 lg:mb-2">
                    Telefone
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 lg:w-5 lg:h-5" />
                    <input
                       type="tel"
                       id="phone"
                       name="phone"
                       value={formData.phone}
                       onChange={handleInputChange}
                       className="w-full pl-9 lg:pl-10 pr-3 lg:pr-4 py-2 lg:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors text-sm lg:text-base bg-white text-gray-900 placeholder-gray-500"
                       placeholder="(11) 99999-9999"
                       required
                      disabled={loading || isSubmitting}
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1 lg:mb-2">
                    Senha
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 lg:w-5 lg:h-5" />
                    <input
                       type={showPassword ? "text" : "password"}
                       id="password"
                       name="password"
                       value={formData.password}
                       onChange={handleInputChange}
                       className="w-full pl-9 lg:pl-10 pr-10 lg:pr-12 py-2 lg:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors text-sm lg:text-base bg-white text-gray-900 placeholder-gray-500"
                       placeholder="Mínimo 6 caracteres"
                       required
                      disabled={loading || isSubmitting}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      disabled={loading || isSubmitting}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4 lg:w-5 lg:h-5" /> : <Eye className="w-4 h-4 lg:w-5 lg:h-5" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1 lg:mb-2">
                    Confirmar Senha
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 lg:w-5 lg:h-5" />
                    <input
                       type={showConfirmPassword ? "text" : "password"}
                       id="confirmPassword"
                       name="confirmPassword"
                       value={formData.confirmPassword}
                       onChange={handleInputChange}
                       className="w-full pl-9 lg:pl-10 pr-10 lg:pr-12 py-2 lg:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors text-sm lg:text-base bg-white text-gray-900 placeholder-gray-500"
                       placeholder="Confirme sua senha"
                       required
                      disabled={loading || isSubmitting}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      disabled={loading || isSubmitting}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4 lg:w-5 lg:h-5" /> : <Eye className="w-4 h-4 lg:w-5 lg:h-5" />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading || isSubmitting}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-2 lg:py-3 px-4 lg:px-6 rounded-lg font-semibold hover:from-orange-600 hover:to-red-600 focus:ring-4 focus:ring-orange-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 text-sm lg:text-base"
                >
                  {loading || isSubmitting ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 lg:h-5 lg:w-5 border-b-2 border-white"></div>
                      <span>Criando conta...</span>
                    </div>
                  ) : (
                    'Criar Conta'
                  )}
                </button>
              </form>

              {/* Orphan Account Cleanup */}
              {showOrphanCleanup && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <Trash2 className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-yellow-800 mb-2">
                        Conta Órfã Detectada
                      </h4>
                      <p className="text-sm text-yellow-700 mb-3">
                        O email <strong>{orphanEmail}</strong> já existe no sistema, mas pode estar incompleto. 
                        Você pode tentar limpar esta conta para criar uma nova.
                      </p>
                      <div className="flex space-x-2">
                        <button
                          onClick={handleCleanupOrphan}
                          disabled={isSubmitting}
                          className="px-3 py-1.5 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700 disabled:opacity-50 transition-colors"
                        >
                          {isSubmitting ? 'Limpando...' : 'Limpar Conta'}
                        </button>
                        <button
                          onClick={() => setShowOrphanCleanup(false)}
                          disabled={isSubmitting}
                          className="px-3 py-1.5 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400 disabled:opacity-50 transition-colors"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Sign In Link */}
              <div className="text-center mt-4 lg:mt-6">
                <p className="text-gray-600 text-sm lg:text-base">
                  Já tem uma conta?{' '}
                  <Link 
                    href="/auth/sign-in" 
                    className="text-orange-600 hover:text-orange-700 font-medium hover:underline transition-colors"
                  >
                    Fazer login
                  </Link>
                </p>
              </div>
            </div>
          </AnimatedContainer>
        </div>
      </div>
    </div>
  );
}