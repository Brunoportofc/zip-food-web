'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDeliveryAuth } from '@/hooks/useAuth';
import AnimatedContainer from '@/components/AnimatedContainer';
import { MdDeliveryDining, MdHourglassEmpty, MdEmail, MdPhone, MdTwoWheeler } from 'react-icons/md';

export default function DeliveryPendingPage() {
  const router = useRouter();
  const { user, isDelivery, isOffline, isAvailable, loading } = useDeliveryAuth();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/auth/sign-in?type=delivery');
        return;
      }

      if (!isDelivery) {
        router.push('/customer');
        return;
      }

      if (isAvailable) {
        router.push('/delivery');
        return;
      }
    }
  }, [user, isDelivery, isOffline, isAvailable, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isOffline && !user?.profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <AnimatedContainer animationType="fadeInUp" delay={200}>
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          {/* Icon */}
          <div className="mb-6">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MdHourglassEmpty className="w-10 h-10 text-blue-600" />
            </div>
            <MdDeliveryDining className="w-16 h-16 text-blue-600 mx-auto" />
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Aguardando Aprovação
          </h1>

          {/* Message */}
          <p className="text-gray-600 mb-6 leading-relaxed">
            Sua solicitação de cadastro como entregador foi recebida e está sendo analisada pela nossa equipe.
          </p>

          {/* Delivery Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">Dados do Entregador:</h3>
            <p className="text-gray-700 font-medium">{user?.name}</p>
            <p className="text-gray-600 text-sm">{user?.email}</p>
            {user?.phone && (
              <p className="text-gray-600 text-sm">{user.phone}</p>
            )}
            {user?.profile?.vehicle_type && (
              <div className="flex items-center justify-center mt-2 text-sm text-gray-600">
                <MdTwoWheeler className="w-4 h-4 mr-2" />
                Veículo: {user.profile.vehicle_type === 'bike' ? 'Bicicleta' : 
                         user.profile.vehicle_type === 'motorcycle' ? 'Moto' : 'Carro'}
              </div>
            )}
          </div>

          {/* Status Info */}
          <div className="text-left space-y-3 mb-6">
            <div className="flex items-center text-sm text-gray-600">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
              Cadastro realizado com sucesso
            </div>
            <div className="flex items-center text-sm text-blue-600">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
              Análise em andamento
            </div>
            <div className="flex items-center text-sm text-gray-400">
              <div className="w-2 h-2 bg-gray-300 rounded-full mr-3"></div>
              Aprovação pendente
            </div>
          </div>

          {/* Requirements Info */}
          <div className="bg-yellow-50 rounded-lg p-4 mb-6">
            <h4 className="font-semibold text-yellow-900 mb-2">Documentos Necessários:</h4>
            <div className="text-sm text-yellow-700 text-left space-y-1">
              <div>• CNH válida</div>
              <div>• Documento do veículo</div>
              <div>• Comprovante de residência</div>
              <div>• Foto 3x4</div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <h4 className="font-semibold text-blue-900 mb-2">Precisa de ajuda?</h4>
            <div className="space-y-2 text-sm text-blue-700">
              <div className="flex items-center justify-center">
                <MdEmail className="w-4 h-4 mr-2" />
                entregadores@zipfood.com
              </div>
              <div className="flex items-center justify-center">
                <MdPhone className="w-4 h-4 mr-2" />
                (11) 8888-8888
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={() => router.push('/auth/sign-in?type=customer')}
              className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              Acessar como Cliente
            </button>
            
            <button
              onClick={() => {
                // Implementar logout
                import('@/hooks/useAuth').then(({ useAuth }) => {
                  const { signOut } = useAuth();
                  signOut().then(() => {
                    router.push('/');
                  });
                });
              }}
              className="w-full text-blue-600 py-2 px-4 rounded-lg font-medium hover:bg-blue-50 transition-colors"
            >
              Sair
            </button>
          </div>
        </div>
      </AnimatedContainer>
    </div>
  );
}