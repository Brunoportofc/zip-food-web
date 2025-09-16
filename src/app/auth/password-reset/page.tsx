'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/auth.service';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Phone, Shield, Key, Clock, CheckCircle } from 'lucide-react';
import Link from 'next/link';

type Step = 'phone' | 'code' | 'password' | 'success';

interface FormData {
  phone: string;
  code: string;
  newPassword: string;
  confirmPassword: string;
}

interface RateLimit {
  remaining: number;
  resetTime: number;
  canSend: boolean;
}

export default function PasswordResetPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('phone');
  const [formData, setFormData] = useState<FormData>({
    phone: '',
    code: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [rateLimit, setRateLimit] = useState<RateLimit | null>(null);
  const [developmentCode, setDevelopmentCode] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);

  // Countdown timer para reenvio
  useState(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  });

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setFormData(prev => ({ ...prev, phone: formatted }));
    setError('');
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setFormData(prev => ({ ...prev, code: value }));
    setError('');
  };

  const checkRateLimit = async (phone: string) => {
    try {
      const limit = await authService.checkSMSRateLimit(phone);
      setRateLimit(limit);
      return limit.canSend;
    } catch (error) {
      return true; // Em caso de erro, permitir tentativa
    }
  };

  const handleRequestCode = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Validar telefone
      const validation = authService.validatePhoneFormat(formData.phone);
      if (!validation.isValid) {
        setError(validation.error || 'Formato de telefone inválido');
        return;
      }

      // Verificar rate limit
      const canSend = await checkRateLimit(formData.phone);
      if (!canSend) {
        setError('Muitas tentativas. Tente novamente em 1 hora.');
        return;
      }

      // Solicitar código
      const result = await authService.requestPasswordReset(formData.phone);
      
      if (result.success) {
        setSuccess(result.message);
        setStep('code');
        setCountdown(60); // 60 segundos para reenvio
        
        // Mostrar código em desenvolvimento
        if (result.developmentCode) {
          setDevelopmentCode(result.developmentCode);
        }
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    setLoading(true);
    setError('');

    try {
      if (formData.code.length !== 6) {
        setError('Código deve ter 6 dígitos');
        return;
      }

      const result = await authService.verifySMSCode(formData.phone, formData.code);
      
      if (result.success) {
        setSuccess(result.message);
        setStep('password');
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setLoading(true);
    setError('');

    try {
      // Validações
      if (formData.newPassword.length < 6) {
        setError('Nova senha deve ter pelo menos 6 caracteres');
        return;
      }

      if (formData.newPassword !== formData.confirmPassword) {
        setError('Senhas não coincidem');
        return;
      }

      const result = await authService.resetPassword(
        formData.phone,
        formData.code,
        formData.newPassword
      );
      
      if (result.success) {
        setSuccess(result.message);
        setStep('success');
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (countdown > 0) return;
    await handleRequestCode();
  };

  const renderStepContent = () => {
    switch (step) {
      case 'phone':
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <Phone className="mx-auto h-12 w-12 text-orange-500 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900">Redefinir Senha</h2>
              <p className="text-gray-600 mt-2">
                Digite seu número de telefone para receber um código de verificação
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Número de Telefone
              </label>
              <Input
                id="phone"
                type="tel"
                placeholder="(11) 98765-4321"
                value={formData.phone}
                onChange={handlePhoneChange}
                maxLength={15}
                className="text-center text-lg"
              />
              <p className="text-xs text-gray-500">
                Digite apenas números. Formato: (11) 98765-4321
              </p>
            </div>

            {rateLimit && !rateLimit.canSend && (
              <Alert className="border-yellow-200 bg-yellow-50">
                <Clock className="h-4 w-4" />
                <AlertDescription className="text-yellow-800">
                  Limite de SMS atingido. Restam {rateLimit.remaining} tentativas.
                  {rateLimit.resetTime > 0 && (
                    <> Tente novamente em {Math.ceil((rateLimit.resetTime - Date.now()) / (1000 * 60))} minutos.</>
                  )}
                </AlertDescription>
              </Alert>
            )}

            <Button
              onClick={handleRequestCode}
              disabled={loading || !formData.phone || (rateLimit ? !rateLimit.canSend : false)}
              className="w-full bg-orange-500 hover:bg-orange-600"
            >
              {loading ? 'Enviando...' : 'Enviar Código'}
            </Button>
          </div>
        );

      case 'code':
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <Shield className="mx-auto h-12 w-12 text-orange-500 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900">Verificar Código</h2>
              <p className="text-gray-600 mt-2">
                Digite o código de 6 dígitos enviado para {formData.phone}
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="code" className="block text-sm font-medium text-gray-700">
                Código de Verificação
              </label>
              <Input
                id="code"
                type="text"
                placeholder="123456"
                value={formData.code}
                onChange={handleCodeChange}
                maxLength={6}
                className="text-center text-2xl tracking-widest"
              />
              <p className="text-xs text-gray-500">
                O código expira em 15 minutos
              </p>
            </div>

            {developmentCode && (
              <Alert className="border-blue-200 bg-blue-50">
                <AlertDescription className="text-blue-800">
                  <strong>Desenvolvimento:</strong> Código: {developmentCode}
                </AlertDescription>
              </Alert>
            )}

            <Button
              onClick={handleVerifyCode}
              disabled={loading || formData.code.length !== 6}
              className="w-full bg-orange-500 hover:bg-orange-600"
            >
              {loading ? 'Verificando...' : 'Verificar Código'}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={handleResendCode}
                disabled={countdown > 0 || loading}
                className="text-sm text-orange-600 hover:text-orange-700 disabled:text-gray-400"
              >
                {countdown > 0 ? `Reenviar em ${countdown}s` : 'Reenviar código'}
              </button>
            </div>
          </div>
        );

      case 'password':
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <Key className="mx-auto h-12 w-12 text-orange-500 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900">Nova Senha</h2>
              <p className="text-gray-600 mt-2">
                Crie uma nova senha segura para sua conta
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                  Nova Senha
                </label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="Digite sua nova senha"
                  value={formData.newPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
                  minLength={6}
                />
                <p className="text-xs text-gray-500">
                  Mínimo de 6 caracteres
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirmar Senha
                </label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirme sua nova senha"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  minLength={6}
                />
              </div>
            </div>

            <Button
              onClick={handleResetPassword}
              disabled={loading || !formData.newPassword || !formData.confirmPassword}
              className="w-full bg-orange-500 hover:bg-orange-600"
            >
              {loading ? 'Redefinindo...' : 'Redefinir Senha'}
            </Button>
          </div>
        );

      case 'success':
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900">Senha Redefinida!</h2>
              <p className="text-gray-600 mt-2">
                Sua senha foi redefinida com sucesso. Agora você pode fazer login com sua nova senha.
              </p>
            </div>

            <Button
              onClick={() => router.push('/auth/sign-in')}
              className="w-full bg-orange-500 hover:bg-orange-600"
            >
              Fazer Login
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-between">
              <Link
                href="/auth/sign-in"
                className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar ao Login
              </Link>
              {step !== 'phone' && step !== 'success' && (
                <button
                  onClick={() => {
                    if (step === 'code') setStep('phone');
                    if (step === 'password') setStep('code');
                  }}
                  className="text-sm text-orange-600 hover:text-orange-700"
                >
                  Voltar
                </button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert className="mb-4 border-red-200 bg-red-50">
                <AlertDescription className="text-red-800">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="mb-4 border-green-200 bg-green-50">
                <AlertDescription className="text-green-800">
                  {success}
                </AlertDescription>
              </Alert>
            )}

            {renderStepContent()}
          </CardContent>
        </Card>

        {/* Indicador de progresso */}
        {step !== 'success' && (
          <div className="mt-6 flex justify-center space-x-2">
            {['phone', 'code', 'password'].map((stepName, index) => {
              const currentIndex = ['phone', 'code', 'password'].indexOf(step);
              const isActive = index <= currentIndex;
              return (
                <div
                  key={stepName}
                  className={`h-2 w-8 rounded-full transition-colors ${
                    isActive ? 'bg-orange-500' : 'bg-gray-200'
                  }`}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}