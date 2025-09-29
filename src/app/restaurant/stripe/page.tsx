'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface StripeAccountStatus {
  hasAccount: boolean;
  accountId?: string;
  status?: {
    charges_enabled: boolean;
    payouts_enabled: boolean;
    details_submitted: boolean;
    requirements?: {
      currently_due: string[];
      eventually_due: string[];
      past_due: string[];
    };
  };
}

export default function StripeConnectPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [accountStatus, setAccountStatus] = useState<StripeAccountStatus | null>(null);

  useEffect(() => {
    if (user?.uid) {
      checkStripeAccount();
    }
  }, [user]);

  const checkStripeAccount = async () => {
    try {
      const response = await fetch(`/api/stripe/connect/create-account?restaurantId=${user?.uid}`);
      const data = await response.json();

      if (response.ok) {
        setAccountStatus(data.data);
      } else {
        console.error('Error checking Stripe account:', data.message);
      }
    } catch (error) {
      console.error('Error checking Stripe account:', error);
    } finally {
      setLoading(false);
    }
  };

  const createStripeAccount = async () => {
    if (!user?.email) {
      toast.error('Email do usuário não encontrado');
      return;
    }

    setCreating(true);
    try {
      const response = await fetch('/api/stripe/connect/create-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          restaurantId: user.uid,
          email: user.email,
          businessName: 'Meu Restaurante', // This should come from restaurant data
          country: 'BR',
          type: 'express',
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Redirect to Stripe onboarding
        window.location.href = data.data.onboardingUrl;
      } else {
        toast.error(data.message || 'Erro ao criar conta Stripe');
      }
    } catch (error) {
      console.error('Error creating Stripe account:', error);
      toast.error('Erro ao criar conta Stripe');
    } finally {
      setCreating(false);
    }
  };

  const createNewAccountLink = async () => {
    setCreating(true);
    try {
      const response = await fetch('/api/stripe/connect/account-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          restaurantId: user?.uid,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Redirect to Stripe onboarding
        window.location.href = data.data.onboardingUrl;
      } else {
        toast.error(data.message || 'Erro ao criar link de configuração');
      }
    } catch (error) {
      console.error('Error creating account link:', error);
      toast.error('Erro ao criar link de configuração');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando configuração do Stripe...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Configuração de Pagamentos
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Configure sua conta Stripe Connect para receber pagamentos dos clientes diretamente em sua conta bancária.
            </p>
          </div>

          {!accountStatus?.hasAccount ? (
            // No Stripe account
            <div className="text-center">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
                <div className="text-blue-600 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-blue-900 mb-2">
                  Conta de Pagamentos Não Configurada
                </h3>
                <p className="text-blue-700 mb-6">
                  Para receber pagamentos dos clientes, você precisa configurar uma conta Stripe Connect.
                </p>
                <button
                  onClick={createStripeAccount}
                  disabled={creating}
                  className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? 'Criando conta...' : 'Configurar Pagamentos'}
                </button>
              </div>

              <div className="grid md:grid-cols-3 gap-6 text-left">
                <div className="bg-gray-50 p-6 rounded-lg">
                  <div className="text-green-600 mb-3">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">Seguro e Confiável</h4>
                  <p className="text-gray-600 text-sm">
                    Stripe é uma das plataformas de pagamento mais seguras do mundo, usada por milhões de empresas.
                  </p>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg">
                  <div className="text-blue-600 mb-3">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">Receba Rapidamente</h4>
                  <p className="text-gray-600 text-sm">
                    Os pagamentos são transferidos automaticamente para sua conta bancária em até 2 dias úteis.
                  </p>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg">
                  <div className="text-purple-600 mb-3">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">Relatórios Detalhados</h4>
                  <p className="text-gray-600 text-sm">
                    Acompanhe todas as suas vendas e pagamentos com relatórios detalhados e em tempo real.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            // Has Stripe account
            <div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
                <div className="flex items-center">
                  <div className="text-green-600 mr-4">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-green-900 mb-1">
                      Conta Stripe Configurada
                    </h3>
                    <p className="text-green-700">
                      ID da Conta: {accountStatus.accountId}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-4">Status da Conta</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Pode receber pagamentos:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        accountStatus.status?.charges_enabled 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {accountStatus.status?.charges_enabled ? 'Sim' : 'Não'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Pode receber transferências:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        accountStatus.status?.payouts_enabled 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {accountStatus.status?.payouts_enabled ? 'Sim' : 'Não'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Detalhes enviados:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        accountStatus.status?.details_submitted 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {accountStatus.status?.details_submitted ? 'Sim' : 'Pendente'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-4">Ações</h4>
                  <div className="space-y-3">
                    {!accountStatus.status?.details_submitted && (
                      <button
                        onClick={createNewAccountLink}
                        disabled={creating}
                        className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
                      >
                        {creating ? 'Carregando...' : 'Completar Configuração'}
                      </button>
                    )}
                    <button
                      onClick={createNewAccountLink}
                      disabled={creating}
                      className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-700 disabled:opacity-50"
                    >
                      {creating ? 'Carregando...' : 'Atualizar Informações'}
                    </button>
                    <button
                      onClick={() => router.push('/restaurant')}
                      className="w-full bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700"
                    >
                      Voltar ao Dashboard
                    </button>
                  </div>
                </div>
              </div>

              {accountStatus.status?.requirements && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                  <h4 className="font-semibold text-yellow-900 mb-4">Informações Pendentes</h4>
                  {accountStatus.status.requirements.currently_due.length > 0 && (
                    <div className="mb-4">
                      <p className="text-yellow-800 font-medium mb-2">Requeridas agora:</p>
                      <ul className="list-disc list-inside text-yellow-700 text-sm">
                        {accountStatus.status.requirements.currently_due.map((req, index) => (
                          <li key={index}>{req}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {accountStatus.status.requirements.eventually_due.length > 0 && (
                    <div>
                      <p className="text-yellow-800 font-medium mb-2">Requeridas eventualmente:</p>
                      <ul className="list-disc list-inside text-yellow-700 text-sm">
                        {accountStatus.status.requirements.eventually_due.map((req, index) => (
                          <li key={index}>{req}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}