'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { Eye, EyeOff, Mail, Lock, ArrowRight } from 'lucide-react';
import AnimatedContainer from '@/components/AnimatedContainer';
import { useAuth } from '@/hooks/useAuth';

export default function SignInPage() {
  const router = useRouter();
  const { signIn, loading } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // [FASE 2 - LOG 1] Registrar início da tentativa de login
    console.log('[SIGN_IN_PAGE] 🚀 Tentativa de login iniciada', {
      email: formData.email,
      passwordLength: formData.password.length,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent.substring(0, 50) + '...'
    });

    try {
      // [FASE 2 - LOG 2] Chamando serviço de autenticação
      console.log('[SIGN_IN_PAGE] 📞 Chamando authService.signIn...', {
        email: formData.email,
        timestamp: new Date().toISOString()
      });

      const result = await signIn(formData.email, formData.password);
      
      // [FASE 2 - LOG 3] Resultado da autenticação
      console.log('[SIGN_IN_PAGE] 📋 Resposta do authService.signIn:', {
        success: result.success,
        userRole: result.userRole,
        hasError: !!result.error,
        errorMessage: result.error,
        timestamp: new Date().toISOString()
      });
      
      if (result.success) {
        // [FASE 2 - LOG 4] Login bem-sucedido
        console.log('[SIGN_IN_PAGE] ✅ LOGIN BEM-SUCEDIDO! Preparando redirecionamento...', {
          userRole: result.userRole,
          timestamp: new Date().toISOString()
        });

        toast.success('Login realizado com sucesso!');
        
        // Redirecionar baseado no tipo de usuário
        // O middleware também cuidará do redirecionamento, mas fazemos aqui para ser mais rápido
        if (result.userRole) {
          // [FASE 2 - LOG 5] Determinando rota de redirecionamento
          console.log('[SIGN_IN_PAGE] 🎯 Determinando rota de redirecionamento...', {
            userRole: result.userRole,
            timestamp: new Date().toISOString()
          });

          // Aguardar um pequeno delay para garantir que o estado seja atualizado
          await new Promise(resolve => setTimeout(resolve, 100));

          let redirectPath = '/';
          switch (result.userRole) {
            case 'customer':
              redirectPath = '/customer';
              console.log('[SIGN_IN_PAGE] 🛍️ Redirecionando cliente para /customer');
              break;
            case 'delivery':
              redirectPath = '/delivery';
              console.log('[SIGN_IN_PAGE] 🚚 Redirecionando entregador para /delivery');
              break;
            case 'restaurant':
              redirectPath = '/restaurant';
              // Para restaurantes, o middleware verificará se já está cadastrado
              console.log('[SIGN_IN_PAGE] 🍽️ Redirecionando restaurante para /restaurant (middleware verificará cadastro)');
              break;
            default:
              console.log('[SIGN_IN_PAGE] ❓ Tipo de usuário desconhecido, redirecionando para raiz');
          }

          // [DIAGNÓSTICO] Tentar diferentes métodos de redirecionamento
          console.log('[SIGN_IN_PAGE] 🔄 Tentando redirecionamento para:', redirectPath);
          
          try {
            // Método 1: Next.js router
            console.log('[SIGN_IN_PAGE] 📍 Método 1: router.push()');
            router.push(redirectPath);
            
            // Aguardar um momento e verificar se o redirecionamento funcionou
            setTimeout(() => {
              if (window.location.pathname === '/auth/sign-in') {
                console.warn('[SIGN_IN_PAGE] ⚠️ router.push() falhou, tentando window.location');
                window.location.href = redirectPath;
              }
            }, 500);
            
          } catch (routerError) {
            console.error('[SIGN_IN_PAGE] ❌ Erro no router.push, usando window.location:', routerError);
            window.location.href = redirectPath;
          }
        } else {
          // Se não conseguir determinar o tipo, deixar o middleware cuidar
          console.log('[SIGN_IN_PAGE] ⚠️ Tipo de usuário não determinado, deixando middleware cuidar');
          router.push('/');
        }
      } else {
        // [FASE 2 - LOG 6] Falha no login
        console.error('[SIGN_IN_PAGE] ❌ FALHA NO LOGIN:', {
          error: result.error,
          email: formData.email,
          timestamp: new Date().toISOString()
        });
        toast.error(result.error || 'Erro ao fazer login');
      }
    } catch (error) {
      // [FASE 2 - LOG 7] Erro durante o processo de login
      console.error('[SIGN_IN_PAGE] 💥 ERRO DURANTE LOGIN:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        email: formData.email,
        timestamp: new Date().toISOString()
      });
      toast.error('Erro inesperado durante o login');
    } finally {
      // [FASE 2 - LOG 8] Finalizando processo
      console.log('[SIGN_IN_PAGE] 🏁 Processo de login finalizado', {
        timestamp: new Date().toISOString()
      });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <AnimatedContainer className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Bem-vindo de volta!
            </h1>
            <p className="text-gray-600">
              Entre na sua conta para continuar
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors bg-white text-gray-900 placeholder-gray-500"
                  placeholder="seu@email.com"
                  required
                  disabled={loading || isSubmitting}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors bg-white text-gray-900 placeholder-gray-500"
                  placeholder="Sua senha"
                  required
                  disabled={loading || isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  disabled={loading || isSubmitting}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Forgot Password */}
            <div className="text-right">
              <Link 
                href="/auth/forgot-password" 
                className="text-sm text-orange-600 hover:text-orange-700 transition-colors"
              >
                Esqueceu sua senha?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || isSubmitting}
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 px-4 rounded-lg font-semibold hover:from-orange-600 hover:to-red-600 focus:ring-4 focus:ring-orange-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2"
            >
              {loading || isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Entrar
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Sign Up Link */}
          <div className="mt-8 text-center">
            <p className="text-gray-600">
              Não tem uma conta?{' '}
              <Link 
                href="/auth/sign-up" 
                className="text-orange-600 hover:text-orange-700 font-medium transition-colors"
              >
                Cadastre-se aqui
              </Link>
            </p>
          </div>
        </div>
      </AnimatedContainer>
    </div>
  );
}