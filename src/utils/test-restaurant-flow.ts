// src/utils/test-restaurant-flow.ts
// Script para testar o fluxo completo de redirecionamento de restaurantes

/**
 * Fluxo de teste para o sistema de redirecionamento:
 * 
 * 1. Usuário faz cadastro como 'restaurant'
 * 2. Usuário faz login 
 * 3. Sistema verifica custom claims
 * 4. Se não tem restaurante → redireciona para /restaurant/cadastro
 * 5. Usuário cadastra restaurante
 * 6. Sistema define custom claims
 * 7. Próximo login → redireciona para /restaurant (dashboard)
 * 
 * CENÁRIOS DE TESTE:
 * 
 * A) Novo usuário restaurante (sem restaurante cadastrado):
 *    - Login → middleware verifica custom claims (false) → API check (false) → /restaurant/cadastro
 * 
 * B) Usuário restaurante com restaurante (com custom claims):
 *    - Login → middleware verifica custom claims (true) → /restaurant
 * 
 * C) Usuário restaurante com restaurante (sem custom claims - casos antigos):
 *    - Login → middleware verifica custom claims (false) → API check (true) → sync claims → /restaurant
 * 
 * D) Acesso direto a /restaurant:
 *    - Se tem custom claims → permite acesso
 *    - Se não tem custom claims → verifica via API → se tem restaurante, permite
 * 
 * LOGS PARA MONITORAR:
 * - [MIDDLEWARE] logs de redirecionamento
 * - [API_VERIFY] logs de verificação de sessão
 * - [API] logs da API de check de restaurante
 * - [Sync] logs de sincronização de claims
 * - [Auth] logs do hook de autenticação
 */

// Função para debugar o estado atual do usuário
export async function debugUserRestaurantState(userId: string) {
  const debug = {
    userId,
    timestamp: new Date().toISOString(),
    checks: {
      firebaseAuth: null as any,
      customClaims: null as any,
      firestoreUser: null as any,
      restaurantExists: null as any,
      apiCheck: null as any
    }
  };

  try {
    // Seria necessário adaptar para o ambiente onde está sendo executado
    console.log('🔍 [Debug] Estado do usuário restaurante:', userId);
    
    // Este é um template - na implementação real seria necessário
    // adaptar para fazer as verificações através das APIs ou Firebase Admin
    
    return debug;
  } catch (error) {
    console.error('❌ [Debug] Erro ao verificar estado:', error);
    return { ...debug, error: error instanceof Error ? error.message : String(error) };
  }
}

// Casos de teste esperados
export const TEST_SCENARIOS = {
  NEW_RESTAURANT_USER: {
    description: 'Novo usuário restaurante sem restaurante cadastrado',
    expected: {
      loginRedirect: '/restaurant/cadastro',
      customClaims: { hasRestaurant: false },
      apiCheck: { hasRestaurant: false }
    }
  },
  
  EXISTING_RESTAURANT_WITH_CLAIMS: {
    description: 'Usuário restaurante com restaurante e custom claims',
    expected: {
      loginRedirect: '/restaurant',
      customClaims: { hasRestaurant: true, restaurantId: 'some-id' },
      apiCheck: { hasRestaurant: true }
    }
  },
  
  EXISTING_RESTAURANT_WITHOUT_CLAIMS: {
    description: 'Usuário restaurante com restaurante mas sem custom claims',
    expected: {
      loginRedirect: '/restaurant',
      customClaims: { hasRestaurant: false }, // antes da sincronização
      apiCheck: { hasRestaurant: true },
      syncResult: { success: true, hasRestaurant: true }
    }
  },
  
  DIRECT_ACCESS_RESTAURANT_DASHBOARD: {
    description: 'Acesso direto a /restaurant',
    expected: {
      withClaims: 'allow',
      withoutClaimsButHasRestaurant: 'allow_after_api_check',
      withoutRestaurant: 'redirect_to_cadastro'
    }
  }
} as const;

export default {
  debugUserRestaurantState,
  TEST_SCENARIOS
};
