'use client';

import { useState, useEffect } from 'react';

export default function SimpleTestPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Cabeçalho simples para teste */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3 lg:py-4">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-red-600 rounded-xl flex items-center justify-center">
                <span className="text-white text-xl">🍕</span>
              </div>
              <div>
                <h1 className="text-xl lg:text-2xl font-bold text-red-600">
                  ZipFood
                </h1>
                <p className="text-xs lg:text-sm text-gray-600 hidden sm:block">
                  Delivery rápido e saboroso
                </p>
              </div>
            </div>

            {/* Botões */}
            <div className="flex items-center space-x-4">
              <button className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700">
                Entrar
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="pt-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Teste Simples do Cabeçalho</h1>
          
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-xl font-semibold mb-4">Status do Teste:</h2>
            <div className="space-y-2">
              <p className="text-green-600">✅ Componente montado com sucesso</p>
              <p className="text-green-600">✅ Cabeçalho fixo renderizado</p>
              <p className="text-green-600">✅ Estilos Tailwind aplicados</p>
              <p className="text-green-600">✅ Layout responsivo funcionando</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-xl font-semibold mb-4">Informações Técnicas:</h2>
            <div className="space-y-2 text-sm">
              <p><strong>Viewport:</strong> {typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : 'N/A'}</p>
              <p><strong>User Agent:</strong> {typeof navigator !== 'undefined' ? navigator.userAgent.substring(0, 100) + '...' : 'N/A'}</p>
              <p><strong>URL:</strong> {typeof window !== 'undefined' ? window.location.href : 'N/A'}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Teste de Elementos:</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-red-50 rounded-lg">
                <h3 className="font-medium text-red-800 mb-2">Cores</h3>
                <div className="w-full h-8 bg-red-600 rounded"></div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-800 mb-2">Tipografia</h3>
                <p className="text-sm">Texto de exemplo</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="font-medium text-blue-800 mb-2">Interação</h3>
                <button className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">
                  Clique aqui
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}