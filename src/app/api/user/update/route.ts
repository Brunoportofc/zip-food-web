// src/app/api/user/update/route.ts
// API para atualizar dados do usuário no Firestore

import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { debugRequestCookies } from '@/utils/debug-cookies';
import { getSessionCookieFromRequest } from '@/utils/session-utils';

interface UpdateUserRequest {
  userData: {
    displayName?: string;
    phone?: string;
  };
}

export async function PUT(request: NextRequest) {
  try {
    const { userData }: UpdateUserRequest = await request.json();
    
    // Debug: verificar cookies da requisição
    console.log('🔍 [API Update User] Verificando cookies da requisição...');
    debugRequestCookies(request);
    
    // Obter cookie de sessão usando função robusta
    const sessionCookie = await getSessionCookieFromRequest(request);
    
    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Sessão não encontrada. Faça login novamente.' },
        { status: 401 }
      );
    }

    console.log('🔄 [API Update User] Cookie de sessão encontrado:', {
      cookieLength: sessionCookie.length,
      timestamp: new Date().toISOString()
    });

    // Verificar token de sessão
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
    const uid = decodedClaims.uid;

    console.log('🔄 [API Update User] Atualizando dados do usuário:', {
      uid: uid.substring(0, 8) + '...',
      userData,
      timestamp: new Date().toISOString()
    });

    // Preparar dados para atualização
    const updateData: any = {
      updatedAt: new Date()
    };

    if (userData.displayName !== undefined) {
      updateData.displayName = userData.displayName.trim();
    }

    if (userData.phone !== undefined) {
      updateData.phone = userData.phone.trim();
    }

    // Atualizar no Firestore
    await adminDb.collection('users').doc(uid).update(updateData);

    console.log('✅ [API Update User] Dados atualizados com sucesso:', {
      uid: uid.substring(0, 8) + '...',
      updatedFields: Object.keys(updateData),
      timestamp: new Date().toISOString()
    });

    // Buscar dados atualizados
    const updatedDoc = await adminDb.collection('users').doc(uid).get();
    const updatedUserData = updatedDoc.data();

    return NextResponse.json({
      success: true,
      message: 'Dados atualizados com sucesso',
      userData: updatedUserData
    });

  } catch (error) {
    console.error('❌ [API Update User] Erro ao atualizar usuário:', error);
    
    if (error instanceof Error && error.message.includes('auth/id-token-expired')) {
      return NextResponse.json(
        { error: 'Sessão expirada' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
