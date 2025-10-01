// src/lib/firebase-admin.ts
// Configuração real do Firebase Admin SDK

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Configuração do Firebase Admin
const firebaseAdminConfig = {
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }),
  projectId: process.env.FIREBASE_PROJECT_ID,
};

// Inicializar Firebase Admin apenas uma vez
let adminApp;
if (!getApps().length) {
  try {
    adminApp = initializeApp(firebaseAdminConfig);
    console.log('✅ Firebase Admin inicializado com sucesso');
  } catch (error) {
    console.error('❌ Erro ao inicializar Firebase Admin:', error);
    // Em caso de erro, usar configuração mockada para desenvolvimento
    console.log('⚠️ Usando configuração mockada para desenvolvimento');
  }
} else {
  adminApp = getApps()[0];
}

// Exportar instâncias dos serviços Firebase Admin
export const adminAuth = adminApp ? getAuth(adminApp) : null;
export const adminDb = adminApp ? getFirestore(adminApp) : null;

// Fallback para desenvolvimento se Firebase Admin não estiver configurado
if (!adminAuth || !adminDb) {
  console.warn('⚠️ Firebase Admin não configurado - usando mocks para desenvolvimento');
  
  // Mock básico para desenvolvimento
  const createMockQuery = (): any => ({
    get: () => Promise.resolve({ 
      docs: [], 
      empty: true,
      size: 0
    }),
    where: (...args: any[]) => createMockQuery(),
    limit: (...args: any[]) => createMockQuery(),
    orderBy: (...args: any[]) => createMockQuery(),
  });

  export const mockAdminDb = {
    collection: (name: string) => ({
      get: () => Promise.resolve({
        docs: [],
        empty: true,
        size: 0
      }),
      doc: (id?: string) => ({
        id: id || 'mock-doc-id',
        get: () => Promise.resolve({ 
          exists: false,
          id: id || 'mock-doc-id',
          data: () => null
        }),
        set: () => Promise.resolve(),
        update: (...args: any[]) => Promise.resolve(),
        delete: () => Promise.resolve(),
      }),
      add: (...args: any[]) => Promise.resolve({ 
        id: 'mock-id',
        get: () => Promise.resolve({ 
          id: 'mock-id', 
          data: () => ({})
        })
      }),
      where: (...args: any[]) => createMockQuery(),
    }),
    batch: () => ({
      delete: (...args: any[]) => {},
      update: (...args: any[]) => {},
      set: (...args: any[]) => {},
      commit: () => Promise.resolve(),
    }),
  };

  export const mockAdminAuth = {
    verifyIdToken: (token: string) => {
      console.warn('⚠️ Mock verifyIdToken chamado - Firebase Admin não configurado');
      return Promise.reject(new Error('Firebase Admin não configurado'));
    },
    createCustomToken: () => Promise.reject(new Error('Firebase Admin não configurado')),
    setCustomUserClaims: () => Promise.reject(new Error('Firebase Admin não configurado')),
    createSessionCookie: () => Promise.reject(new Error('Firebase Admin não configurado')),
    verifySessionCookie: () => Promise.reject(new Error('Firebase Admin não configurado')),
    getUser: () => Promise.reject(new Error('Firebase Admin não configurado')),
  };

  // Usar mocks se Firebase Admin não estiver disponível
  export const adminDb = mockAdminDb;
  export const adminAuth = mockAdminAuth;
}