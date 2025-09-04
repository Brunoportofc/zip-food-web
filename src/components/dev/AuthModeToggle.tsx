'use client';

import { useState, useEffect } from 'react';
import { Switch } from '@headlessui/react';

/**
 * Toggle para alternar entre autenticação Firebase e simulada
 * Apenas visível em ambiente de desenvolvimento
 */
export default function AuthModeToggle() {
  const [isMockMode, setIsMockMode] = useState(true);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Só mostrar em desenvolvimento
    setIsVisible(process.env.NODE_ENV === 'development');
    
    // Verificar modo atual
    const currentMode = localStorage.getItem('auth-mode') || 'mock';
    setIsMockMode(currentMode === 'mock');
  }, []);

  const handleToggle = (enabled: boolean) => {
    setIsMockMode(enabled);
    localStorage.setItem('auth-mode', enabled ? 'mock' : 'firebase');
    
    // Recarregar página para aplicar mudanças
    window.location.reload();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-center space-x-3">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          🔧 Dev Mode
        </span>
        <div className="flex items-center space-x-2">
          <span className={`text-xs ${!isMockMode ? 'text-blue-600 font-semibold' : 'text-gray-500'}`}>
            Firebase
          </span>
          <Switch
            checked={isMockMode}
            onChange={handleToggle}
            className={`${
          isMockMode ? 'bg-red-400' : 'bg-gray-200'
        } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2`}
          >
            <span
              className={`${
                isMockMode ? 'translate-x-6' : 'translate-x-1'
              } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
            />
          </Switch>
          <span className={`text-xs ${isMockMode ? 'text-red-500 font-semibold' : 'text-gray-500'}`}>
            Mock
          </span>
        </div>
      </div>
      
      {isMockMode && (
        <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 bg-red-50 dark:bg-red-900/20 p-2 rounded">
          <div className="font-semibold text-red-600 dark:text-red-400">📧 Credenciais de Dev:</div>
          <div>Email: admin@gmail.com</div>
          <div>Senha: 12341234</div>
        </div>
      )}
    </div>
  );
}