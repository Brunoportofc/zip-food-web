'use client';

import { useEffect, useState } from 'react';
import GlobalHeader from '@/components/GlobalHeader';
import { useAuthData } from '@/store/auth.store';

export default function DebugHeaderPage() {
  const [mounted, setMounted] = useState(false);
  const { isAuthenticated, user } = useAuthData();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-lg">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Teste do GlobalHeader */}
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4 px-4 pt-4">Teste do GlobalHeader:</h2>
        <GlobalHeader />
      </div>

      {/* Conteúdo de debug */}
      <div className="pt-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Debug do Cabeçalho</h1>
          
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-xl font-semibold mb-4">Estado de Autenticação:</h2>
            <div className="space-y-2">
              <p><strong>Autenticado:</strong> {isAuthenticated ? 'Sim' : 'Não'}</p>
              <p><strong>Usuário:</strong> {user ? JSON.stringify(user, null, 2) : 'Nenhum'}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-xl font-semibold mb-4">Teste de Componentes:</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Botão de Teste:</h3>
                <button className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
                  Botão Funcional
                </button>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">Ícone de Teste:</h3>
                <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center">
                  <span className="text-white text-xl">🍕</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Informações da Página:</h2>
            <div className="space-y-2">
              <p><strong>URL:</strong> {typeof window !== 'undefined' ? window.location.href : 'N/A'}</p>
              <p><strong>User Agent:</strong> {typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A'}</p>
              <p><strong>Viewport:</strong> {typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}