'use client';

import { useRouter } from 'next/navigation';
import AnimatedContainer from '@/components/AnimatedContainer';
import GlobalHeader from '@/components/GlobalHeader';
import { MdDeliveryDining, MdRestaurant, MdPerson } from 'react-icons/md';

const HomeContent = () => {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-red-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-red-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-red-50 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      {/* Global Header */}
      <GlobalHeader showBackground={true} />

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 lg:pt-32 pb-16">
        {/* Hero Section */}
        <AnimatedContainer animationType="fadeInUp" delay={200}>
          <div className="text-center mb-16">
            <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6">
              Peça sua comida <span className="text-red-600">favorita</span>
              <br />de forma <span className="text-red-600">rápida e fácil</span>
            </h1>
            <p className="text-xl lg:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Conectamos você aos melhores restaurantes da sua região com entrega rápida e segura.
            </p>
            <button
              onClick={() => router.push('/auth/sign-in')}
              className="inline-flex items-center space-x-3 px-8 py-4 bg-red-600 text-white text-lg font-semibold rounded-2xl shadow-xl hover:bg-red-700 hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
            >
              <span>Começar Agora</span>
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
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Para Clientes</h3>
              <p className="text-gray-600 leading-relaxed">
                Descubra os melhores restaurantes da sua região e peça sua comida favorita com apenas alguns cliques.
              </p>
            </div>
          </AnimatedContainer>

          <AnimatedContainer animationType="fadeInUp" delay={500}>
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300">
              <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center mb-6">
                <MdRestaurant size={32} className="text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Para Restaurantes</h3>
              <p className="text-gray-600 leading-relaxed">
                Expanda seu negócio e alcance mais clientes com nossa plataforma de delivery completa.
              </p>
            </div>
          </AnimatedContainer>

          <AnimatedContainer animationType="fadeInUp" delay={600}>
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300">
              <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center mb-6">
                <MdDeliveryDining size={32} className="text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Para Entregadores</h3>
              <p className="text-gray-600 leading-relaxed">
                Ganhe dinheiro extra com flexibilidade de horários fazendo entregas na sua região.
              </p>
            </div>
          </AnimatedContainer>
        </div>
      </main>
    </div>
  );
};

const Home = () => {
  return <HomeContent />;
};

export default Home;
