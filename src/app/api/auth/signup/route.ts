// src/app/api/auth/signup/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';

// Tipos
export type UserType = 'customer' | 'restaurant' | 'delivery_driver';

export interface SignUpData {
  email: string;
  password: string;
  name: string;
  user_type: UserType;
  phone?: string;
}

export interface UserData {
  id: string;
  email: string;
  name: string;
  user_type: UserType;
  phone?: string;
  status: 'active' | 'inactive' | 'pending';
  created_at: any;
  updated_at: any;
}

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

    // --- LÓGICA DE CADASTRO COM ADMIN SDK ---

    // 1. Criar usuário no Firebase Auth com Admin SDK
    console.log('📝 Criando usuário no Firebase Auth (Admin)...');
    const userRecord = await adminAuth.createUser({
      email: signUpData.email,
      password: signUpData.password,
      displayName: signUpData.name,
    });
    console.log('✅ Usuário criado no Firebase Auth:', userRecord.uid);

    // 2. Preparar dados para o Firestore
    const userData: UserData = {
      id: userRecord.uid,
      email: userRecord.email || '',
      name: signUpData.name,
      user_type: signUpData.user_type,
      phone: signUpData.phone || '',
      status: 'active',
      created_at: Timestamp.now(),
      updated_at: Timestamp.now(),
    };

    // 3. Criar documentos no Firestore com Admin SDK
    console.log('📄 Criando documentos no Firestore (Admin)...');
    const userDocRef = adminDb.collection('users').doc(userRecord.uid);
    const userTypeDocRef = adminDb.collection(`${signUpData.user_type}s`).doc(userRecord.uid);
    
    const batch = adminDb.batch();
    
    batch.set(userDocRef, userData);
    batch.set(userTypeDocRef, createUserTypeData(userRecord.uid, signUpData.user_type, userData));
    
    await batch.commit();
    console.log('✅ Documentos criados com sucesso no Firestore');

    console.log('✅ Cadastro realizado com sucesso via API');
    return NextResponse.json(
      {
        success: true,
        message: 'Usuário cadastrado com sucesso!',
        user: {
          id: userData.id,
          email: userData.email,
          name: userData.name,
          user_type: userData.user_type,
          status: userData.status,
        },
      },
      { status: 201 }
    );

  } catch (error: any) {
    console.error('❌ Erro interno na API de cadastro:', error);
    
    // Tratamento específico de erros do Firebase Admin SDK
    if (error.code === 'auth/email-already-exists') {
      return NextResponse.json(
        {
          success: false,
          error: 'Este email já está sendo usado por outra conta.',
        },
        { status: 409 }
      );
    }
    
    if (error.code === 'auth/invalid-password') {
      return NextResponse.json(
        {
          success: false,
          error: 'A senha é muito fraca. Use pelo menos 6 caracteres.',
        },
        { status: 422 }
      );
    }
    
    return NextResponse.json(
      {
        success: false,
        error: 'Ocorreu um erro inesperado durante o cadastro.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

// Função auxiliar para criar os dados específicos de cada tipo de usuário
function createUserTypeData(uid: string, userType: UserType, userData: UserData): any {
  const now = Timestamp.now();
  const baseData = {
    user_id: uid,
    email: userData.email,
    name: userData.name,
    phone: userData.phone || '',
    created_at: now,
    updated_at: now,
  };

  switch (userType) {
    case 'customer':
      return {
        ...baseData,
        addresses: [],
        preferences: {},
      };
    case 'restaurant':
      return {
        ...baseData,
        address: '',
        cuisine_type: '',
        description: '',
        status: 'pending',
        rating: 0,
        total_reviews: 0,
        menu_items: [],
        operating_hours: {},
      };
    case 'delivery_driver':
      return {
        ...baseData,
        vehicle_type: '',
        license_plate: '',
        status: 'pending',
        rating: 0,
        total_deliveries: 0,
        current_location: null,
        is_available: false,
      };
    default:
      return baseData;
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