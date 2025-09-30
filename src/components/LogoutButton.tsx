'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { FaSignOutAlt, FaSpinner } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

interface LogoutButtonProps {
  className?: string;
}

/**
 * Componente de botão de logout que permite ao usuário sair da aplicação
 */
const LogoutButton = ({ className = '' }: LogoutButtonProps) => {
  const router = useRouter();
  const { signOut } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    // Confirmação antes de sair
    const confirmed = window.confirm('Tem certeza que deseja sair?');
    if (!confirmed) return;

    setLoading(true);
    try {
      console.log('🚪 [Logout] Iniciando processo de logout...');
      
      // Toast de feedback
      toast.loading('Saindo...', { id: 'logout' });
      
      await signOut();
      
      // Sucesso
      toast.success('Logout realizado com sucesso!', { id: 'logout' });
      
      // Aguardar um pouco antes do redirecionamento para garantir que o toast seja visto
      setTimeout(() => {
        console.log('🔄 [Logout] Redirecionando para página de login...');
        
        // Usar replace para garantir que o usuário não volte com o botão voltar
        router.replace('/auth/sign-in');
        
        // Fallback: se router.replace falhar, usar window.location
        setTimeout(() => {
          if (window.location.pathname !== '/auth/sign-in') {
            console.log('🔄 [Logout] Fallback: usando window.location...');
            window.location.href = '/auth/sign-in';
          }
        }, 1000);
      }, 800);
      
    } catch (error) {
      console.error('❌ [Logout] Erro ao fazer logout:', error);
      toast.error('Erro ao fazer logout. Tente novamente.', { id: 'logout' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className={`w-full flex items-center justify-center gap-3 p-3 text-green-400 hover:bg-green-900 rounded-lg transition-all duration-200 font-medium border border-green-500 hover:border-green-400 ${
        loading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'
      } ${className}`}
    >
      {loading ? (
        <>
          <FaSpinner className="animate-spin" size={16} />
          <span>Saindo...</span>
        </>
      ) : (
        <>
          <FaSignOutAlt size={16} />
          <span>Sair</span>
        </>
      )}
    </button>
  );
};

export default LogoutButton;