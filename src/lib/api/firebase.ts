import { adminAuth, adminDb, adminStorage } from '@/lib/firebase/admin';

// Configuração do Firebase Admin para uso no servidor
// Este cliente tem privilégios administrativos e deve ser usado apenas no backend

// Exporta os serviços do Firebase Admin
export const firebaseAdmin = {
  auth: adminAuth,
  db: adminDb,
  storage: adminStorage
};

// Exporta individualmente para compatibilidade
export const auth = adminAuth;
export const db = adminDb;
export const storage = adminStorage;

export default firebaseAdmin;