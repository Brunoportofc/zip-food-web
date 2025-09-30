'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { Eye, EyeOff, Mail, Lock, User, Phone, ArrowRight, Users, Store, Truck, Trash2 } from 'lucide-react';
import AnimatedContainer from '@/components/AnimatedContainer';
import LottieAnimation from '@/components/LottieAnimation';
import MetaballsBackground from '@/components/MetaballsBackground';
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
        formData.user_type,
        formData.phone
      );
      
      if (result.success) {
        toast.success('Conta criada com sucesso!');
        
        // Redirecionar baseado no tipo de usuário
        switch (formData.user_type) {
          case 'customer':
            router.push('/customer');
            break;
          case 'restaurant':
            router.push('/restaurant');
            break;
          default:
            router.push('/');
        }
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
      color: 'from-primary to-primary-dark',
      hoverColor: 'hover:from-primary-dark hover:to-primary-800'
    },
    { 
      value: 'restaurant' as UserRole, 
      label: 'Restaurante', 
      description: 'Quero vender comida',
      icon: Store,
      color: 'from-primary to-primary-dark',
      hoverColor: 'hover:from-primary-dark hover:to-primary-800'
    }
  ];

  return (
    <div className="min-h-screen bg-background relative">
      {/* Animated Background */}
      <MetaballsBackground />
      
      <div className="flex flex-col lg:flex-row min-h-screen relative z-10">
        {/* Left Side - User Type Selection */}
        <div className="flex-1 flex flex-col justify-center items-center p-4 lg:p-8">
          <AnimatedContainer className="w-full max-w-lg">
            <div className="bg-gray-800/90 p-8 lg:p-10 rounded-3xl shadow-2xl border border-primary/30 backdrop-blur-lg">
              <div className="text-center mb-8 lg:mb-10">
                <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-3 lg:mb-4">
                  Escolha seu Tipo de Conta
                </h2>
                <p className="text-gray-300 mb-6 lg:mb-8 text-base lg:text-lg leading-relaxed">
                  Selecione como você quer usar nossa plataforma
                </p>
              </div>

             {/* Lottie Animation */}
             <div className="mb-8 lg:mb-10 flex justify-center">
               <div className="relative">
                 <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl"></div>
                 <LottieAnimation 
                   userType={formData.user_type}
                   width={180}
                   height={180}
                   className="relative drop-shadow-2xl lg:w-[220px] lg:h-[220px]"
                 />
               </div>
             </div>

            {/* User Type Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-8 w-full">
              {userTypeOptions.map((option) => {
                const IconComponent = option.icon;
                const isSelected = formData.user_type === option.value;
                
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleUserTypeSelect(option.value)}
                    className={`group relative p-6 lg:p-8 rounded-2xl border-2 transition-all duration-500 transform hover:scale-105 hover:shadow-2xl ${
                      isSelected 
                        ? 'border-primary bg-primary/15 shadow-2xl shadow-primary/30' 
                        : 'border-gray-600/50 bg-gray-700/30 hover:border-primary/60 hover:bg-gray-700/50'
                    }`}
                  >
                    {/* Glow effect for selected */}
                    {isSelected && (
                      <div className="absolute inset-0 bg-primary/10 rounded-2xl blur-sm"></div>
                    )}
                    
                    <div className="relative flex flex-col items-center space-y-4">
                      <div className={`p-4 lg:p-5 rounded-2xl transition-all duration-500 ${
                        isSelected 
                          ? 'bg-primary text-background shadow-lg shadow-primary/40' 
                          : 'bg-gray-600/70 text-gray-300 group-hover:bg-gray-500/70'
                      }`}>
                        <IconComponent className={`w-8 h-8 lg:w-10 lg:h-10 transition-transform duration-300 ${
                          isSelected ? 'scale-110' : 'group-hover:scale-105'
                        }`} />
                      </div>
                      <span className={`font-bold text-lg lg:text-xl transition-all duration-300 ${
                        isSelected 
                          ? 'text-primary' 
                          : 'text-foreground group-hover:text-primary/80'
                      }`}>
                        {option.label}
                      </span>
                      
                      {/* Selection indicator */}
                      {isSelected && (
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-background rounded-full"></div>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
            </div>
          </AnimatedContainer>
        </div>

        {/* Right Side - Form */}
        <div className="flex-1 flex flex-col justify-center items-center p-4 lg:p-8">
          <AnimatedContainer className="w-full max-w-xl">
            <div className="bg-white/5 backdrop-blur-xl rounded-3xl shadow-2xl shadow-primary/10 border border-white/10 p-8 lg:p-12 transition-all duration-500 hover:shadow-primary/20 hover:border-white/20 relative overflow-hidden">
              {/* Decorative gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-blue-500/5 pointer-events-none"></div>
              
              {/* Header */}
              <div className="text-center mb-6 lg:mb-8 relative z-10">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary to-blue-500 rounded-2xl mb-4 shadow-lg shadow-primary/30">
                  <User className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-3 bg-gradient-to-r from-primary via-blue-400 to-primary bg-clip-text text-transparent">
                  Criar Conta
                </h2>
                <p className="text-gray-300 text-base lg:text-lg leading-relaxed font-light">
                  Preencha seus dados para começar
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4 lg:space-y-5 relative z-10">
                {/* Name */}
                <div className="group">
                  <label htmlFor="name" className="block text-sm font-semibold text-foreground mb-3 transition-colors group-focus-within:text-primary">
                    Nome Completo
                  </label>
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-blue-500/10 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300"></div>
                    <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 transition-colors group-focus-within:text-primary z-10" />
                    <input
                       type="text"
                       id="name"
                       name="name"
                       value={formData.name}
                       onChange={handleInputChange}
                       className="w-full pl-12 pr-4 py-3 lg:py-4 border border-white/10 bg-white/5 backdrop-blur-sm rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-300 text-base lg:text-lg text-foreground placeholder-gray-400 hover:border-white/20 hover:bg-white/10 relative z-10"
                       placeholder="Seu nome completo"
                       required
                      disabled={loading || isSubmitting}
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="group">
                  <label htmlFor="email" className="block text-sm font-semibold text-foreground mb-3 transition-colors group-focus-within:text-primary">
                    Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-blue-500/10 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300"></div>
                    <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 transition-colors group-focus-within:text-primary z-10" />
                    <input
                       type="email"
                       id="email"
                       name="email"
                       value={formData.email}
                       onChange={handleInputChange}
                       className="w-full pl-12 pr-4 py-3 lg:py-4 border border-white/10 bg-white/5 backdrop-blur-sm rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-300 text-base lg:text-lg text-foreground placeholder-gray-400 hover:border-white/20 hover:bg-white/10 relative z-10"
                       placeholder="seu@email.com"
                       required
                      disabled={loading || isSubmitting}
                    />
                  </div>
                </div>

                {/* Phone */}
                <div className="group">
                  <label htmlFor="phone" className="block text-sm font-semibold text-foreground mb-3 transition-colors group-focus-within:text-primary">
                    Telefone
                  </label>
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-blue-500/10 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300"></div>
                    <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 transition-colors group-focus-within:text-primary z-10" />
                    <input
                       type="tel"
                       id="phone"
                       name="phone"
                       value={formData.phone}
                       onChange={handleInputChange}
                       className="w-full pl-12 pr-4 py-3 lg:py-4 border border-white/10 bg-white/5 backdrop-blur-sm rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-300 text-base lg:text-lg text-foreground placeholder-gray-400 hover:border-white/20 hover:bg-white/10 relative z-10"
                       placeholder="(11) 99999-9999"
                       required
                      disabled={loading || isSubmitting}
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="group">
                  <label htmlFor="password" className="block text-sm font-semibold text-foreground mb-3 transition-colors group-focus-within:text-primary">
                    Senha
                  </label>
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-blue-500/10 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300"></div>
                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 transition-colors group-focus-within:text-primary z-10" />
                    <input
                       type={showPassword ? "text" : "password"}
                       id="password"
                       name="password"
                       value={formData.password}
                       onChange={handleInputChange}
                       className="w-full pl-12 pr-14 py-3 lg:py-4 border border-white/10 bg-white/5 backdrop-blur-sm rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-300 text-base lg:text-lg text-foreground placeholder-gray-400 hover:border-white/20 hover:bg-white/10 relative z-10"
                       placeholder="Mínimo 6 caracteres"
                       required
                      disabled={loading || isSubmitting}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-primary transition-colors duration-200 p-2 rounded-lg hover:bg-white/10 z-10"
                      disabled={loading || isSubmitting}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="group">
                  <label htmlFor="confirmPassword" className="block text-sm font-semibold text-foreground mb-3 transition-colors group-focus-within:text-primary">
                    Confirmar Senha
                  </label>
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-blue-500/10 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300"></div>
                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 transition-colors group-focus-within:text-primary z-10" />
                    <input
                       type={showConfirmPassword ? "text" : "password"}
                       id="confirmPassword"
                       name="confirmPassword"
                       value={formData.confirmPassword}
                       onChange={handleInputChange}
                       className="w-full pl-12 pr-14 py-3 lg:py-4 border border-white/10 bg-white/5 backdrop-blur-sm rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-300 text-base lg:text-lg text-foreground placeholder-gray-400 hover:border-white/20 hover:bg-white/10 relative z-10"
                       placeholder="Confirme sua senha"
                       required
                      disabled={loading || isSubmitting}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-primary transition-colors duration-200 p-2 rounded-lg hover:bg-white/10 z-10"
                      disabled={loading || isSubmitting}
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading || isSubmitting}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-3 lg:py-4 px-6 rounded-xl font-bold text-base lg:text-lg focus:ring-4 focus:ring-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.02] hover:shadow-2xl hover:shadow-green-500/40 mt-6 lg:mt-8 relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  {loading || isSubmitting ? (
                    <div className="flex items-center justify-center space-x-3 relative z-10">
                      <div className="animate-spin rounded-full h-5 w-5 lg:h-6 lg:w-6 border-b-2 border-white"></div>
                      <span>Criando conta...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-3 relative z-10">
                      <span>Criar Conta</span>
                      <ArrowRight className="w-5 h-5 lg:w-6 lg:h-6 transition-transform group-hover:translate-x-1" />
                    </div>
                  )}
                </button>
              </form>

              {/* Orphan Account Cleanup */}
              {showOrphanCleanup && (
                <div className="mt-4 p-5 bg-gradient-to-r from-warning/10 to-orange-500/10 border border-warning/20 rounded-2xl backdrop-blur-sm relative z-10">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-warning to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                      <Trash2 className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-base font-bold text-warning mb-3">
                        Conta Órfã Detectada
                      </h4>
                      <p className="text-sm text-gray-300 mb-4 leading-relaxed">
                        O email <strong className="text-white">{orphanEmail}</strong> já existe no sistema, mas pode estar incompleto. 
                        Você pode tentar limpar esta conta para criar uma nova.
                      </p>
                      <div className="flex space-x-3">
                        <button
                          onClick={handleCleanupOrphan}
                          disabled={isSubmitting}
                          className="px-4 py-2.5 bg-gradient-to-r from-warning to-orange-500 text-white text-sm font-semibold rounded-xl hover:from-warning/80 hover:to-orange-500/80 disabled:opacity-50 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                        >
                          {isSubmitting ? 'Limpando...' : 'Limpar Conta'}
                        </button>
                        <button
                          onClick={() => setShowOrphanCleanup(false)}
                          disabled={isSubmitting}
                          className="px-4 py-2.5 bg-white/10 text-foreground text-sm font-semibold rounded-xl hover:bg-white/20 disabled:opacity-50 transition-all duration-300 backdrop-blur-sm border border-white/10"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Sign In Link */}
              <div className="text-center mt-6 lg:mt-8 relative z-10">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent h-px top-1/2"></div>
                  <div className="relative bg-gray-900 px-4">
                    <p className="text-gray-300 text-base lg:text-lg font-light">
                      Já tem uma conta?{' '}
                      <Link 
                        href="/auth/sign-in" 
                        className="text-primary hover:text-blue-400 font-semibold hover:underline transition-all duration-300 inline-flex items-center space-x-1 group"
                      >
                        <span>Fazer login</span>
                        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                      </Link>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </AnimatedContainer>
        </div>
      </div>
    </div>
  );
}