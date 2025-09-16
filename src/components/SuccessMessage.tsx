'use client';

import React from 'react';
import { FaCheckCircle, FaTimes } from 'react-icons/fa';

interface SuccessMessageProps {
  title: string;
  message: string;
  isVisible: boolean;
  onClose: () => void;
  autoClose?: boolean;
  duration?: number;
}

const SuccessMessage: React.FC<SuccessMessageProps> = ({
  title,
  message,
  isVisible,
  onClose,
  autoClose = true,
  duration = 5000
}) => {
  React.useEffect(() => {
    if (isVisible && autoClose) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, autoClose, duration, onClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6 relative animate-fade-in">
        {/* Botão de fechar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Fechar mensagem"
        >
          <FaTimes size={20} />
        </button>

        {/* Ícone de sucesso */}
        <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full">
          <FaCheckCircle className="text-green-500 text-3xl" />
        </div>

        {/* Título */}
        <h3 className="text-xl font-semibold text-gray-900 text-center mb-2">
          {title}
        </h3>

        {/* Mensagem */}
        <p className="text-gray-600 text-center mb-6">
          {message}
        </p>

        {/* Barra de progresso (se autoClose estiver ativo) */}
        {autoClose && (
          <div className="w-full bg-gray-200 rounded-full h-1 mb-4">
            <div 
              className="bg-green-500 h-1 rounded-full animate-progress"
              style={{
                animation: `progress ${duration}ms linear forwards`
              }}
            />
          </div>
        )}

        {/* Botão de ação */}
        <button
          onClick={onClose}
          className="w-full bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition-colors font-medium"
        >
          Entendi
        </button>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes progress {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }

        .animate-progress {
          animation: progress var(--duration) linear forwards;
        }
      `}</style>
    </div>
  );
};

export default SuccessMessage;