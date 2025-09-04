'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { images } from '@/constants';
import useAuthStore from '@/store/auth.store';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const router = useRouter();
  const { login } = useAuthStore();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // Simulação de login - em produção, isso seria uma chamada de API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Exemplo de validação simples
      if (email === 'usuario@exemplo.com' && password === 'senha123') {
        const userData = { email, name: 'Usuário Teste' };
        const token = 'token-simulado-123';
        
        login(userData, token);
        router.push('/');
      } else {
        setError('Email ou senha inválidos');
      }
    } catch (err) {
      setError('Ocorreu um erro ao fazer login');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-white">
      <div className="w-full max-w-md bg-white border border-gray-200 rounded-xl p-8 shadow-lg">
        <div className="flex justify-center mb-8">
          <Image 
            src={images.logo} 
            alt="Logo" 
            width={120} 
            height={40} 
            className="dark:invert"
          />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-800 text-center mb-6">Login</h1>
        
        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded-lg mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-gray-800"
              placeholder="seu@email.com"
              required
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Senha
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-gray-800"
              placeholder="********"
              required
              onKeyDown={(e) => e.key === 'Enter' && handleLogin(e)}
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary-dark text-black font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-gray-400 text-sm">
            Não tem uma conta?{' '}
            <a href="/auth/register" className="text-primary hover:text-primary-dark">
              Registre-se
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}