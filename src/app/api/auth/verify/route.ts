// src/app/api/auth/verify/route.ts
// API route para verificação de autenticação e papel do usuário

import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';

export async function POST(request: NextRequest) {
  try {
    const { sessionCookie } = await request.json();
    
    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Token de sessão não fornecido' },
        { status: 401 }
      );
    }

    // Verificar token de sessão
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
    const uid = decodedClaims.uid;

    // Buscar papel do usuário no Firestore
    const userDoc = await adminDb.collection('users').doc(uid).get();
    
    if (!userDoc.exists) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    const userData = userDoc.data();
    const userRole = userData?.role;

    if (!userRole || !['customer', 'restaurant'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Papel de usuário inválido' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      uid,
      role: userRole,
      userData
    });

  } catch (error) {
    console.error('❌ [Auth Verify] Erro ao verificar autenticação:', error);
    return NextResponse.json(
      { error: 'Token inválido ou expirado' },
      { status: 401 }
    );
  }
}