import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, initializeFirestore, persistentLocalCache, persistentSingleTabManager, memoryLocalCache, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { Firestore } from 'firebase/firestore';

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAkECfPgG5p2lPnRbXM-8JqXUBDMMiO2PU",
  authDomain: "zippzipp-4f532.firebaseapp.com",
  projectId: "zippzipp-4f532",
  storageBucket: "zippzipp-4f532.firebasestorage.app",
  messagingSenderId: "211604078790",
  appId: "1:211604078790:web:ba245e4c6a03f4c39e97c7",
  measurementId: "G-KESSPNE0J2"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Configuração ultra-otimizada do Firestore para evitar erros WebChannel
let db: any;

try {
  if (process.env.NODE_ENV === 'development') {
    // Configuração específica para desenvolvimento - evita completamente os erros WebChannel
    db = initializeFirestore(app, {
      localCache: memoryLocalCache(),
      experimentalForceLongPolling: true, // Força long polling
      ignoreUndefinedProperties: true
    });
    
    // Desabilitar listeners automáticos em desenvolvimento
    console.log('🔥 Firebase configurado para desenvolvimento com long polling');
  } else {
    // Produção: configuração otimizada mas com cache persistente
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({
        cacheSizeBytes: 50 * 1024 * 1024 // 50MB
      })
    });
  }
} catch (error) {
  console.warn('Erro ao inicializar Firestore otimizado, usando configuração mínima:', error);
  
  // Fallback ultra-simples para evitar qualquer erro
  try {
    db = initializeFirestore(app, {
      localCache: memoryLocalCache(),
      experimentalForceLongPolling: true
    });
  } catch (fallbackError) {
    console.warn('Usando configuração básica do Firestore:', fallbackError);
    db = getFirestore(app);
  }
}

export { db };

// Exporta os serviços do Firebase
export const auth = getAuth(app);
export const storage = getStorage(app);

export default app;