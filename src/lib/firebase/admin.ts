// src/lib/firebase/admin.ts
// Configuração do Firebase Admin SDK para o lado do servidor (API Routes, Middleware)

import admin from 'firebase-admin';

// Verificar se o Firebase Admin já foi inicializado
if (!admin.apps.length) {
  try {
    // [DIAGNÓSTICO] Verificar se as variáveis de ambiente estão definidas
    const requiredEnvVars = {
      FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
      FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
      FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY
    };

    console.log('🔍 [Firebase Admin] Verificando variáveis de ambiente:', {
      FIREBASE_PROJECT_ID: !!requiredEnvVars.FIREBASE_PROJECT_ID,
      FIREBASE_CLIENT_EMAIL: !!requiredEnvVars.FIREBASE_CLIENT_EMAIL,
      FIREBASE_PRIVATE_KEY: !!requiredEnvVars.FIREBASE_PRIVATE_KEY,
      privateKeyLength: requiredEnvVars.FIREBASE_PRIVATE_KEY?.length || 0
    });

    // Verificar se todas as variáveis necessárias estão presentes
    const missingVars = Object.entries(requiredEnvVars)
      .filter(([key, value]) => !value)
      .map(([key]) => key);

    if (missingVars.length > 0) {
      throw new Error(`Variáveis de ambiente ausentes: ${missingVars.join(', ')}`);
    }

    // ✨ CORREÇÃO: Melhorar tratamento da private key
    let privateKey = requiredEnvVars.FIREBASE_PRIVATE_KEY;
    
    console.log('🔍 [Firebase Admin] Private key original (primeiros 100 chars):', privateKey?.substring(0, 100));
    
    // Remover aspas extras se existirem (incluindo aspas duplas que envolvem toda a string)
    if (privateKey?.startsWith('"') && privateKey?.endsWith('"')) {
      privateKey = privateKey.slice(1, -1);
      console.log('🔧 [Firebase Admin] Removidas aspas externas da private key');
    }
    
    // Se a chave privada estiver em formato JSON string, extrair apenas a chave
    if (privateKey?.startsWith('{')) {
      try {
        const keyObject = JSON.parse(privateKey);
        privateKey = keyObject.private_key || privateKey;
        console.log('🔧 [Firebase Admin] Extraída private key de objeto JSON');
      } catch (e) {
        console.warn('⚠️ [Firebase Admin] Não foi possível parsear private key como JSON, usando valor original');
      }
    }
    
    // Normalizar quebras de linha - garantir que \\n seja convertido para \n
    const originalLength = privateKey?.length || 0;
    privateKey = privateKey?.replace(/\\n/g, '\n');
    if (privateKey?.length !== originalLength) {
      console.log('🔧 [Firebase Admin] Quebras de linha normalizadas (\\n -> \n)');
    }
    
    // Verificar se a chave privada tem o formato correto
    if (!privateKey?.includes('-----BEGIN PRIVATE KEY-----')) {
      console.error('❌ [Firebase Admin] Private key não tem formato válido - faltando header');
      console.log('🔍 [Firebase Admin] Private key processada (primeiros 100 chars):', privateKey?.substring(0, 100));
    } else {
      console.log('✅ [Firebase Admin] Private key tem formato válido');
    }
    
    // Verificar se tem o footer também
    if (!privateKey?.includes('-----END PRIVATE KEY-----')) {
      console.error('❌ [Firebase Admin] Private key não tem formato válido - faltando footer');
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: requiredEnvVars.FIREBASE_PROJECT_ID,
        clientEmail: requiredEnvVars.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey,
      }),
      projectId: requiredEnvVars.FIREBASE_PROJECT_ID,
    });
    
    console.log('✅ Firebase Admin SDK inicializado com sucesso');
  } catch (error) {
    console.error('❌ Erro ao inicializar Firebase Admin SDK:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    // ✨ CORREÇÃO: Não lançar erro fatal, permitir que a aplicação continue
    console.warn('⚠️ [Firebase Admin] Continuando sem Firebase Admin SDK - funcionalidades de sessão limitadas');
  }
}

// Exportar instâncias dos serviços Firebase Admin
// ✨ CORREÇÃO: Verificar se o admin foi inicializado antes de exportar
export const adminAuth = admin.apps.length > 0 ? admin.auth() : null;
export const adminDb = admin.apps.length > 0 ? admin.firestore() : null;

// Função helper para verificar session cookies
export async function verifySessionCookie(sessionCookie: string) {
  if (!adminAuth) {
    throw new Error('Firebase Admin Auth não está inicializado');
  }
  
  try {
    const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
    return decodedToken;
  } catch (error) {
    console.error('Erro ao verificar session cookie:', error);
    throw error;
  }
}

export default admin;