// src/app/api/auth/signup/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { authService, SignUpData } from '@/services/auth.service';

// Force Node.js runtime for Firebase Admin SDK
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    console.log('📝 API: Recebida solicitação de cadastro');

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
    let body: SignUpData;
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
    const requiredFields = ['email', 'password', 'name', 'user_type'];
    const missingFields = requiredFields.filter(field => !body[field as keyof SignUpData]);

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Campos obrigatórios ausentes: ${missingFields.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Validar tipo de usuário
    const validUserTypes = ['customer', 'restaurant', 'delivery_driver'];
    if (!validUserTypes.includes(body.user_type)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Tipo de usuário inválido. Deve ser: customer, restaurant ou delivery_driver',
        },
        { status: 400 }
      );
    }

    // Sanitizar dados
    const signUpData: SignUpData = {
      email: body.email.toLowerCase().trim(),
      password: body.password,
      name: body.name.trim(),
      user_type: body.user_type,
      phone: body.phone?.trim() || '',
    };

    console.log('🔍 Dados validados:', {
      email: signUpData.email,
      name: signUpData.name,
      user_type: signUpData.user_type,
      hasPhone: !!signUpData.phone,
    });

    // Executar cadastro
    const result = await authService.signUp(signUpData);

    if (result.success) {
      console.log('✅ Cadastro realizado com sucesso via API');
      return NextResponse.json(
        {
          success: true,
          message: result.message,
          user: {
            id: result.user!.id,
            email: result.user!.email,
            name: result.user!.name,
            user_type: result.user!.user_type,
            status: result.user!.status,
          },
        },
        { status: 201 }
      );
    } else {
      console.log('❌ Falha no cadastro via API:', result.error);
      
      // Determinar status code baseado no tipo de erro
      let statusCode = 400;
      if (result.error?.includes('já está sendo usado') || result.error?.includes('já está cadastrado')) {
        statusCode = 409; // Conflict
      } else if (result.error?.includes('senha é muito fraca')) {
        statusCode = 422; // Unprocessable Entity
      } else if (result.error?.includes('Email inválido')) {
        statusCode = 422; // Unprocessable Entity
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
    console.error('❌ Erro interno na API de cadastro:', error);
    
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