// src/lib/firebase/admin.ts
// Configuração do Firebase Admin SDK para o lado do servidor (API Routes, Middleware)

import admin from 'firebase-admin';

// Verificar se o Firebase Admin já foi inicializado
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
      projectId: process.env.FIREBASE_PROJECT_ID,
    });
    
    console.log('✅ Firebase Admin SDK inicializado com sucesso');
  } catch (error) {
    console.error('❌ Erro ao inicializar Firebase Admin SDK:', error);
    throw new Error('Falha na inicialização do Firebase Admin SDK');
  }
}

// Exportar instâncias dos serviços Firebase Admin
export const adminAuth = admin.auth();
export const adminDb = admin.firestore();

export default admin;