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

    console.log('🔄 [Session API] Verificando ID token...');

    // Verificar o ID token
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    console.log('✅ [Session API] Token verificado para usuário:', decodedToken.uid);
    
    // Criar cookie de sessão (válido por 5 dias)
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 dias em ms
    
    console.log('🔄 [Session API] Criando cookie de sessão...');
    
    // Tentar criar o cookie de sessão
    let sessionCookie;
    try {
      sessionCookie = await adminAuth.createSessionCookie(idToken, { 
        expiresIn: expiresIn / 1000 // Firebase espera em segundos, não milissegundos
      });
      console.log('✅ [Session API] Cookie de sessão criado com sucesso');
    } catch (cookieError: any) {
      console.error('❌ [Session API] Erro ao criar cookie de sessão:', cookieError);
      
      // Se falhar ao criar cookie, ainda assim retornar sucesso
      // O usuário ficará logado apenas no client-side
      return NextResponse.json({
        success: true,
        message: 'Login realizado (sem cookie de sessão)',
        warning: 'Cookie de sessão não pôde ser criado'
      });
    }

    // Configurar cookie
    const cookieStore = await cookies();
    cookieStore.set('session', sessionCookie, {
      maxAge: expiresIn / 1000, // em segundos
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    console.log('✅ [Session API] Cookie de sessão configurado para usuário:', decodedToken.uid);

    return NextResponse.json({
      success: true,
      message: 'Sessão criada com sucesso'
    });

  } catch (error: any) {
    console.error('❌ [Session API] Erro ao criar sessão:', error);
    console.error('❌ [Session API] Detalhes do erro:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    
    return NextResponse.json(
      { 
        error: 'Erro ao criar sessão',
        details: error.message 
      },
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