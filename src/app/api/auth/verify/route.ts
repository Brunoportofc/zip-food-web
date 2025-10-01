// src/app/api/auth/verify/route.ts
// API route para verificação de autenticação e papel do usuário

import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';

export async function POST(request: NextRequest) {
  // [FASE 4 - LOG 1] Requisição recebida na API de verificação
  console.log('[API_VERIFY] 🚀 Requisição de verificação recebida', {
    method: request.method,
    url: request.url,
    timestamp: new Date().toISOString()
  });

  try {
    // ✨ CORREÇÃO: Verificar se o Firebase Admin está disponível
    if (!adminAuth || !adminDb) {
      console.warn('⚠️ [API_VERIFY] Firebase Admin não disponível');
      return NextResponse.json({
        success: false,
        error: 'Firebase Admin não configurado',
        fallback: true
      }, { status: 503 });
    }
    const { sessionCookie } = await request.json();
    
    // [FASE 4 - LOG 2] Dados recebidos
    console.log('[API_VERIFY] 📋 Dados recebidos:', {
      hasSessionCookie: !!sessionCookie,
      cookieLength: sessionCookie?.length || 0,
      cookiePreview: sessionCookie ? sessionCookie.substring(0, 20) + '...' : 'N/A',
      timestamp: new Date().toISOString()
    });
    
    if (!sessionCookie) {
      // [FASE 4 - LOG 3] Token não fornecido
      console.error('[API_VERIFY] ❌ Token de sessão não fornecido', {
        timestamp: new Date().toISOString()
      });
      return NextResponse.json(
        { error: 'Token de sessão não fornecido' },
        { status: 401 }
      );
    }

    // [FASE 4 - LOG 4] Verificando token de sessão
    console.log('[API_VERIFY] 🔍 Verificando token de sessão com Firebase Admin...', {
      timestamp: new Date().toISOString()
    });

    // Verificar token de sessão
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie);
    const uid = decodedClaims.uid;

    // [FASE 4 - LOG 5] Token verificado com sucesso - incluindo custom claims
    console.log('[API_VERIFY] ✅ Token verificado com sucesso:', {
      uid,
      iss: decodedClaims.iss,
      aud: decodedClaims.aud,
      exp: new Date(decodedClaims.exp * 1000).toISOString(),
      customClaims: {
        hasRestaurant: decodedClaims.hasRestaurant || false,
        restaurantId: decodedClaims.restaurantId || null
      },
      timestamp: new Date().toISOString()
    });

    // [FASE 4 - LOG 6] Buscando dados do usuário no Firestore
    console.log('[API_VERIFY] 🔍 Buscando dados do usuário no Firestore...', {
      uid,
      timestamp: new Date().toISOString()
    });

    // Buscar papel do usuário no Firestore
    const userDoc = await adminDb.collection('users').doc(uid).get();
    
    if (!userDoc.exists) {
      // [FASE 4 - LOG 7] Usuário não encontrado
      console.error('[API_VERIFY] ❌ Usuário não encontrado no Firestore:', {
        uid,
        timestamp: new Date().toISOString()
      });
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    const userData = userDoc.data();
    const userRole = userData?.role;

    // [FASE 4 - LOG 8] Dados do usuário obtidos
    console.log('[API_VERIFY] 📋 Dados do usuário obtidos do Firestore:', {
      uid,
      role: userRole,
      user_type: userData?.user_type,
      displayName: userData?.displayName,
      email: userData?.email,
      hasAllRequiredFields: !!(userData?.role && userData?.email),
      timestamp: new Date().toISOString()
    });

    if (!userRole || !['customer', 'restaurant', 'delivery'].includes(userRole)) {
      // [FASE 4 - LOG 9] Papel de usuário inválido
      console.error('[API_VERIFY] ❌ Papel de usuário inválido:', {
        uid,
        role: userRole,
        validRoles: ['customer', 'restaurant', 'delivery'],
        timestamp: new Date().toISOString()
      });
      return NextResponse.json(
        { error: 'Papel de usuário inválido' },
        { status: 403 }
      );
    }

    // [FASE 4 - LOG 10] Verificação bem-sucedida
    console.log('[API_VERIFY] ✅ VERIFICAÇÃO BEM-SUCEDIDA! Retornando dados:', {
      uid,
      role: userRole,
      success: true,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      uid,
      role: userRole,
      userData,
      customClaims: {
        hasRestaurant: decodedClaims.hasRestaurant || false,
        restaurantId: decodedClaims.restaurantId || null
      }
    });

  } catch (error) {
    // [FASE 4 - LOG 11] Erro durante verificação
    console.error('[API_VERIFY] 💥 ERRO durante verificação:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    return NextResponse.json(
      { error: 'Token inválido ou expirado' },
      { status: 401 }
    );
  }
}
