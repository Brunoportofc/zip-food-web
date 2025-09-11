'use client';

import React from 'react';
import { FaCheckCircle, FaClock, FaEnvelope, FaArrowRight } from 'react-icons/fa';

interface WelcomeMessageProps {
  restaurantName: string;
  onContinue: () => void;
}

const WelcomeMessage: React.FC<WelcomeMessageProps> = ({ restaurantName, onContinue }) => {
  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-lg p-8 text-center">
        {/* Success Icon */}
        <div className="mb-6">
          <div className="bg-green-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
            <FaCheckCircle className="text-green-600 text-4xl" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Cadastro Realizado com Sucesso!</h2>
          <p className="text-lg text-gray-600">
            Bem-vindo ao ZipFood, <span className="font-semibold text-red-600">{restaurantName}</span>!
          </p>
        </div>

        {/* Welcome Message */}
        <div className="bg-gray-50 rounded-lg p-6 mb-8">
          <p className="text-gray-700 mb-4">
            Seu restaurante foi cadastrado com sucesso em nossa plataforma. 
            Agora você faz parte da maior rede de delivery da região!
          </p>
          <p className="text-gray-700">
            Em breve você poderá começar a receber pedidos e aumentar suas vendas.
          </p>
        </div>

        {/* Next Steps */}
        <div className="text-left mb-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-4 text-center">Próximos Passos:</h3>
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="bg-blue-100 rounded-full p-2 mr-4 mt-1">
                <FaClock className="text-blue-600 text-sm" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-800">Análise e Aprovação</h4>
                <p className="text-gray-600 text-sm">
                  Nossa equipe irá analisar suas informações em até 24-48 horas.
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="bg-yellow-100 rounded-full p-2 mr-4 mt-1">
                <FaEnvelope className="text-yellow-600 text-sm" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-800">Confirmação por E-mail</h4>
                <p className="text-gray-600 text-sm">
                  Você receberá um e-mail de confirmação assim que a aprovação for concluída.
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="bg-green-100 rounded-full p-2 mr-4 mt-1">
                <FaCheckCircle className="text-green-600 text-sm" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-800">Comece a Vender</h4>
                <p className="text-gray-600 text-sm">
                  Após a aprovação, você poderá acessar seu painel e começar a receber pedidos.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Support Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
          <p className="text-blue-800 text-sm">
            <strong>Precisa de ajuda?</strong> Nossa equipe de suporte está disponível 24/7 para auxiliá-lo.
            Entre em contato através do painel do restaurante ou pelo e-mail: suporte@zipfood.com
          </p>
        </div>

        {/* Continue Button */}
        <button
          onClick={onContinue}
          className="bg-red-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors flex items-center mx-auto"
        >
          Ir para o Painel do Restaurante
          <FaArrowRight className="ml-3" />
        </button>
      </div>
    </div>
  );
};

export default WelcomeMessage;