// test-simple-client.js
// Teste simples usando apenas Firebase Client SDK

const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword, updateProfile, signInWithEmailAndPassword } = require('firebase/auth');
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

async function testSimpleClient() {
  try {
    console.log('🚀 Inicializando Firebase Client SDK...');
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);
    
    console.log('✅ Firebase Client SDK inicializado com sucesso');
    
    // Dados do usuário de teste
    const timestamp = Date.now();
    const userData = {
      email: `testclient${timestamp}@example.com`,
      password: 'password123',
      name: `Test Client User ${timestamp}`,
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
    console.log('🔑 Token do usuário:', await user.getIdToken());
    
    // Atualizar perfil
    console.log('👤 Atualizando perfil do usuário...');
    await updateProfile(user, {
      displayName: userData.name,
    });
    
    // Aguardar um pouco para garantir que o usuário está autenticado
    console.log('⏳ Aguardando autenticação...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Verificar se o usuário ainda está autenticado
    if (!auth.currentUser) {
      throw new Error('Usuário não está autenticado');
    }
    
    console.log('🔐 Usuário autenticado:', auth.currentUser.uid);
    console.log('📧 Email verificado:', auth.currentUser.emailVerified);
    
    // Tentar fazer login novamente para garantir autenticação
    console.log('🔄 Fazendo login novamente para garantir autenticação...');
    await signInWithEmailAndPassword(auth, userData.email, userData.password);
    console.log('✅ Login realizado com sucesso');
    
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
    
    console.log('🎉 Teste com Client SDK concluído com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
    console.error('Código do erro:', error.code);
    console.error('Mensagem do erro:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
  }
}

// Executar teste
testSimpleClient();