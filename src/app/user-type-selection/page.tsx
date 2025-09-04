'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MdRestaurant, MdDeliveryDining, MdPerson } from 'react-icons/md';
import AnimatedContainer from '@/components/AnimatedContainer';
import LottieAnimation from '@/components/LottieAnimation';
import CustomButton from '@/components/CustomButton';
import useAuthStore, { UserType } from '@/store/auth.store';
import { useTranslation } from 'react-i18next';
import '@/i18n';

const UserTypeSelection = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const { setUserType, isAuthenticated } = useAuthStore();
  const [selectedType, setSelectedType] = useState<UserType | null>(null);

  const handleTypeSelection = (type: UserType) => {
    setSelectedType(type);
  };

  const handleContinue = () => {
    if (!selectedType) return;
    
    setUserType(selectedType);
    
    if (isAuthenticated) {
      // Se já estiver autenticado, redireciona para a área específica
      switch (selectedType) {
        case 'customer':
          router.push('/customer');
          break;
        case 'restaurant':
          router.push('/restaurant');
          break;
        case 'delivery':
          router.push('/delivery');
          break;
      }
    } else {
      // Se não estiver autenticado, redireciona para login com o tipo selecionado
      router.push(`/auth/sign-in?type=${selectedType}`);
    }
  };

  const userTypes = [
    {
      id: 'customer',
      title: t('userType.customer'),
      description: t('userType.customerDesc'),
      icon: <LottieAnimation userType="customer" width={64} height={64} />,
      type: 'customer' as UserType,
    },
    {
      id: 'restaurant',
      title: t('userType.restaurant'),
      description: t('userType.restaurantDesc'),
      icon: <LottieAnimation userType="restaurant" width={64} height={64} />,
      type: 'restaurant' as UserType,
    },
    {
      id: 'delivery',
      title: t('userType.delivery'),
      description: t('userType.deliveryDesc'),
      icon: <LottieAnimation userType="delivery" width={64} height={64} />,
      type: 'delivery' as UserType,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
      <AnimatedContainer animation="fadeIn" className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">{t('userType.selectTitle')}</h1>
          <p className="text-gray-600">{t('userType.selectSubtitle')}</p>
        </div>

        <div className="space-y-4">
          {userTypes.map((userType) => (
            <div
              key={userType.id}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${selectedType === userType.type
                ? 'border-primary bg-primary bg-opacity-10'
                : 'border-gray-200 hover:border-primary hover:bg-gray-50'
                }`}
              onClick={() => handleTypeSelection(userType.type)}
            >
              <div className="flex items-center">
                <div className="mr-4">{userType.icon}</div>
                <div>
                  <h3 className="font-semibold text-lg">{userType.title}</h3>
                  <p className="text-gray-600 text-sm">{userType.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8">
          <CustomButton
            title={t('common.continue')}
            onPress={handleContinue}
            disabled={!selectedType}
            style={{
              opacity: !selectedType ? 0.7 : 1,
            }}
          />
        </div>
      </AnimatedContainer>
    </div>
  );
};

export default UserTypeSelection;