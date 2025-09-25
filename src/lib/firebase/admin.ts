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

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: requiredEnvVars.FIREBASE_PROJECT_ID,
        clientEmail: requiredEnvVars.FIREBASE_CLIENT_EMAIL,
        privateKey: requiredEnvVars.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
      projectId: requiredEnvVars.FIREBASE_PROJECT_ID,
    });
    
    console.log('✅ Firebase Admin SDK inicializado com sucesso');
  } catch (error) {
    console.error('❌ Erro ao inicializar Firebase Admin SDK:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    throw new Error('Falha na inicialização do Firebase Admin SDK');
  }
}

// Exportar instâncias dos serviços Firebase Admin
export const adminAuth = admin.auth();
export const adminDb = admin.firestore();

export default admin;