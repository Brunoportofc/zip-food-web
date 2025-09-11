'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

import { FiLock, FiMail, FiUser } from 'react-icons/fi';
import { MdRestaurant, MdDeliveryDining, MdPerson } from 'react-icons/md';
import LottieAnimation from '@/components/LottieAnimation';

import { showAlert } from '@/lib/platform';
import useAuthStore, { UserType } from '@/store/auth.store';
import AnimatedContainer from '@/components/AnimatedContainer';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { restaurantConfigService } from '@/services/restaurant-config.service';


const SignUp = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignUpContent />
    </Suspense>
  );
};

const SignUpContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const type = searchParams.get('type');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [userType, setUserType] = useState<UserType>('customer');
  
  const { signUp, setUserType: storeSetUserType, isAuthenticated } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  


  useEffect(() => {
    if (type && (type === 'customer' || type === 'restaurant' || type === 'delivery')) {
      setUserType(type as UserType);
    }
  }, [type]);

  // Comentado o redirecionamento automático para permitir logout/troca de conta
  // useEffect(() => {
  //   if (isAuthenticated) {
  //     const { userType } = useAuthStore.getState();
  //     switch (userType) {
  //       case 'restaurant':
  //         router.push('/restaurant');
  //         break;
  //       case 'delivery':
  //         router.push('/delivery');
  //         break;
  //       default:
  //         router.push('/customer');
  //         break;
  //     }
  //   }
  // }, [isAuthenticated, router]);

  const submit = async () => {
    const { name, email, password, confirmPassword } = form;

    if (!name || !email || !password || !confirmPassword) {
      return showAlert('Erro', 'Por favor, preencha todos os campos');
    }

    if (password !== confirmPassword) {
      return showAlert('Erro', 'As senhas não coincidem');
    }

    setIsSubmitting(true);
    setIsLoading(true);

    try {
      // Salva o tipo de usuário no store antes de fazer cadastro
      storeSetUserType(userType);
      await signUp(name, email, password);
      
      // Obter o usuário do store após o signUp
      const currentUser = useAuthStore.getState().user;
      
      // Redirecionamentos baseados no tipo de usuário
      switch (userType) {
        case 'restaurant':
          // Verificar se o restaurante já tem configuração
          try {
            if (currentUser) {
              const isConfigured = await restaurantConfigService.isRestaurantConfigured(currentUser.id);
              if (isConfigured) {
                const config = await restaurantConfigService.getRestaurantConfig(currentUser.id);
                if (config && config.approvalStatus === 'approved') {
                  router.push('/restaurant');
                } else {
                  router.push('/restaurant/aprovacao');
                }
              } else {
                router.push('/restaurant/cadastro');
              }
            } else {
              router.push('/restaurant/cadastro');
            }
          } catch (error) {
            console.error('Erro ao verificar configuração:', error);
            router.push('/restaurant/cadastro');
          }
          break;
        case 'delivery':
          router.push('/delivery');
          break;
        default:
          router.push('/customer');
          break;
      }
    } catch (error: any) {
      showAlert('Erro', error.message || 'Falha no cadastro');
      console.error(error);
    } finally {
      setIsSubmitting(false);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Side - Profile Selection and Animation */}
      <div className="flex-1 flex flex-col justify-center items-center p-8 bg-white">
        {/* Animation Section */}
        <AnimatedContainer animationType="fadeInDown" delay={200}>
          <div className="mb-12">
            <div className="w-48 h-48 flex items-center justify-center">
              <LottieAnimation userType={userType} width={192} height={192} />
            </div>
          </div>
        </AnimatedContainer>

        {/* Profile Selection */}
        <AnimatedContainer animationType="fadeInUp" delay={300}>
          <div className="w-full max-w-md">
            <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
              Selecione seu perfil
            </h2>
            
            <div className="grid grid-cols-3 gap-4">
              <button
                onClick={() => setUserType('customer')}
                className={`p-4 rounded-xl flex flex-col items-center justify-center transition-all border-2 ${
                  userType === 'customer' 
                    ? 'bg-red-600 text-white border-red-600' 
                    : 'bg-white text-gray-700 border-gray-200 hover:border-red-600 hover:text-red-600'
                }`}
              >
                <MdPerson size={32} />
                <span className="mt-2 font-medium text-sm">Cliente</span>
              </button>
              
              <button
                onClick={() => setUserType('restaurant')}
                className={`p-4 rounded-xl flex flex-col items-center justify-center transition-all border-2 ${
                  userType === 'restaurant' 
                    ? 'bg-red-600 text-white border-red-600' 
                    : 'bg-white text-gray-700 border-gray-200 hover:border-red-600 hover:text-red-600'
                }`}
              >
                <MdRestaurant size={32} />
                <span className="mt-2 font-medium text-sm">Restaurante</span>
              </button>
              
              <button
                onClick={() => setUserType('delivery')}
                className={`p-4 rounded-xl flex flex-col items-center justify-center transition-all border-2 ${
                  userType === 'delivery' 
                    ? 'bg-red-600 text-white border-red-600' 
                    : 'bg-white text-gray-700 border-gray-200 hover:border-red-600 hover:text-red-600'
                }`}
              >
                <MdDeliveryDining size={32} />
                <span className="mt-2 font-medium text-sm">Entregador</span>
              </button>
            </div>
          </div>
        </AnimatedContainer>
      </div>

      {/* Right Side - Signup Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Header */}
          <AnimatedContainer animationType="fadeInUp" delay={400}>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-red-600 mb-2">Zip Food</h1>
            </div>
          </AnimatedContainer>

          {/* Signup Form */}
          <AnimatedContainer animationType="fadeInUp" delay={500}>
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 space-y-6">
              {/* Name Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome
                </label>
                <div className="relative">
                  <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-colors text-black"
                    placeholder="Digite seu nome"
                    value={form.name}
                    onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  />
                </div>
              </div>

              {/* Email Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="email"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-colors text-black"
                    placeholder="Digite seu email"
                    value={form.email}
                    onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Senha
                </label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="password"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-colors text-black"
                    placeholder="Digite sua senha"
                    value={form.password}
                    onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                  />
                </div>
              </div>

              {/* Confirm Password Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmar Senha
                </label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="password"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-colors text-black"
                    placeholder="Confirme sua senha"
                    value={form.confirmPassword}
                    onChange={(e) => setForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                    onKeyDown={(e) => e.key === 'Enter' && submit()}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                onClick={submit}
                disabled={isSubmitting || isLoading}
                className="w-full bg-red-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting || isLoading ? 'Criando conta...' : 'Criar conta'}
              </button>
            </div>
          </AnimatedContainer>

          {/* Logout Button for Authenticated Users */}
          {isAuthenticated && (
            <AnimatedContainer animationType="fadeInUp" delay={550}>
              <div className="text-center mt-4">
                <p className="text-gray-600 mb-2">
                  Você já está logado. Deseja fazer logout para criar uma nova conta?
                </p>
                <button
                  onClick={() => {
                    const { logout } = useAuthStore.getState();
                    logout();
                    alert('Logout realizado com sucesso!');
                  }}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Fazer Logout
                </button>
              </div>
            </AnimatedContainer>
          )}

          {/* Sign In Link */}
          <AnimatedContainer animationType="fadeInUp" delay={600}>
            <div className="text-center mt-6">
              <p className="text-gray-600">
                Já tem uma conta?{' '}
                <Link 
                  href={`/auth/sign-in?type=${userType}`} 
                  className="text-red-600 font-medium hover:text-red-700 hover:underline"
                >
                  Entrar
                </Link>
              </p>
            </div>
          </AnimatedContainer>
        </div>
      </div>
    </div>
  );
};

export default SignUp;