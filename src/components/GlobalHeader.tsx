'use client';

import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { MdLogin, MdLogout, MdDeliveryDining } from 'react-icons/md';
import { useAuthData, useAuthActions } from '@/store/auth.store';
import LanguageSelector from '@/components/LanguageSelector';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface GlobalHeaderProps {
  className?: string;
  showBackground?: boolean;
}

/**
 * Componente de cabeçalho global que aparece em todas as páginas
 * Gerencia o estado de autenticação e navegação
 */
const GlobalHeader = ({ className, showBackground = true }: GlobalHeaderProps) => {
  const router = useRouter();
  const { t } = useTranslation();
  const { isAuthenticated, user } = useAuthData();
  const { logout } = useAuthActions();

  const handleLoginClick = () => {
    router.push('/auth/sign-in');
  };

  const handleLogoutClick = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const handleLogoClick = () => {
    if (isAuthenticated && user) {
      // Redireciona para o dashboard específico do tipo de usuário
      switch (user.type) {
        case 'customer':
          router.push('/customer');
          break;
        case 'restaurant':
          router.push('/restaurant');
          break;
        case 'delivery':
          router.push('/delivery');
          break;
        default:
          router.push('/');
      }
    } else {
      router.push('/');
    }
  };

  return (
    <header 
      className={cn(
        'fixed top-0 left-0 right-0 z-50 border-b border-gray-200 shadow-lg',
        showBackground ? 'backdrop-blur-md bg-white/95' : 'bg-white',
        className
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-3 lg:py-4">
          {/* Logo */}
          <button 
            onClick={handleLogoClick}
            className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
          >
            <div className="w-10 h-10 lg:w-12 lg:h-12 bg-red-600 rounded-xl flex items-center justify-center">
              <MdDeliveryDining size={24} className="text-white lg:hidden" />
              <MdDeliveryDining size={28} className="text-white hidden lg:block" />
            </div>
            <div>
              <h1 className="text-xl lg:text-2xl font-bold text-red-600">
                ZipFood
              </h1>
              <p className="text-xs lg:text-sm text-gray-600 hidden sm:block">
                Delivery rápido e saboroso
              </p>
            </div>
          </button>

          {/* User Info and Actions */}
          <div className="flex items-center space-x-4">
            {/* Seletor de idioma */}
            <LanguageSelector />
            
            {/* User Info (quando autenticado) */}
            {isAuthenticated && user && (
              <div className="hidden md:flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {user.name}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">
                    {user.type}
                  </p>
                </div>
                {user.profileImage && (
                  <img 
                    src={user.profileImage} 
                    alt={user.name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                )}
              </div>
            )}
            
            {/* Login/Logout Button */}
            {isAuthenticated ? (
              <Button
                onClick={handleLogoutClick}
                variant="outline"
                size="sm"
                className="flex items-center space-x-2 text-red-600 border-red-600 hover:bg-red-50"
              >
                <MdLogout size={18} />
                <span className="hidden sm:inline">
                  Sair
                </span>
              </Button>
            ) : (
              <Button
                onClick={handleLoginClick}
                variant="primary"
                size="sm"
                className="flex items-center space-x-2"
              >
                <MdLogin size={18} />
                <span className="hidden sm:inline">
                  Entrar
                </span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default GlobalHeader;