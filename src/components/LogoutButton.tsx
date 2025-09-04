'use client';

import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import useAuthStore from '@/store/auth.store';

interface LogoutButtonProps {
  className?: string;
}

/**
 * Componente de botão de logout que permite ao usuário sair da aplicação
 */
const LogoutButton = ({ className = '' }: LogoutButtonProps) => {
  const { t } = useTranslation();
  const router = useRouter();
  const { logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    router.push('/auth/sign-in');
  };

  return (
    <button
      onClick={handleLogout}
      className={`flex items-center p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors ${className}`}
    >
      <span className="mr-2">🚪</span>
      <span>{t('logout')}</span>
    </button>
  );
};

export default LogoutButton;