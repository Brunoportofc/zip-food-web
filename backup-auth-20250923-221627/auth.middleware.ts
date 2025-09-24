import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { userTypeService } from '@/services/user-type.service';
import { UserType } from '@/types/auth';

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    uid: string;
    email: string;
    user_type: UserType;
    profile?: any;
  };
}

/**
 * Middleware para verificar autenticação e autorização
 */
export async function authMiddleware(
  request: NextRequest,
  requiredUserType?: UserType | UserType[]
): Promise<{ success: boolean; user?: any; response?: NextResponse }> {
  try {
    // Extrair token do header x-auth-token (passado pelo middleware principal)
    let token = request.headers.get('x-auth-token');
    
    // Fallback para Authorization header se x-auth-token não estiver presente
    if (!token) {
      const authHeader = request.headers.get('authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return {
          success: false,
          response: NextResponse.json(
            { error: 'Token de autenticação não fornecido' },
            { status: 401 }
          )
        };
      }
      token = authHeader.substring(7);
    }

    // Verificar token com Firebase Admin
    const decodedToken = await adminAuth.verifyIdToken(token);
    
    // Buscar perfil do usuário
    const userProfile = await userTypeService.getUserProfile(decodedToken.uid);
    
    if (!userProfile) {
      return {
        success: false,
        response: NextResponse.json(
          { error: 'Perfil do usuário não encontrado' },
          { status: 404 }
        )
      };
    }

    // Verificar se o usuário está ativo
    if (userProfile.status === 'suspended') {
      return {
        success: false,
        response: NextResponse.json(
          { error: 'Conta suspensa. Entre em contato com o suporte.' },
          { status: 403 }
        )
      };
    }

    if (userProfile.status === 'inactive') {
      return {
        success: false,
        response: NextResponse.json(
          { error: 'Conta inativa. Verifique seu email para ativação.' },
          { status: 403 }
        )
      };
    }

    // Para restaurantes, verificar se está aprovado
    if (userProfile.user_type === 'restaurant' && userProfile.status === 'pending') {
      return {
        success: false,
        response: NextResponse.json(
          { error: 'Conta de restaurante aguardando aprovação.' },
          { status: 403 }
        )
      };
    }

    if (userProfile.user_type === 'restaurant' && userProfile.restaurant_status === 'rejected') {
      return {
        success: false,
        response: NextResponse.json(
          { error: 'Conta de restaurante rejeitada. Entre em contato com o suporte.' },
          { status: 403 }
        )
      };
    }

    // Verificar tipo de usuário se especificado
    if (requiredUserType) {
      const allowedTypes = Array.isArray(requiredUserType) ? requiredUserType : [requiredUserType];
      
      if (!allowedTypes.includes(userProfile.user_type)) {
        return {
          success: false,
          response: NextResponse.json(
            { error: 'Acesso negado. Tipo de conta não autorizado.' },
            { status: 403 }
          )
        };
      }
    }

    // Atualizar último login
    await userTypeService.updateLastLogin(decodedToken.uid);

    const user = {
      uid: decodedToken.uid,
      email: decodedToken.email || userProfile.email,
      user_type: userProfile.user_type,
      profile: userProfile
    };

    return {
      success: true,
      user
    };

  } catch (error) {
    console.error('Erro no middleware de autenticação:', error);
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Token inválido ou expirado' },
        { status: 401 }
      )
    };
  }
}

/**
 * Helper para proteger rotas de API
 */
export function withAuth(
  handler: (request: AuthenticatedRequest) => Promise<NextResponse>,
  requiredUserType?: UserType | UserType[]
) {
  return async (request: NextRequest) => {
    const authResult = await authMiddleware(request, requiredUserType);
    
    if (!authResult.success) {
      return authResult.response!;
    }

    // Adicionar dados do usuário à request
    (request as AuthenticatedRequest).user = authResult.user;
    
    return handler(request as AuthenticatedRequest);
  };
}

/**
 * Helper específico para rotas de restaurante
 */
export function withRestaurantAuth(
  handler: (request: AuthenticatedRequest) => Promise<NextResponse>
) {
  return withAuth(handler, 'restaurant');
}

/**
 * Helper específico para rotas de entregador
 */
export function withDeliveryAuth(
  handler: (request: AuthenticatedRequest) => Promise<NextResponse>
) {
  return withAuth(handler, 'delivery');
}

/**
 * Helper específico para rotas de admin - verifica permissões especiais
 */
export function withAdminAuth(
  handler: (request: AuthenticatedRequest) => Promise<NextResponse>
) {
  return withAuth(async (request: AuthenticatedRequest) => {
    // Verificar se o usuário tem permissões de admin
    // Por enquanto, permitir todos os usuários autenticados
    // TODO: Implementar verificação de permissões de admin
    return handler(request);
  });
}