// src/lib/firebase/admin.ts
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getStorage, Storage } from 'firebase-admin/storage';

// Função para inicializar Firebase Admin de forma segura
function initializeFirebaseAdmin(): App {
  try {
    // Verificar se já existe uma instância inicializada
    if (getApps().length > 0) {
      return getApps()[0];
    }

    console.log('🔑 Inicializando Firebase Admin...');

    // Tentar usar variáveis de ambiente primeiro
    const projectId = process.env.FIREBASE_PROJECT_ID || 'zip-food-delivery-f5b4f';
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    console.log('🔍 Debug - Variáveis de ambiente:');
    console.log('- FIREBASE_PROJECT_ID:', projectId);
    console.log('- FIREBASE_CLIENT_EMAIL:', clientEmail ? 'DEFINIDO' : 'NÃO DEFINIDO');
    console.log('- FIREBASE_PRIVATE_KEY:', privateKey ? 'DEFINIDO' : 'NÃO DEFINIDO');

    if (clientEmail && privateKey) {
      console.log('📝 Usando credenciais das variáveis de ambiente');
      
      // Limpar e formatar a chave privada
      const formattedPrivateKey = privateKey
        .replace(/\\n/g, '\n')
        .replace(/"/g, '')
        .trim();

      return initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey: formattedPrivateKey,
        }),
        projectId,
        storageBucket: `${projectId}.firebasestorage.app`,
      });
    } else {
      console.log('❌ Variáveis de ambiente não encontradas, tentando arquivo JSON...');

      // Fallback para arquivo JSON - comentado pois o arquivo não existe
      // const serviceAccount = require('../../../zip-food-delivery-f5b4f-firebase-adminsdk-fbsvc-5d1ee4728d.json');
      
      // Se chegou aqui, não há credenciais válidas
      throw new Error('Credenciais do Firebase Admin SDK não encontradas. Configure as variáveis de ambiente FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL e FIREBASE_PRIVATE_KEY.');
    }
  } catch (error) {
    console.error('❌ Erro ao inicializar Firebase Admin:', error);
    throw new Error('Falha na inicialização do Firebase Admin');
  }
}

// Inicializar Firebase Admin
const adminApp = initializeFirebaseAdmin();

// Função para obter Auth Admin com tratamento de erro
function getFirebaseAdminAuth(): Auth {
  try {
    return getAuth(adminApp);
  } catch (error) {
    console.error('Erro ao obter Firebase Admin Auth:', error);
    throw new Error('Falha ao acessar Firebase Admin Auth');
  }
}

// Função para obter Firestore Admin com tratamento de erro
function getFirebaseAdminFirestore(): Firestore {
  try {
    return getFirestore(adminApp);
  } catch (error) {
    console.error('Erro ao obter Firebase Admin Firestore:', error);
    throw new Error('Falha ao acessar Firebase Admin Firestore');
  }
}

// Função para obter Storage Admin com tratamento de erro
function getFirebaseAdminStorage(): Storage {
  try {
    return getStorage(adminApp);
  } catch (error) {
    console.error('Erro ao obter Firebase Admin Storage:', error);
    throw new Error('Falha ao acessar Firebase Admin Storage');
  }
}

// Exportar serviços do Firebase Admin
export const adminAuth = getFirebaseAdminAuth();
export const adminDb = getFirebaseAdminFirestore();
export const adminStorage = getFirebaseAdminStorage();
export { adminApp };

// Função utilitária para verificar se o Admin está configurado corretamente
export function isAdminConfigured(): boolean {
  try {
    return !!adminAuth && !!adminDb;
  } catch {
    return false;
  }
}

export default adminApp;