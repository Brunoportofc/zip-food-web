// src/lib/firebase/config.ts
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

// Configuração do Firebase usando variáveis de ambiente
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyAkECfPgG5p2lPnRbXM-8JqXUBDMMiO2PU",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "zip-food-delivery-f5b4f.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "zip-food-delivery-f5b4f",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "zip-food-delivery-f5b4f.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "211604078790",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:211604078790:web:ba245e4c6a03f4c39e97c7",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-KESSPNE0J2"
};

// Função para inicializar Firebase de forma segura
function initializeFirebase(): FirebaseApp {
  try {
    // Verificar se já existe uma instância inicializada
    if (getApps().length > 0) {
      return getApps()[0];
    }
    
    // Inicializar nova instância
    return initializeApp(firebaseConfig);
  } catch (error) {
    console.error('Erro ao inicializar Firebase:', error);
    throw new Error('Falha na inicialização do Firebase');
  }
}

// Inicializar Firebase
const app = initializeFirebase();

// Função para obter Auth com tratamento de erro
function getFirebaseAuth(): Auth {
  try {
    const auth = getAuth(app);
    return auth;
  } catch (error) {
    console.error('Erro ao obter Firebase Auth:', error);
    throw new Error('Falha ao acessar Firebase Auth');
  }
}

// Função para obter Firestore com tratamento de erro
function getFirebaseFirestore(): Firestore {
  try {
    const firestore = getFirestore(app);
    return firestore;
  } catch (error) {
    console.error('Erro ao obter Firestore:', error);
    throw new Error('Falha ao acessar Firestore');
  }
}

// Função para obter Storage com tratamento de erro
function getFirebaseStorage(): FirebaseStorage {
  try {
    return getStorage(app);
  } catch (error) {
    console.error('Erro ao obter Firebase Storage:', error);
    throw new Error('Falha ao acessar Firebase Storage');
  }
}

// Exportar serviços do Firebase
export const auth = getFirebaseAuth();
export const db = getFirebaseFirestore();
export const storage = getFirebaseStorage();
export const firebaseApp = app;

// Exportar configuração para uso em testes
export { firebaseConfig };

export default app;