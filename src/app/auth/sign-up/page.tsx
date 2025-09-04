'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { FiLock, FiMail, FiUser } from 'react-icons/fi';
import { MdRestaurant, MdDeliveryDining, MdPerson } from 'react-icons/md';
import LottieAnimation from '@/components/LottieAnimation';

import { showAlert } from '@/lib/platform';
import useAuthStore, { UserType } from '@/store/auth.store';
import AnimatedContainer from '@/components/AnimatedContainer';
import CustomInput from '@/components/CustomInput';
import CustomButton from '@/components/CustomButton';
import I18nClientProvider from '@/components/I18nClientProvider';

const SignUp = () => {
  return (
    <I18nClientProvider>
      <SignUpContent />
    </I18nClientProvider>
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
  
  const { t } = useTranslation();

  useEffect(() => {
    if (type && (type === 'customer' || type === 'restaurant' || type === 'delivery')) {
      setUserType(type as UserType);
    }
  }, [type]);

  // Verificar se o usuário já está autenticado
  useEffect(() => {
    if (isAuthenticated) {
      const { userType } = useAuthStore.getState();
      switch (userType) {
        case 'restaurant':
          router.push('/restaurant');
          break;
        case 'delivery':
          router.push('/delivery');
          break;
        default:
          router.push('/customer');
          break;
      }
    }
  }, [isAuthenticated, router]);

  const submit = async () => {
    const { name, email, password, confirmPassword } = form;

    if (!name || !email || !password || !confirmPassword) {
      return showAlert(t('auth.common.error_title'), t('auth.signup.alerts.fill_all_fields'));
    }

    if (password !== confirmPassword) {
      return showAlert(t('auth.common.error_title'), t('auth.signup.alerts.passwords_not_match'));
    }

    setIsSubmitting(true);
    setIsLoading(true);

    try {
      // Salva o tipo de usuário no store antes de fazer cadastro
      storeSetUserType(userType);
      await signUp(name, email, password);
      
      // Redirecionamentos baseados no tipo de usuário
      switch (userType) {
        case 'restaurant':
          router.push('/restaurant');
          break;
        case 'delivery':
          router.push('/delivery');
          break;
        default:
          router.push('/customer');
          break;
      }
    } catch (error: any) {
      showAlert(t('auth.common.error_title'), error.message || t('auth.signup.alerts.failed_sign_up'));
      console.error(error);
    } finally {
      setIsSubmitting(false);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 bg-white min-h-screen flex justify-center items-center">
      <div className="w-full max-w-md p-4 md:p-8 space-y-8">
        {/* Header Section */}
        <AnimatedContainer animationType="fadeInDown" delay={200}>
          <div className="flex flex-col items-center space-y-4">
            <div className="flex justify-center mb-6">
              <LottieAnimation userType={userType} width={80} height={80} />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-primary">
              {t('auth.signup.title')}
            </h1>
            <p className="text-lg md:text-xl font-medium text-gray-700 text-center">
              {t('auth.signup.subtitle')}
            </p>
          </div>
        </AnimatedContainer>

        {/* User Type Selection */}
        <AnimatedContainer animationType="fadeInUp" delay={300}>
          <div className="bg-zinc-900 rounded-3xl p-6 md:p-8 shadow-xl border-2 border-primary space-y-6">
            <div className="flex flex-row items-center mb-4">
              <h2 className="text-xl md:text-2xl font-semibold text-primary">
                {t('userType.selectTitle')}
              </h2>
            </div>
            
            <div className="flex justify-between gap-2">
              <button
                onClick={() => setUserType('customer')}
                className={`flex-1 p-3 rounded-xl flex flex-col items-center justify-center transition-all ${userType === 'customer' ? 'bg-primary text-black' : 'bg-zinc-800 text-white hover:bg-zinc-700'}`}
              >
                <LottieAnimation userType="customer" width={28} height={28} />
                <span className="mt-2 font-medium">{t('userType.customer')}</span>
              </button>
              
              <button
                onClick={() => setUserType('restaurant')}
                className={`flex-1 p-3 rounded-xl flex flex-col items-center justify-center transition-all ${userType === 'restaurant' ? 'bg-primary text-black' : 'bg-zinc-800 text-white hover:bg-zinc-700'}`}
              >
                <LottieAnimation userType="restaurant" width={28} height={28} />
                <span className="mt-2 font-medium">{t('userType.restaurant')}</span>
              </button>
              
              <button
                onClick={() => setUserType('delivery')}
                className={`flex-1 p-3 rounded-xl flex flex-col items-center justify-center transition-all ${userType === 'delivery' ? 'bg-primary text-black' : 'bg-zinc-800 text-white hover:bg-zinc-700'}`}
              >
                <LottieAnimation userType="delivery" width={28} height={28} />
                <span className="mt-2 font-medium">{t('userType.delivery')}</span>
              </button>
            </div>
          </div>
        </AnimatedContainer>

        {/* Signup Card */}
        <AnimatedContainer animationType="fadeInUp" delay={400}>
          <div className="bg-primary rounded-3xl p-6 md:p-8 shadow-xl border-2 border-black space-y-6">
            {/* Name Input */}
            <div>
              <label className="block text-base md:text-lg font-medium text-black mb-2">
                Nome
              </label>
              <div className="flex flex-row items-center bg-white rounded-2xl px-4 py-4 border-2 border-black">
                <FiUser size={20} color="#000000" />
                <input
                  className="flex-1 ml-3 text-base md:text-lg font-medium text-black bg-transparent outline-none"
                  placeholder="Digite seu nome"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  type="text"
                />
              </div>
            </div>

            {/* Email Input */}
            <div>
              <label className="block text-base md:text-lg font-medium text-black mb-2">
                {t('auth.fields.email_label')}
              </label>
              <div className="flex flex-row items-center bg-white rounded-2xl px-4 py-4 border-2 border-black">
                <FiMail size={20} color="#000000" />
                <input
                  className="flex-1 ml-3 text-base md:text-lg font-medium text-black bg-transparent outline-none"
                  placeholder={t('auth.fields.email_placeholder')}
                  value={form.email}
                  onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                  type="email"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-base md:text-lg font-medium text-black mb-2">
                {t('auth.fields.password_label')}
              </label>
              <div className="flex flex-row items-center bg-white rounded-2xl px-4 py-4 border-2 border-black">
                <FiLock size={20} color="#000000" />
                <input
                  className="flex-1 ml-3 text-base md:text-lg font-medium text-black bg-transparent outline-none"
                  placeholder={t('auth.fields.password_placeholder')}
                  value={form.password}
                  onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                  type="password"
                />
              </div>
            </div>

            {/* Confirm Password Input */}
            <div>
              <label className="block text-base md:text-lg font-medium text-black mb-2">
                Confirmar Senha
              </label>
              <div className="flex flex-row items-center bg-white rounded-2xl px-4 py-4 border-2 border-black">
                <FiLock size={20} color="#000000" />
                <input
                  className="flex-1 ml-3 text-base md:text-lg font-medium text-black bg-transparent outline-none"
                  placeholder="Confirme sua senha"
                  value={form.confirmPassword}
                  onChange={(e) => setForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                  type="password"
                  onKeyDown={(e) => e.key === 'Enter' && submit()}
                />
              </div>
            </div>

            <div>
              <CustomButton
                title={t('auth.signup.button.sign_up')}
                isLoading={isSubmitting || isLoading}
                onPress={submit}
                variant="black"
              />
            </div>
          </div>
        </AnimatedContainer>

        {/* Sign In Link */}
        <AnimatedContainer animationType="fadeInUp" delay={600}>
          <div className="flex justify-center items-center">
            <p className="text-base md:text-lg font-medium text-gray-700">
              {t('auth.signup.footer.has_account')}{' '}
              <Link 
                href={`/auth/sign-in?type=${userType}`} 
                className="text-primary font-semibold hover:underline"
              >
                {t('auth.signup.footer.sign_in')}
              </Link>
            </p>
          </div>
        </AnimatedContainer>
        
        {/* Back to Selection */}
        <AnimatedContainer animationType="fadeInUp" delay={700}>
          <div className="flex justify-center items-center">
            <Link 
              href="/user-type-selection" 
              className="text-gray-500 text-sm hover:text-primary transition-colors"
            >
              {t('common.back_to_selection')}
            </Link>
          </div>
        </AnimatedContainer>
      </div>
    </div>
  );
};

export default SignUp;