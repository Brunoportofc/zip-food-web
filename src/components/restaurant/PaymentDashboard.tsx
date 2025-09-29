'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';

interface PaymentData {
  totalEarnings: number;
  pendingPayouts: number;
  completedPayouts: number;
  recentTransactions: Transaction[];
  monthlyEarnings: MonthlyEarning[];
}

interface Transaction {
  id: string;
  orderId: string;
  amount: number;
  currency: string;
  status: string;
  type: 'payment' | 'payout' | 'refund';
  createdAt: string;
  description: string;
}

interface MonthlyEarning {
  month: string;
  earnings: number;
  orders: number;
}

export default function PaymentDashboard() {
  const { user } = useAuth();
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');

  useEffect(() => {
    if (user?.uid) {
      loadPaymentData();
    }
  }, [user, selectedPeriod]);

  const loadPaymentData = async () => {
    try {
      const response = await fetch(`/api/restaurant/payments?restaurantId=${user?.uid}&period=${selectedPeriod}`);
      const data = await response.json();

      if (response.ok) {
        setPaymentData(data.data);
      } else {
        toast.error(data.message || 'Erro ao carregar dados de pagamento');
      }
    } catch (error) {
      console.error('Error loading payment data:', error);
      toast.error('Erro ao carregar dados de pagamento');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'succeeded':
      case 'paid':
        return 'text-green-600 bg-green-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'payment':
        return '💳';
      case 'payout':
        return '💰';
      case 'refund':
        return '↩️';
      default:
        return '📄';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!paymentData) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 text-center">
        <div className="text-gray-400 text-6xl mb-4">💳</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Nenhum dado de pagamento encontrado
        </h3>
        <p className="text-gray-600">
          Configure sua conta Stripe Connect para começar a receber pagamentos.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Dashboard de Pagamentos</h2>
        <div className="flex space-x-2">
          {(['week', 'month', 'year'] as const).map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                selectedPeriod === period
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {period === 'week' ? 'Semana' : period === 'month' ? 'Mês' : 'Ano'}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="text-green-600 text-3xl mr-4">💰</div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Recebido</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(paymentData.totalEarnings)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="text-yellow-600 text-3xl mr-4">⏳</div>
            <div>
              <p className="text-sm font-medium text-gray-600">Pendente</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(paymentData.pendingPayouts)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="text-blue-600 text-3xl mr-4">✅</div>
            <div>
              <p className="text-sm font-medium text-gray-600">Transferido</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(paymentData.completedPayouts)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Earnings Chart */}
      {paymentData.monthlyEarnings.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Ganhos por Mês
          </h3>
          <div className="space-y-4">
            {paymentData.monthlyEarnings.map((earning, index) => (
              <div key={index} className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{earning.month}</p>
                  <p className="text-sm text-gray-600">{earning.orders} pedidos</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">
                    {formatCurrency(earning.earnings)}
                  </p>
                  <div className="w-32 bg-gray-200 rounded-full h-2 mt-1">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{
                        width: `${Math.min(
                          (earning.earnings / Math.max(...paymentData.monthlyEarnings.map(e => e.earnings))) * 100,
                          100
                        )}%`
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Transações Recentes
        </h3>
        {paymentData.recentTransactions.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 text-4xl mb-2">📄</div>
            <p className="text-gray-600">Nenhuma transação encontrada</p>
          </div>
        ) : (
          <div className="space-y-4">
            {paymentData.recentTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  <div className="text-2xl">
                    {getTransactionIcon(transaction.type)}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {transaction.description}
                    </p>
                    <p className="text-sm text-gray-600">
                      Pedido #{transaction.orderId?.slice(-6)} • {formatDate(transaction.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">
                    {formatCurrency(transaction.amount)}
                  </p>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                    {transaction.status === 'succeeded' ? 'Sucesso' :
                     transaction.status === 'pending' ? 'Pendente' :
                     transaction.status === 'failed' ? 'Falhou' : transaction.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}