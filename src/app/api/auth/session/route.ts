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

    // ✨ CORREÇÃO: Verificar se o Firebase Admin está disponível
    if (!adminAuth) {
      console.warn('⚠️ [Session API] Firebase Admin não disponível, retornando sucesso sem cookie');
      return NextResponse.json({
        success: true,
        message: 'Login realizado (modo client-side)',
        warning: 'Firebase Admin não configurado - usando autenticação client-side'
      });
    }

    // Verificar o ID token
    const decodedToken = await adminAuth.verifyIdToken();
    console.log('✅ [Session API] Token verificado para usuário:', decodedToken.uid);
    
    // Criar cookie de sessão (válido por 5 dias)
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 dias em ms
    
    console.log('🔄 [Session API] Criando cookie de sessão...');
    
    // Tentar criar o cookie de sessão
    let sessionCookie;
    try {
      sessionCookie = await adminAuth.createSessionCookie();
      console.log('✅ [Session API] Cookie de sessão criado com sucesso');
    } catch (cookieError: any) {
      console.error('❌ [Session API] Erro ao criar cookie de sessão:', cookieError);
      
      // ✨ CORREÇÃO: Retornar sucesso mesmo sem cookie para não bloquear o login
      return NextResponse.json({
        success: true,
        message: 'Login realizado (sem cookie de sessão)',
        warning: 'Cookie de sessão não pôde ser criado - usando autenticação client-side'
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
    const cookieStore = await cookies();
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
