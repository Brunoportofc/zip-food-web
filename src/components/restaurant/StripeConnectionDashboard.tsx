'use client';

import React, { useState, useEffect } from 'react';

interface StripeKeysInfo {
  hasStripeKeys: boolean;
  stripeKeys?: {
    isActive: boolean;
    isVerified: boolean;
    accountId?: string;
    publishableKey: string;
    lastVerifiedAt?: string;
    createdAt: string;
  };
}

const StripeConnectionDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [stripeInfo, setStripeInfo] = useState<StripeKeysInfo>({ hasStripeKeys: false });
  const [showKeysForm, setShowKeysForm] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const [keysForm, setKeysForm] = useState({
    publishableKey: '',
    secretKey: '',
  });

  useEffect(() => {
    loadStripeInfo();
  }, []);

  const loadStripeInfo = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/restaurant/stripe-keys');
      if (response.ok) {
        const data = await response.json();
        setStripeInfo(data);
        
        if (!data.hasStripeKeys) {
          setShowKeysForm(true);
        }
      } else {
        setMessage({ type: 'error', text: 'Erro ao carregar informações do Stripe' });
      }
    } catch (error) {
      console.error('Erro ao carregar Stripe info:', error);
      setMessage({ type: 'error', text: 'Erro ao carregar informações' });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveKeys = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    
    try {
      const response = await fetch('/api/restaurant/stripe-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(keysForm),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: data.message });
        await loadStripeInfo();
        setShowKeysForm(false);
        setKeysForm({ publishableKey: '', secretKey: '' });
      } else {
        setMessage({ type: 'error', text: data.error });
      }
    } catch (error) {
      console.error('Erro ao salvar chaves:', error);
      setMessage({ type: 'error', text: 'Erro ao salvar chaves Stripe' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteKeys = async () => {
    if (!confirm('Tem certeza que deseja remover suas chaves Stripe? Isso desabilitará os pagamentos.')) {
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/restaurant/stripe-keys', {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: data.message });
        await loadStripeInfo();
        setShowKeysForm(true);
      } else {
        setMessage({ type: 'error', text: data.error });
      }
    } catch (error) {
      console.error('Erro ao deletar chaves:', error);
      setMessage({ type: 'error', text: 'Erro ao remover chaves Stripe' });
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
          🔗 Conexão Stripe
        </h1>
        <p className="text-gray-600">
          Configure sua própria conta Stripe para receber pagamentos diretamente.
        </p>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      {/* Status da Conexão */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            📊 Status da Conexão
          </h2>
          {stripeInfo.hasStripeKeys && (
            <div className="flex gap-2">
              <button
                onClick={() => setShowKeysForm(!showKeysForm)}
                className="px-3 py-1.5 text-sm text-black border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                {showKeysForm ? 'Cancelar' : 'Atualizar Chaves'}
              </button>
              <button
                onClick={handleDeleteKeys}
                disabled={saving}
                className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                Remover Conexão
              </button>
            </div>
          )}
        </div>

        {stripeInfo.hasStripeKeys && stripeInfo.stripeKeys ? (
          <div className="space-y-4">
            {/* Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                <div className={`w-3 h-3 rounded-full mr-3 ${
                  stripeInfo.stripeKeys.isActive ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                <div>
                  <p className="font-medium text-sm text-gray-900">
                    {stripeInfo.stripeKeys.isActive ? 'Conectado' : 'Desconectado'}
                  </p>
                  <p className="text-xs text-gray-500">Status da conexão</p>
                </div>
              </div>

              <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                <div className={`w-3 h-3 rounded-full mr-3 ${
                  stripeInfo.stripeKeys.isVerified ? 'bg-green-500' : 'bg-yellow-500'
                }`}></div>
                <div>
                  <p className="font-medium text-sm text-gray-900">
                    {stripeInfo.stripeKeys.isVerified ? 'Verificado' : 'Pendente'}
                  </p>
                  <p className="text-xs text-gray-500">Verificação da conta</p>
                </div>
              </div>
            </div>

          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🔌</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhuma conexão Stripe configurada
            </h3>
            <p className="text-gray-600 mb-4">
              Configure sua conta Stripe para começar a receber pagamentos
            </p>
          </div>
        )}
      </div>

      {/* Formulário de Chaves */}
      {showKeysForm && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            🔑 Configurar Chaves Stripe
          </h2>
          
          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <h3 className="font-medium text-blue-900 mb-2">Como obter suas chaves Stripe:</h3>
            <ol className="text-sm text-blue-800 space-y-1">
              <li>1. Acesse <a href="https://dashboard.stripe.com" target="_blank" className="underline">dashboard.stripe.com</a></li>
              <li>2. Crie uma conta ou faça login</li>
              <li>3. Vá em "Developers" → "API keys"</li>
              <li>4. Copie a "Publishable key" e "Secret key"</li>
              <li>5. Cole aqui abaixo</li>
            </ol>
          </div>

          <form onSubmit={handleSaveKeys} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chave Pública (Publishable Key)
              </label>
              <input
                type="text"
                placeholder="pk_test_..."
                value={keysForm.publishableKey}
                onChange={(e) => setKeysForm({ ...keysForm, publishableKey: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Começa com pk_test_ (teste) ou pk_live_ (produção)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chave Secreta (Secret Key)
              </label>
              <input
                type="password"
                placeholder="sk_test_..."
                value={keysForm.secretKey}
                onChange={(e) => setKeysForm({ ...keysForm, secretKey: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Começa com sk_test_ (teste) ou sk_live_ (produção)
              </p>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>⚠️ Importante:</strong> Use chaves de teste durante o desenvolvimento. 
                As chaves são armazenadas de forma segura e nunca são expostas publicamente.
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={saving}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {saving ? 'Salvando...' : 'Salvar e Verificar Chaves'}
              </button>
              
              {stripeInfo.hasStripeKeys && (
                <button
                  type="button"
                  onClick={() => setShowKeysForm(false)}
                  className="px-6 py-2 text-black border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </div>
      )}

    </div>
  );
};

export default StripeConnectionDashboard;
