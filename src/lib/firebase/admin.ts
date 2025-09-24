// src/lib/firebase/admin.ts
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

// Função para inicializar Firebase Admin de forma segura
function initializeFirebaseAdmin(): App {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  console.log('🔑 Inicializando Firebase Admin...');
  
  // A melhor prática é usar variáveis de ambiente
  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID!,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
    privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
  };

  return initializeApp({
    credential: cert(serviceAccount),
    storageBucket: `${serviceAccount.projectId}.appspot.com`,
  });
}

const adminApp: App = initializeFirebaseAdmin();
const adminAuth: Auth = getAuth(adminApp);
const adminDb: Firestore = getFirestore(adminApp);

export { adminApp, adminAuth, adminDb };