// src/app/api/auth/create-user-profile/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { uid, email, name, user_type, phone } = body;

    // Validar dados obrigatórios
    if (!uid || !email || !name || !user_type) {
      return NextResponse.json(
        { error: 'Dados obrigatórios ausentes' },
        { status: 400 }
      );
    }

    console.log('📄 Criando perfil do usuário via Admin SDK:', uid);

    // Criar documento do usuário usando Admin SDK
    const userData = {
      id: uid,
      email,
      name,
      user_type,
      phone: phone || '',
      status: 'active',
      created_at: FieldValue.serverTimestamp(),
      updated_at: FieldValue.serverTimestamp(),
    };

    await adminDb.collection('users').doc(uid).set(userData);
    console.log('✅ Perfil do usuário criado com sucesso via Admin SDK');

    // Criar documento específico do tipo de usuário
    let specificCollection = '';
    switch (user_type) {
      case 'customer':
        specificCollection = 'customers';
        break;
      case 'restaurant':
        specificCollection = 'restaurants';
        break;
      case 'delivery':
        specificCollection = 'delivery_drivers';
        break;
      default:
        throw new Error(`Tipo de usuário inválido: ${user_type}`);
    }

    const specificData = {
      user_id: uid,
      email,
      name,
      phone: phone || '',
      status: user_type === 'restaurant' ? 'pending_approval' : 'active',
      created_at: FieldValue.serverTimestamp(),
      updated_at: FieldValue.serverTimestamp(),
    };

    await adminDb.collection(specificCollection).doc(uid).set(specificData);
    console.log(`✅ Documento criado na coleção ${specificCollection}`);

    return NextResponse.json({
      success: true,
      message: 'Perfil do usuário criado com sucesso',
      user: userData
    });

  } catch (error) {
    console.error('❌ Erro ao criar perfil do usuário:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}