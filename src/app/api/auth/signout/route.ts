// src/app/api/auth/signout/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/services/auth.service';

// Force Node.js runtime for Firebase Admin SDK
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    console.log('🚪 API: Recebida solicitação de logout');

    // Executar logout
    const result = await authService.signOutUser();

    if (result.success) {
      console.log('✅ Logout realizado com sucesso via API');
      
      return NextResponse.json(
        {
          success: true,
          message: result.message,
        },
        { status: 200 }
      );
    } else {
      console.log('❌ Falha no logout via API:', result.error);
      
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('❌ Erro interno na API de logout:', error);
    
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

// Método GET para verificar status de autenticação
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 API: Verificando status de autenticação');

    const isAuthenticated = authService.isAuthenticated();
    const currentUser = authService.getCurrentUserProfile();

    if (isAuthenticated && currentUser) {
      return NextResponse.json(
        {
          success: true,
          authenticated: true,
          user: {
            id: currentUser.id,
            email: currentUser.email,
            name: currentUser.name,
            user_type: currentUser.user_type,
            status: currentUser.status,
            phone: currentUser.phone,
          },
        },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        {
          success: true,
          authenticated: false,
          user: null,
        },
        { status: 200 }
      );
    }

  } catch (error) {
    console.error('❌ Erro ao verificar status de autenticação:', error);
    
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
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}