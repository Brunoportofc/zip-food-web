// src/app/api/auth/me/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/services/auth.service';

// Force Node.js runtime for Firebase Admin SDK
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    console.log('👤 API: Solicitação de informações do usuário atual');

    const isAuthenticated = authService.isAuthenticated();
    const currentUser = authService.getCurrentUserProfile();

    if (!isAuthenticated || !currentUser) {
      return NextResponse.json(
        {
          success: false,
          error: 'Usuário não autenticado',
        },
        { status: 401 }
      );
    }

    // Retornar informações do usuário (sem dados sensíveis)
    const userResponse = {
      id: currentUser.id,
      email: currentUser.email,
      name: currentUser.name,
      user_type: currentUser.user_type,
      status: currentUser.status,
      phone: currentUser.phone,
      created_at: currentUser.created_at,
      updated_at: currentUser.updated_at,
    };

    console.log('✅ Informações do usuário retornadas:', {
      id: userResponse.id,
      email: userResponse.email,
      user_type: userResponse.user_type,
    });

    return NextResponse.json(
      {
        success: true,
        user: userResponse,
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('❌ Erro ao obter informações do usuário:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
      },
      { status: 500 }
    );
  }
}

// Método OPTIONS para CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}