'use client';

import { useAuthData } from '@/store/auth.store';
import { useTranslation } from 'react-i18next';

/**
 * Página de teste para verificar o funcionamento do cabeçalho global
 */
export default function TestHeaderPage() {
  const { t } = useTranslation();
  const { isAuthenticated, user } = useAuthData();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Teste do Cabeçalho Global
        </h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Status de Autenticação
          </h2>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="font-medium text-gray-700">Autenticado:</span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                isAuthenticated 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {isAuthenticated ? 'Sim' : 'Não'}
              </span>
            </div>
            
            {isAuthenticated && user && (
              <>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium text-gray-700">Nome:</span>
                  <span className="text-gray-900">{user.name}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium text-gray-700">Email:</span>
                  <span className="text-gray-900">{user.email}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium text-gray-700">Tipo:</span>
                  <span className="text-gray-900 capitalize">
                    {t(`common.user_types.${user.type}`, user.type)}
                  </span>
                </div>
              </>
            )}
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">
              Instruções de Teste:
            </h3>
            <ul className="text-blue-800 space-y-1 text-sm">
              <li>• Se não estiver logado, clique no botão "Entrar" no cabeçalho</li>
              <li>• Faça login com qualquer email/senha</li>
              <li>• Observe que o botão "Entrar" muda para "Sair"</li>
              <li>• Clique no botão "Sair" para fazer logout</li>
              <li>• Você será redirecionado para a página inicial</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}