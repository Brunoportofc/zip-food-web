'use client';

import React, { useState, useEffect } from 'react';
import { MdToggleOn, MdToggleOff } from 'react-icons/md';

/**
 * Componente de informação sobre autenticação Mock
 * Apenas para desenvolvimento
 */
const AuthModeToggle: React.FC = () => {

  useEffect(() => {
    // Garantir que o modo Mock esteja definido
    localStorage.setItem('auth-mode', 'mock');
  }, []);

  // Só mostrar em desenvolvimento
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div
        className="flex items-center space-x-2 px-4 py-2 rounded-lg shadow-lg bg-gray-600 text-white"
        title="Modo de autenticação: Mock"
      >
        <MdToggleOff size={20} />
        <span className="text-sm font-medium">
          Mock Auth
        </span>
      </div>
      
      {/* Tooltip informativo */}
      <div className="absolute bottom-full right-0 mb-2 w-64 p-2 bg-black text-white text-xs rounded opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <p className="mb-1">
          <strong>Credenciais de teste:</strong>
        </p>
        <p>
          admin@gmail.com / 12341234
        </p>
      </div>
    </div>
  );
};

export default AuthModeToggle;