'use client';

import React, { useState, useEffect } from 'react';
import Card from '@/components/ui/card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

interface BankInfo {
  id: string;
  restaurantId: string;
  bankName: string;
  accountNumber: string;
  routingNumber: string;
  accountHolderName: string;
  isActive: boolean;
  verifiedAt?: string;
  createdAt: string;
}

interface PayoutData {
  id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  scheduledDate: string;
  processedDate?: string;
  transferId?: string;
  errorMessage?: string;
  orderId?: string;
  createdAt: string;
}

interface PayoutStats {
  totalEarnings: number;
  totalPayouts: number;
  lastPayoutDate?: string;
  averagePayoutAmount: number;
}

interface PendingEarnings {
  amount: number;
  count: number;
}

const PayoutDashboard: React.FC = () => {
  const [bankInfo, setBankInfo] = useState<BankInfo | null>(null);
  const [payoutHistory, setPayoutHistory] = useState<PayoutData[]>([]);
  const [pendingEarnings, setPendingEarnings] = useState<PendingEarnings>({ amount: 0, count: 0 });
  const [statistics, setStatistics] = useState<PayoutStats>({
    totalEarnings: 0,
    totalPayouts: 0,
    averagePayoutAmount: 0
  });
  
  const [showBankForm, setShowBankForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [bankForm, setBankForm] = useState({
    bankName: '',
    accountNumber: '',
    routingNumber: '',
    accountHolderName: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load bank info
      const bankResponse = await fetch('/api/restaurant/bank-info');
      if (bankResponse.ok) {
        const bankData = await bankResponse.json();
        setBankInfo(bankData.bankInfo);
        
        // If no bank info, show form
        if (!bankData.bankInfo) {
          setShowBankForm(true);
        }
      }

      // Load payout data
      const payoutResponse = await fetch('/api/restaurant/payouts');
      if (payoutResponse.ok) {
        const payoutData = await payoutResponse.json();
        setPayoutHistory(payoutData.data.payoutHistory);
        setPendingEarnings(payoutData.data.pendingEarnings);
        setStatistics(payoutData.data.statistics);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBankFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const response = await fetch('/api/restaurant/bank-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bankForm),
      });

      if (response.ok) {
        await loadData(); // Reload data
        setShowBankForm(false);
        setBankForm({
          bankName: '',
          accountNumber: '',
          routingNumber: '',
          accountHolderName: '',
        });
      } else {
        const error = await response.json();
        alert(`Erro: ${error.error}`);
      }
    } catch (error) {
      console.error('Erro ao salvar informações bancárias:', error);
      alert('Erro ao salvar informações bancárias');
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `₪${(amount / 100).toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'processing': return 'text-blue-600 bg-blue-100';
      case 'failed': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Concluído';
      case 'pending': return 'Pendente';
      case 'processing': return 'Processando';
      case 'failed': return 'Falhou';
      default: return status;
    }
  };

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
          💰 Repasses e Pagamentos
        </h1>
        <p className="text-gray-600">
          Gerencie suas informações bancárias e acompanhe seus repasses
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <span className="text-2xl">💰</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Ganhos Totais</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(statistics.totalEarnings)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <span className="text-2xl">⏳</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pendentes</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(pendingEarnings.amount)}
              </p>
              <p className="text-xs text-gray-500">{pendingEarnings.count} pedidos</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <span className="text-2xl">📊</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Repasses</p>
              <p className="text-2xl font-bold text-gray-900">
                {statistics.totalPayouts}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <span className="text-2xl">🎯</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Média p/ Repasse</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(statistics.averagePayoutAmount)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Bank Information */}
      <Card className="p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">🏦 Informações Bancárias</h2>
          {bankInfo && (
            <Button
              onClick={() => setShowBankForm(!showBankForm)}
              variant="outline"
              size="sm"
            >
              {showBankForm ? 'Cancelar' : 'Editar'}
            </Button>
          )}
        </div>

        {bankInfo && !showBankForm ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Banco</p>
              <p className="text-lg text-gray-900">{bankInfo.bankName}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Titular da Conta</p>
              <p className="text-lg text-gray-900">{bankInfo.accountHolderName}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Número da Conta</p>
              <p className="text-lg text-gray-900">{bankInfo.accountNumber}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Código do Banco</p>
              <p className="text-lg text-gray-900">{bankInfo.routingNumber}</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleBankFormSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                type="text"
                placeholder="Nome do Banco"
                value={bankForm.bankName}
                onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
                required
              />
              <Input
                type="text"
                placeholder="Nome do Titular"
                value={bankForm.accountHolderName}
                onChange={(e) => setBankForm({ ...bankForm, accountHolderName: e.target.value })}
                required
              />
              <Input
                type="text"
                placeholder="Número da Conta"
                value={bankForm.accountNumber}
                onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })}
                required
              />
              <Input
                type="text"
                placeholder="Código do Banco (3 dígitos)"
                value={bankForm.routingNumber}
                onChange={(e) => setBankForm({ ...bankForm, routingNumber: e.target.value })}
                maxLength={3}
                required
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={saving}>
                {saving ? 'Salvando...' : 'Salvar Informações'}
              </Button>
              {bankInfo && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowBankForm(false)}
                >
                  Cancelar
                </Button>
              )}
            </div>
          </form>
        )}
      </Card>

      {/* Payout History */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">📋 Histórico de Repasses</h2>
        
        {payoutHistory.length === 0 ? (
          <div className="text-center py-8">
            <span className="text-4xl mb-4 block">💸</span>
            <p className="text-gray-600">Nenhum repasse encontrado ainda</p>
            <p className="text-sm text-gray-500 mt-2">
              Os repasses aparecem aqui após os pedidos serem pagos
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-2 font-medium text-gray-600">Data</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-600">Valor</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-600">Status</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-600">Pedido</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-600">Processado</th>
                </tr>
              </thead>
              <tbody>
                {payoutHistory.map((payout) => (
                  <tr key={payout.id} className="border-b border-gray-100">
                    <td className="py-3 px-2">
                      {formatDate(payout.scheduledDate)}
                    </td>
                    <td className="py-3 px-2 font-medium">
                      {formatCurrency(payout.amount)}
                    </td>
                    <td className="py-3 px-2">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(payout.status)}`}>
                        {getStatusText(payout.status)}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-sm text-gray-600">
                      {payout.orderId ? `#${payout.orderId}` : '-'}
                    </td>
                    <td className="py-3 px-2 text-sm text-gray-600">
                      {payout.processedDate ? formatDate(payout.processedDate) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default PayoutDashboard;
