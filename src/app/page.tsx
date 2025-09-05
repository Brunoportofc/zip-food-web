'use client';

import { useRouter } from 'next/navigation';
import AnimatedContainer from '@/components/AnimatedContainer';
import LanguageSelector from '@/components/LanguageSelector';
import I18nClientProvider from '@/components/I18nClientProvider';
import { useTranslation } from 'react-i18next';
import { MdLogin, MdDeliveryDining, MdRestaurant, MdPerson } from 'react-icons/md';
import '@/i18n';

const HomeContent = () => {
  const router = useRouter();
  const { t } = useTranslation();

  const handleLoginClick = () => {
    router.push('/auth/sign-in');
  };

  return (
    <div className="min-h-screen bg-gray-50 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-red-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-red-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-red-50 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      {/* Glass Header */}
      <AnimatedContainer animationType="fadeInDown" delay={0}>
        <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-white/80 border-b border-gray-200 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4 lg:py-6">
              {/* Logo */}
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 lg:w-12 lg:h-12 bg-red-600 rounded-xl flex items-center justify-center">
                  <MdDeliveryDining size={24} className="text-white lg:hidden" />
                  <MdDeliveryDining size={28} className="text-white hidden lg:block" />
                </div>
                <div>
                  <h1 className="text-xl lg:text-2xl font-bold text-red-600">
                    ZipFood
                  </h1>
                  <p className="text-xs lg:text-sm text-gray-600 hidden sm:block">{t('home.tagline')}</p>
                </div>
              </div>

              {/* Language Selector and Login Button */}
              <div className="flex items-center space-x-4">
                <LanguageSelector />
                <button
                  onClick={handleLoginClick}
                  className="flex items-center space-x-2 px-6 py-3 bg-red-600 text-white rounded-xl font-semibold shadow-lg hover:bg-red-700 hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                >
                  <MdLogin size={20} />
                  <span>{t('home.login')}</span>
                </button>
              </div>
            </div>
          </div>
        </header>
      </AnimatedContainer>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 lg:pt-40 pb-16">
        {/* Hero Section */}
        <AnimatedContainer animationType="fadeInUp" delay={200}>
          <div className="text-center mb-16">
            <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6">
              {t('home.hero_title_part1')} <span className="text-red-600">{t('home.hero_title_part2')}</span>
              <br />{t('home.hero_title_part3')} <span className="text-red-600">{t('home.hero_title_part4')}</span>
            </h1>
            <p className="text-xl lg:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
              {t('home.hero_subtitle')}
            </p>
            <button
              onClick={handleLoginClick}
              className="inline-flex items-center space-x-3 px-8 py-4 bg-red-600 text-white text-lg font-semibold rounded-2xl shadow-xl hover:bg-red-700 hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
            >
              <MdLogin size={24} />
              <span>{t('home.start_now')}</span>
            </button>
          </div>
        </AnimatedContainer>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          <AnimatedContainer animationType="fadeInUp" delay={400}>
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300">
              <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center mb-6">
                <MdPerson size={32} className="text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">{t('home.for_customers')}</h3>
              <p className="text-gray-600 leading-relaxed">
                {t('home.customers_description')}
              </p>
            </div>
          </AnimatedContainer>

          <AnimatedContainer animationType="fadeInUp" delay={500}>
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300">
              <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center mb-6">
                <MdRestaurant size={32} className="text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">{t('home.for_restaurants')}</h3>
              <p className="text-gray-600 leading-relaxed">
                {t('home.restaurants_description')}
              </p>
            </div>
          </AnimatedContainer>

          <AnimatedContainer animationType="fadeInUp" delay={600}>
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300">
              <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center mb-6">
                <MdDeliveryDining size={32} className="text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">{t('home.for_delivery')}</h3>
              <p className="text-gray-600 leading-relaxed">
                {t('home.delivery_description')}
              </p>
            </div>
          </AnimatedContainer>
        </div>
      </main>
    </div>
  );
};

const Home = () => {
  return (
    <I18nClientProvider>
      <HomeContent />
    </I18nClientProvider>
  );
};

export default Home;
