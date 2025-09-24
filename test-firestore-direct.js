// Teste direto do Firestore para verificar permissões
const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, setDoc, serverTimestamp } = require('firebase/firestore');

// Configuração do Firebase - usando as mesmas credenciais do .env.local
const firebaseConfig = {
  apiKey: "AIzaSyAkECfPgG5p2lPnRbXM-8JqXUBDMMiO2PU",
  authDomain: "zip-food-delivery-f5b4f.firebaseapp.com",
  projectId: "zip-food-delivery-f5b4f",
  storageBucket: "zip-food-delivery-f5b4f.firebasestorage.app",
  messagingSenderId: "211604078790",
  appId: "1:211604078790:web:ba245e4c6a03f4c39e97c7",
  measurementId: "G-KESSPNE0J2"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function testFirestoreWrite() {
  try {
    console.log('🧪 Testando escrita direta no Firestore...');
    
    // Criar usuário temporário
    const email = `test-${Date.now()}@example.com`;
    const password = 'test123456';
    
    console.log('📝 Criando usuário no Firebase Auth...');
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    console.log('✅ Usuário criado:', user.uid);
    
    // Aguardar um pouco para garantir que o token seja propagado
    console.log('⏳ Aguardando propagação do token...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Verificar se o usuário está autenticado
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('Usuário não está autenticado');
    }
    
    console.log('🔐 Usuário autenticado:', currentUser.uid);
    
    // Tentar escrever no Firestore
    console.log('📄 Tentando escrever no Firestore...');
    const userData = {
      id: user.uid,
      email: user.email,
      name: 'Test User',
      user_type: 'customer',
      status: 'active',
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    };
    
    await setDoc(doc(db, 'users', user.uid), userData);
    console.log('✅ Documento criado com sucesso no Firestore!');
    
    // Limpar usuário de teste
    await user.delete();
    console.log('🧹 Usuário de teste removido');
    
    console.log('🎉 Teste concluído com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
    console.error('Código do erro:', error.code);
    console.error('Mensagem do erro:', error.message);
  }
}

// Executar teste
testFirestoreWrite()
  .then(() => {
    console.log('✅ Script executado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro na execução:', error);
    process.exit(1);
  });