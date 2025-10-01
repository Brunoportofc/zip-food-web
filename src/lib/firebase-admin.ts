// src/lib/firebase-admin.ts
// Configuração do Firebase Admin SDK com fallback para mocks

// Tipos para os mocks
interface MockDecodedToken {
  uid: string;
  iss: string;
  aud: string;
  exp: number;
  email?: string;
}

interface MockUserRecord {
  uid: string;
  customClaims?: Record<string, any>;
}

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

const mockAdminDb = {
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

const mockAdminAuth = {
  verifyIdToken: (token: string): Promise<MockDecodedToken> => {
    console.warn('⚠️ Mock verifyIdToken chamado - Firebase Admin não configurado');
    return Promise.reject(new Error('Firebase Admin não configurado'));
  },
  createCustomToken: () => Promise.reject(new Error('Firebase Admin não configurado')),
  setCustomUserClaims: () => Promise.reject(new Error('Firebase Admin não configurado')),
  createSessionCookie: () => Promise.reject(new Error('Firebase Admin não configurado')),
  verifySessionCookie: () => Promise.reject(new Error('Firebase Admin não configurado')),
  getUser: (): Promise<MockUserRecord> => Promise.reject(new Error('Firebase Admin não configurado')),
};

// Tentar carregar Firebase Admin apenas no servidor
let adminAuth: any = mockAdminAuth;
let adminDb: any = mockAdminDb;

if (typeof window === 'undefined') {
  try {
    const { initializeApp, getApps, cert } = require('firebase-admin/app');
    const { getAuth } = require('firebase-admin/auth');
    const { getFirestore } = require('firebase-admin/firestore');

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
        console.log('⚠️ Usando configuração mockada para desenvolvimento');
      }
    } else {
      adminApp = getApps()[0];
    }

    // Usar instâncias reais se disponíveis
    if (adminApp) {
      adminAuth = getAuth(adminApp);
      adminDb = getFirestore(adminApp);
    }
  } catch (error) {
    console.error('❌ Erro ao carregar Firebase Admin:', error);
    console.log('⚠️ Usando mocks devido ao erro');
  }
} else {
  console.warn('⚠️ Firebase Admin sendo usado no cliente - usando mocks');
}

export { adminAuth, adminDb };