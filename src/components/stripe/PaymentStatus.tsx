'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  CreditCard,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';

interface PaymentStatusProps {
  orderId: string;
  initialStatus?: 'pending' | 'processing' | 'paid' | 'failed' | 'canceled' | 'refunded';
  onStatusChange?: (status: string) => void;
  showRefundButton?: boolean;
  onRefund?: () => void;
}

interface PaymentInfo {
  status: string;
  paymentIntentId?: string;
  amount: number;
  currency: string;
  paymentMethod?: string;
  createdAt: string;
  updatedAt: string;
  failureReason?: string;
}

const statusConfig = {
  pending: {
    icon: Clock,
    color: 'bg-yellow-100 text-yellow-800',
    label: 'Pendente',
    description: 'Aguardando pagamento',
  },
  processing: {
    icon: Loader2,
    color: 'bg-blue-100 text-blue-800',
    label: 'Processando',
    description: 'Pagamento sendo processado',
  },
  paid: {
    icon: CheckCircle,
    color: 'bg-green-100 text-green-800',
    label: 'Pago',
    description: 'Pagamento confirmado',
  },
  failed: {
    icon: XCircle,
    color: 'bg-red-100 text-red-800',
    label: 'Falhou',
    description: 'Pagamento não foi processado',
  },
  canceled: {
    icon: XCircle,
    color: 'bg-gray-100 text-gray-800',
    label: 'Cancelado',
    description: 'Pagamento cancelado',
  },
  refunded: {
    icon: RefreshCw,
    color: 'bg-purple-100 text-purple-800',
    label: 'Reembolsado',
    description: 'Pagamento reembolsado',
  },
};

export const PaymentStatus = ({
  orderId,
  initialStatus = 'pending',
  onStatusChange,
  showRefundButton = false,
  onRefund,
}: PaymentStatusProps) => {
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefunding, setIsRefunding] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchPaymentStatus();
    
    // Poll for status updates if payment is processing
    const interval = setInterval(() => {
      if (paymentInfo?.status === 'processing' || paymentInfo?.status === 'pending') {
        fetchPaymentStatus();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [orderId]);

  const fetchPaymentStatus = async () => {
    try {
      const response = await fetch(`/api/orders/${orderId}/payment-status`);
      const data = await response.json();

      if (response.ok) {
        setPaymentInfo(data.payment);
        if (onStatusChange && data.payment.status !== paymentInfo?.status) {
          onStatusChange(data.payment.status);
        }
      } else {
        setError(data.error || 'Failed to fetch payment status');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefund = async () => {
    if (!paymentInfo?.paymentIntentId) return;

    try {
      setIsRefunding(true);
      const response = await fetch('/api/stripe/payment/refund', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          paymentIntentId: paymentInfo.paymentIntentId,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setPaymentInfo(prev => prev ? { ...prev, status: 'refunded' } : null);
        if (onRefund) onRefund();
      } else {
        setError(data.error || 'Failed to process refund');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsRefunding(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Carregando status do pagamento...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!paymentInfo) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>Informações de pagamento não encontradas</AlertDescription>
      </Alert>
    );
  }

  const config = statusConfig[paymentInfo.status as keyof typeof statusConfig];
  const StatusIcon = config.icon;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Status do Pagamento
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full ${config.color}`}>
            <StatusIcon 
              className={`h-5 w-5 ${paymentInfo.status === 'processing' ? 'animate-spin' : ''}`} 
            />
          </div>
          <div>
            <Badge className={config.color}>
              {config.label}
            </Badge>
            <p className="text-sm text-gray-600 mt-1">
              {config.description}
            </p>
          </div>
        </div>

        <div className="grid gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Valor:</span>
            <span className="font-medium">
              R$ {paymentInfo.amount.toFixed(2)}
            </span>
          </div>
          
          {paymentInfo.paymentIntentId && (
            <div className="flex justify-between">
              <span className="text-gray-600">ID do Pagamento:</span>
              <span className="font-mono text-xs">
                {paymentInfo.paymentIntentId.slice(-8)}
              </span>
            </div>
          )}

          <div className="flex justify-between">
            <span className="text-gray-600">Criado em:</span>
            <span>
              {new Date(paymentInfo.createdAt).toLocaleString('pt-BR')}
            </span>
          </div>

          {paymentInfo.updatedAt !== paymentInfo.createdAt && (
            <div className="flex justify-between">
              <span className="text-gray-600">Atualizado em:</span>
              <span>
                {new Date(paymentInfo.updatedAt).toLocaleString('pt-BR')}
              </span>
            </div>
          )}
        </div>

        {paymentInfo.failureReason && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Motivo da falha:</strong> {paymentInfo.failureReason}
            </AlertDescription>
          </Alert>
        )}

        {paymentInfo.status === 'paid' && showRefundButton && onRefund && (
          <div className="pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleRefund}
              disabled={isRefunding}
              className="w-full"
            >
              {isRefunding ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando Reembolso...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Solicitar Reembolso
                </>
              )}
            </Button>
          </div>
        )}

        {(paymentInfo.status === 'pending' || paymentInfo.status === 'processing') && (
          <div className="pt-4 border-t">
            <Button
              variant="outline"
              onClick={fetchPaymentStatus}
              className="w-full"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Atualizar Status
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};