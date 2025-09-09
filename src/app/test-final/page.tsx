'use client';

import { useEffect, useState } from 'react';

/**
 * Página de teste final para verificar se o cabeçalho está sendo exibido
 * Esta página deve mostrar o GlobalHeader corrigido
 */
export default function TestFinalPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Conteúdo da página com espaçamento para o cabeçalho fixo */}
      <div className="pt-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">
              Teste Final do Cabeçalho
            </h1>
            
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h2 className="text-lg font-semibold text-green-800 mb-2">
                  ✅ Correções Aplicadas
                </h2>
                <ul className="text-green-700 space-y-1">
                  <li>• Layout alterado de RTL para LTR</li>
                  <li>• LanguageSelector temporariamente removido</li>
                  <li>• Textos de i18n substituídos por texto fixo</li>
                  <li>• GlobalHeader simplificado</li>
                </ul>
              </div>
              
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h2 className="text-lg font-semibold text-blue-800 mb-2">
                  🔍 O que verificar
                </h2>
                <ul className="text-blue-700 space-y-1">
                  <li>• O cabeçalho deve estar visível no topo da página</li>
                  <li>• Logo "ZipFood" deve estar alinhado à esquerda</li>
                  <li>• Botão "Entrar" deve estar à direita</li>
                  <li>• Cabeçalho deve ter fundo branco com sombra</li>
                </ul>
              </div>
              
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h2 className="text-lg font-semibold text-yellow-800 mb-2">
                  ⚠️ Problemas Identificados
                </h2>
                <ul className="text-yellow-700 space-y-1">
                  <li>• LanguageSelector estava alterando dir="rtl" dinamicamente</li>
                  <li>• CSS RTL estava invertendo o layout do flexbox</li>
                  <li>• Dependências de i18n causando conflitos</li>
                </ul>
              </div>
            </div>
            
            <div className="mt-8 p-6 bg-gray-100 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Status da Página</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Rota:</strong> /test-final
                </div>
                <div>
                  <strong>Cabeçalho:</strong> Deve estar visível
                </div>
                <div>
                  <strong>Layout:</strong> LTR (Left-to-Right)
                </div>
                <div>
                  <strong>Idioma:</strong> pt-BR
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}