// src/app/api/auth/signin/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { authService, SignInData } from '@/services/auth.service';

// Force Node.js runtime for Firebase Admin SDK
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    console.log('🔐 API: Recebida solicitação de login');

    // Verificar Content-Type
    const contentType = request.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Content-Type deve ser application/json',
        },
        { status: 400 }
      );
    }

    // Extrair dados do corpo da requisição
    let body: SignInData;
    try {
      body = await request.json();
    } catch (error) {
      console.error('❌ Erro ao parsear JSON:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Dados JSON inválidos',
        },
        { status: 400 }
      );
    }

    // Validar campos obrigatórios
    if (!body.email || !body.password) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email e senha são obrigatórios',
        },
        { status: 400 }
      );
    }

    // Sanitizar dados
    const signInData: SignInData = {
      email: body.email.toLowerCase().trim(),
      password: body.password,
    };

    console.log('🔍 Tentativa de login para:', signInData.email);

    // Executar login
    const result = await authService.signIn(signInData);

    if (result.success) {
      console.log('✅ Login realizado com sucesso via API');
      
      // Criar resposta com dados do usuário (sem informações sensíveis)
      const userResponse = {
        id: result.user!.id,
        email: result.user!.email,
        name: result.user!.name,
        user_type: result.user!.user_type,
        status: result.user!.status,
        phone: result.user!.phone,
      };

      return NextResponse.json(
        {
          success: true,
          message: result.message,
          user: userResponse,
        },
        { status: 200 }
      );
    } else {
      console.log('❌ Falha no login via API:', result.error);
      
      // Determinar status code baseado no tipo de erro
      let statusCode = 401; // Unauthorized por padrão
      
      if (result.error?.includes('Usuário não encontrado')) {
        statusCode = 404; // Not Found
      } else if (result.error?.includes('Email inválido')) {
        statusCode = 422; // Unprocessable Entity
      } else if (result.error?.includes('Muitas tentativas')) {
        statusCode = 429; // Too Many Requests
      } else if (result.error?.includes('Erro de conexão')) {
        statusCode = 503; // Service Unavailable
      }

      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: statusCode }
      );
    }

  } catch (error) {
    console.error('❌ Erro interno na API de login:', error);
    
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
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}