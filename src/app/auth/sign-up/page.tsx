'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

import { FiLock, FiMail, FiUser, FiPhone } from 'react-icons/fi';
import { MdRestaurant, MdDeliveryDining, MdPerson } from 'react-icons/md';
import LottieAnimation from '@/components/LottieAnimation';

import { showAlert } from '@/lib/platform';
import { useAuthStore } from '@/store/auth.store';
import { UserType } from '@/types';
import AnimatedContainer from '@/components/AnimatedContainer';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { restaurantConfigService } from '@/services/restaurant-config.service';
import { AuthCacheCleaner } from '@/utils/auth-cache-cleaner';


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
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [userType, setUserType] = useState<UserType>('customer');
  
  const { signUp, isAuthenticated } = useAuthStore();
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

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setForm(prev => ({ ...prev, phone: formatted }));
  };

  const validatePhone = (phone: string) => {
    const numbers = phone.replace(/\D/g, '');
    return numbers.length === 11 && numbers.startsWith('1');
  };

  const submit = async () => {
    const { name, email, phone, password, confirmPassword } = form;

    if (!name || !email || !phone || !password || !confirmPassword) {
      return showAlert('Erro', 'Por favor, preencha todos os campos');
    }

    if (!validatePhone(phone)) {
      return showAlert('Erro', 'Número de telefone inválido. Use o formato (11) 98765-4321');
    }

    if (password !== confirmPassword) {
      return showAlert('Erro', 'As senhas não coincidem');
    }

    if (password.length < 6) {
      return showAlert('Erro', 'A senha deve ter pelo menos 6 caracteres');
    }

    setIsSubmitting(true);
    setIsLoading(true);

    try {
      // Chama a função signUp com os dados corretos
      const user = await signUp({
        name,
        email,
        password,
        phone,
        userType
      });
      
      // Mostrar mensagem de sucesso
      showAlert('Sucesso', 'Conta criada com sucesso!');
      
      // Importar userTypeService para determinar redirecionamento
      const { userTypeService } = await import('@/services/user-type.service');
      
      // Determinar rota de redirecionamento baseada no perfil do usuário
      let redirectRoute = '/customer'; // fallback padrão
      
      if (user && user.profile) {
        redirectRoute = userTypeService.getRedirectRoute(user.profile);
      } else {
        // Fallback baseado no tipo de usuário
        switch (userType) {
          case 'restaurant':
            redirectRoute = '/restaurant/register';
            break;
          case 'delivery':
            redirectRoute = '/delivery/pending';
            break;
          default:
            redirectRoute = '/customer';
            break;
        }
      }
      
      // Redirecionar para a rota apropriada
      setTimeout(() => {
        router.push(redirectRoute);
      }, 2000);
      
    } catch (error: any) {
      let errorMessage = 'Falha no cadastro';
      
      // Tratar erro específico de email já em uso
      if (error.message.includes('email já está em uso') || error.message.includes('email-already-in-use')) {
        console.log('🔍 Erro de email duplicado detectado, iniciando limpeza de cache...');
        
        // Limpar cache automaticamente
        try {
          await AuthCacheCleaner.clearAllAuthCache();
          
          errorMessage = 'Este email já possui uma conta ou há dados em cache. O cache foi limpo automaticamente. Tente novamente ou faça login se já possui uma conta.';
          
          // Oferecer opções ao usuário
          const userChoice = window.confirm(`${errorMessage}\n\nClique OK para tentar novamente com o mesmo email ou Cancelar para ir para a página de login.`);
          
          if (userChoice) {
            // Usuário quer tentar novamente - apenas mostrar mensagem
            showAlert('Cache Limpo', 'Cache limpo com sucesso! Tente criar a conta novamente.');
            return;
          } else {
            // Usuário quer ir para login
            router.push(`/auth/sign-in?type=${userType}&email=${encodeURIComponent(form.email)}`);
            return;
          }
        } catch (cacheError) {
          console.error('Erro ao limpar cache:', cacheError);
          
          // Fallback para o comportamento anterior se a limpeza de cache falhar
          errorMessage = 'Este email já possui uma conta. Deseja fazer login?';
          
          const goToLogin = window.confirm(`${errorMessage}\n\nClique OK para ir para a página de login ou Cancelar para tentar outro email.`);
          
          if (goToLogin) {
            router.push(`/auth/sign-in?type=${userType}&email=${encodeURIComponent(form.email)}`);
            return;
          }
          
          // Se não quiser ir para login, limpa o campo de email e mostra instruções
          setForm(prev => ({ ...prev, email: '' }));
          AuthCacheCleaner.showClearCacheInstructions();
          return;
        }
      }
      
      showAlert('Erro', error.message || errorMessage);
      console.error('Erro no cadastro:', error);
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

              {/* Phone Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Telefone *
                </label>
                <div className="relative">
                  <FiPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="tel"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-colors text-black"
                    placeholder="(11) 98765-4321"
                    value={form.phone}
                    onChange={handlePhoneChange}
                    maxLength={15}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Digite apenas números. Formato: (11) 98765-4321
                </p>
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