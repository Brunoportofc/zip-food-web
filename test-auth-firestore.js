// test-auth-firestore.js
// Script para testar o fluxo completo: Auth + Firestore

const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword, updateProfile } = require('firebase/auth');
const { getFirestore, doc, setDoc, serverTimestamp } = require('firebase/firestore');

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAkECfPgG5p2lPnRbXM-8JqXUBDMMiO2PU",
  authDomain: "zip-food-delivery-f5b4f.firebaseapp.com",
  projectId: "zip-food-delivery-f5b4f",
  storageBucket: "zip-food-delivery-f5b4f.firebasestorage.app",
  messagingSenderId: "211604078790",
  appId: "1:211604078790:web:ba245e4c6a03f4c39e97c7",
  measurementId: "G-KESSPNE0J2"
};

async function testAuthAndFirestore() {
  try {
    console.log('🚀 Inicializando Firebase...');
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);
    
    console.log('✅ Firebase inicializado com sucesso');
    
    // Dados do usuário de teste
    const timestamp = Date.now();
    const userData = {
      email: `testuser${timestamp}@example.com`,
      password: 'password123',
      name: `Test User ${timestamp}`,
      user_type: 'customer',
      phone: '(11) 99999-9999'
    };
    
    console.log('📝 Criando usuário no Firebase Auth...');
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      userData.email,
      userData.password
    );
    
    const user = userCredential.user;
    console.log('✅ Usuário criado no Firebase Auth:', user.uid);
    
    // Atualizar perfil
    console.log('👤 Atualizando perfil do usuário...');
    await updateProfile(user, {
      displayName: userData.name,
    });
    
    // Aguardar um pouco para garantir que o usuário está autenticado
    console.log('⏳ Aguardando autenticação...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Verificar se o usuário ainda está autenticado
    if (!auth.currentUser) {
      throw new Error('Usuário não está autenticado');
    }
    
    console.log('🔐 Usuário autenticado:', auth.currentUser.uid);
    
    // Criar documento no Firestore
    console.log('📄 Criando documento do usuário no Firestore...');
    const firestoreUserData = {
      id: user.uid,
      email: user.email || '',
      name: userData.name,
      user_type: userData.user_type,
      phone: userData.phone,
      status: 'active',
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    };
    
    await setDoc(doc(db, 'users', user.uid), firestoreUserData);
    console.log('✅ Documento do usuário criado com sucesso');
    
    // Criar documento específico do tipo de usuário
    console.log('📄 Criando documento específico do tipo de usuário...');
    const customerData = {
      id: user.uid,
      email: user.email || '',
      name: userData.name,
      phone: userData.phone,
      address: '',
      preferences: {},
      order_history: [],
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    };
    
    await setDoc(doc(db, 'customers', user.uid), customerData);
    console.log('✅ Documento do customer criado com sucesso');
    
    console.log('🎉 Teste completo concluído com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
    console.error('Código do erro:', error.code);
    console.error('Mensagem do erro:', error.message);
  }
}

// Executar teste
testAuthAndFirestore();