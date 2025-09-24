// src/app/api/auth/session/route.ts
// API Route para gerenciar cookies de sessão Firebase

import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json(
        { error: 'Token ID é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar o ID token
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    
    // Criar cookie de sessão (válido por 5 dias)
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 dias em ms
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

    // Configurar cookie
    const cookieStore = cookies();
    cookieStore.set('session', sessionCookie, {
      maxAge: expiresIn / 1000, // em segundos
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    console.log('✅ [Session API] Cookie de sessão criado para usuário:', decodedToken.uid);

    return NextResponse.json({
      success: true,
      message: 'Sessão criada com sucesso'
    });

  } catch (error: any) {
    console.error('❌ [Session API] Erro ao criar sessão:', error);
    
    return NextResponse.json(
      { error: 'Erro ao criar sessão' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    // Remover cookie de sessão
    const cookieStore = cookies();
    cookieStore.delete('session');

    console.log('✅ [Session API] Cookie de sessão removido');

    return NextResponse.json({
      success: true,
      message: 'Sessão removida com sucesso'
    });

  } catch (error: any) {
    console.error('❌ [Session API] Erro ao remover sessão:', error);
    
    return NextResponse.json(
      { error: 'Erro ao remover sessão' },
      { status: 500 }
    );
  }
}