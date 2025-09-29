'use client';

import React, { useState, useEffect } from 'react';

const SimplePayoutDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [bankInfo, setBankInfo] = useState(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Simular carregamento
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          💰 Sistema de Repasses
        </h1>
        <p className="text-gray-600">
          Novo sistema de pagamentos sem Stripe Connect - Configurado para Israel
        </p>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <span className="text-2xl">💰</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Ganhos Totais</p>
              <p className="text-2xl font-bold text-gray-900">₪0.00</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <span className="text-2xl">⏳</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pendentes</p>
              <p className="text-2xl font-bold text-gray-900">₪0.00</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <span className="text-2xl">✅</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Sistema</p>
              <p className="text-2xl font-bold text-green-600">Ativo</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <span className="text-2xl">🏦</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Repasses</p>
              <p className="text-2xl font-bold text-gray-900">Semanais</p>
            </div>
          </div>
        </div>
      </div>

      {/* Informações do Sistema */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">ℹ️ Como Funciona</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-gray-900 mb-2">💳 Pagamentos</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Todos os pagamentos vão para a conta principal</li>
              <li>• Moeda: Israeli Shekel (ILS)</li>
              <li>• Compatível com Israel</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 mb-2">📊 Repasses</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• 95% para o restaurante</li>
              <li>• 5% taxa da plataforma</li>
              <li>• Repasses automáticos semanais</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Formulário de Informações Bancárias */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">🏦 Configurar Informações Bancárias</h2>
        <p className="text-gray-600 mb-6">
          Configure suas informações bancárias para receber os repasses automaticamente.
        </p>

        <form className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome do Banco
              </label>
              <input
                type="text"
                placeholder="Ex: Bank Hapoalim"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome do Titular
              </label>
              <input
                type="text"
                placeholder="Nome completo"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número da Conta
              </label>
              <input
                type="text"
                placeholder="123456789"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Código do Banco (3 dígitos)
              </label>
              <input
                type="text"
                placeholder="012"
                maxLength={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div className="pt-4">
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Salvar Informações Bancárias
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SimplePayoutDashboard;
