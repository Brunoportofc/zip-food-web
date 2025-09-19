// src/components/GlobalHeader.tsx
'use client';

import { useRouter } from 'next/navigation';
import { MdLogin, MdLogout, MdDeliveryDining } from 'react-icons/md';
// CORREÇÃO: Importa apenas o hook unificado
import { useAuthStore } from '@/store/auth.store';

import Button from '@/components/ui/Button';
import { cn } from '@/lib/utils';

const GlobalHeader = () => {
  const router = useRouter();
  
  // CORREÇÃO: Pega o estado e a ação de signOut do mesmo hook
  const { isAuthenticated, user, signOut } = useAuthStore();

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const handleSignIn = () => {
    router.push('/auth/sign-in');
  };

  const handleDashboardRedirect = () => {
    if (user?.user_type === 'restaurant') {
      router.push('/restaurant/dashboard');
    } else if (user?.user_type === 'delivery') {
      router.push('/delivery');
    } else {
      router.push('/customer');
    }
  };

  return (
    <header className="bg-white shadow-md p-4 flex justify-between items-center">
      <div className="text-xl font-bold cursor-pointer" onClick={() => router.push('/')}>
        ZipFood
      </div>
      <nav className="flex items-center space-x-4">
        {isAuthenticated ? (
          <>
            <span className="font-semibold hidden sm:block">Olá, {user?.name}</span>
            <Button variant="ghost" onClick={handleDashboardRedirect}>
              Meu Painel
            </Button>
            <Button variant="primary" onClick={handleSignOut} className="flex items-center space-x-2">
              <MdLogout />
              <span>Sair</span>
            </Button>
          </>
        ) : (
          <Button variant="primary" onClick={handleSignIn} className="flex items-center space-x-2">
            <MdLogin />
            <span>Entrar</span>
          </Button>
        )}
      </nav>
    </header>
  );
};

export default GlobalHeader;