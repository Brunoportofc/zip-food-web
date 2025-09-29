'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Button from '@/components/ui/Button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Wallet,
  TrendingUp,
  Settings,
  ExternalLink,
  Loader2,
  DollarSign,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';

interface StripeAccount {
  id: string;
  status: string;
  canReceivePayments: boolean;
  balance?: {
    available: number;
    pending: number;
    currency: string;
  };
}

export const RestaurantDashboard = () => {
  const [account, setAccount] = useState<StripeAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  useEffect(() => {
    fetchAccountData();
  }, []);

  const fetchAccountData = async () => {
    try {
      const response = await fetch('/api/stripe/connect/status');
      const data = await response.json();

      if (response.ok) {
        setAccount(data.account);
      } else {
        setError(data.error || 'Failed to fetch account data');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOnboarding = async () => {
    try {
      setIsUpdating(true);
      const response = await fetch('/api/stripe/connect/create', {
        method: 'POST',
        credentials: 'include', // Include cookies for authentication
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();

      if (response.ok && data.onboardingUrl) {
        window.open(data.onboardingUrl, '_blank');
      } else {
        setError(data.error || 'Failed to create onboarding link');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDashboardAccess = async () => {
    try {
      setIsUpdating(true);
      const response = await fetch('/api/stripe/connect/dashboard', {
        method: 'POST',
      });
      const data = await response.json();

      if (response.ok && data.dashboardUrl) {
        window.open(data.dashboardUrl, '_blank');
      } else {
        setError(data.error || 'Failed to create dashboard link');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const formatCurrency = (amount: number, currency: string = 'BRL') => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Carregando dados da conta...</span>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="space-y-6">
        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5" />
              Configurar Conta Stripe
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <div className="mb-4">
                <Wallet className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Conta Stripe não configurada
                </h3>
                <p className="text-gray-600 mb-6">
                  Configure sua conta Stripe Connect para começar a receber pagamentos dos clientes.
                </p>
              </div>
              <Button
                onClick={handleOnboarding}
                disabled={isUpdating}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Configurando...
                  </>
                ) : (
                  <>
                    <Settings className="w-4 h-4 mr-2" />
                    Configurar Stripe Connect
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {/* Account Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Status da Conta Stripe
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">ID da Conta</p>
              <p className="font-mono text-sm bg-gray-100 p-2 rounded">{account.id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <div className="flex items-center gap-2">
                {account.canReceivePayments ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-green-600 font-medium">Ativa</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-yellow-600" />
                    <span className="text-yellow-600 font-medium">Configuração Pendente</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            {!account.canReceivePayments && (
              <Button
                onClick={handleOnboarding}
                disabled={isUpdating}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isUpdating ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Settings className="w-4 h-4 mr-2" />
                )}
                Completar Configuração
              </Button>
            )}
            
            <Button
              onClick={handleDashboardAccess}
              disabled={isUpdating}
              variant="outline"
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Acessar Dashboard Stripe
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Balance Information */}
      {account.balance && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Saldo da Conta
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-600 font-medium">Saldo Disponível</p>
                <p className="text-2xl font-bold text-green-700">
                  {formatCurrency(account.balance.available, account.balance.currency)}
                </p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="text-sm text-yellow-600 font-medium">Saldo Pendente</p>
                <p className="text-2xl font-bold text-yellow-700">
                  {formatCurrency(account.balance.pending, account.balance.currency)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Ações Rápidas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              onClick={handleDashboardAccess}
              disabled={isUpdating}
              variant="outline"
              className="h-auto p-4 flex flex-col items-start border-gray-300 hover:bg-gray-50"
            >
              <div className="flex items-center gap-2 mb-2">
                <ExternalLink className="w-4 h-4" />
                <span className="font-medium">Dashboard Stripe</span>
              </div>
              <p className="text-sm text-gray-600 text-left">
                Acesse o dashboard completo do Stripe para gerenciar pagamentos e configurações.
              </p>
            </Button>
            
            <Button
              onClick={fetchAccountData}
              disabled={isUpdating}
              variant="outline"
              className="h-auto p-4 flex flex-col items-start border-gray-300 hover:bg-gray-50"
            >
              <div className="flex items-center gap-2 mb-2">
                <Loader2 className={`w-4 h-4 ${isUpdating ? 'animate-spin' : ''}`} />
                <span className="font-medium">Atualizar Dados</span>
              </div>
              <p className="text-sm text-gray-600 text-left">
                Atualize as informações da conta e saldo mais recentes.
              </p>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};