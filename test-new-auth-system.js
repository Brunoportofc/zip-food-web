// test-new-auth-system.js
// Teste completo do novo sistema de autenticação

const { initializeApp } = require('firebase/app');
const { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut 
} = require('firebase/auth');
const { 
  getFirestore, 
  doc, 
  getDoc,
  collection,
  query,
  where,
  getDocs
} = require('firebase/firestore');

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyA4QOxdHnd6v6ZW7rY7otiHKI8Tw7GujBA",
  authDomain: "zip-food-delivery-f5b4f.firebaseapp.com",
  projectId: "zip-food-delivery-f5b4f",
  storageBucket: "zip-food-delivery-f5b4f.firebasestorage.app",
  messagingSenderId: "483346616838",
  appId: "1:483346616838:web:133fe131941d13400b2987"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Função para log colorido
function log(message, type = 'info') {
  const timestamp = new Date().toLocaleTimeString();
  const colors = {
    info: '\x1b[36m',    // Cyan
    success: '\x1b[32m', // Green
    error: '\x1b[31m',   // Red
    warning: '\x1b[33m', // Yellow
    reset: '\x1b[0m'     // Reset
  };
  
  console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`);
}

// Função para testar API
async function testAPI(endpoint, method = 'GET', data = null) {
  try {
    const url = `http://localhost:3001${endpoint}`;
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    log(`📡 Testando API: ${method} ${endpoint}`, 'info');
    const response = await fetch(url, options);
    const result = await response.json();
    
    if (response.ok) {
      log(`✅ API ${endpoint}: ${result.message || 'Sucesso'}`, 'success');
      return { success: true, data: result };
    } else {
      log(`❌ API ${endpoint}: ${result.error || 'Erro'}`, 'error');
      return { success: false, error: result.error };
    }
  } catch (error) {
    log(`❌ Erro na API ${endpoint}: ${error.message}`, 'error');
    return { success: false, error: error.message };
  }
}

// Função para verificar documento no Firestore
async function checkFirestoreDocument(collection, docId) {
  try {
    const docRef = doc(db, collection, docId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      log(`✅ Documento encontrado em ${collection}/${docId}`, 'success');
      return { exists: true, data: docSnap.data() };
    } else {
      log(`❌ Documento não encontrado em ${collection}/${docId}`, 'error');
      return { exists: false };
    }
  } catch (error) {
    log(`❌ Erro ao verificar documento: ${error.message}`, 'error');
    return { exists: false, error: error.message };
  }
}

// Função para testar cadastro de usuário
async function testUserSignup(userType, email, password, name) {
  log(`\n🧪 TESTANDO CADASTRO - ${userType.toUpperCase()}`, 'info');
  log('=' .repeat(50), 'info');
  
  const userData = {
    email,
    password,
    name,
    user_type: userType,
    phone: '(11) 99999-9999'
  };

  try {
    // 1. Testar API de cadastro
    log('1️⃣ Testando API de cadastro...', 'info');
    const apiResult = await testAPI('/api/auth/signup', 'POST', userData);
    
    if (!apiResult.success) {
      log(`❌ Falha na API de cadastro: ${apiResult.error}`, 'error');
      return false;
    }

    const userId = apiResult.data.user.id;
    log(`✅ Usuário criado via API: ${userId}`, 'success');

    // 2. Verificar documento na coleção users
    log('2️⃣ Verificando documento na coleção users...', 'info');
    const userDoc = await checkFirestoreDocument('users', userId);
    
    if (!userDoc.exists) {
      log('❌ Documento não encontrado na coleção users', 'error');
      return false;
    }

    // 3. Verificar documento na coleção específica do tipo de usuário
    log(`3️⃣ Verificando documento na coleção ${userType}s...`, 'info');
    const typeCollection = userType === 'delivery_driver' ? 'delivery_drivers' : `${userType}s`;
    const typeDoc = await checkFirestoreDocument(typeCollection, userId);
    
    if (!typeDoc.exists) {
      log(`❌ Documento não encontrado na coleção ${typeCollection}`, 'error');
      return false;
    }

    // 4. Testar login
    log('4️⃣ Testando login...', 'info');
    const loginResult = await testAPI('/api/auth/signin', 'POST', {
      email: userData.email,
      password: userData.password
    });

    if (!loginResult.success) {
      log(`❌ Falha no login: ${loginResult.error}`, 'error');
      return false;
    }

    log(`✅ Login realizado com sucesso`, 'success');

    // 5. Testar logout
    log('5️⃣ Testando logout...', 'info');
    const logoutResult = await testAPI('/api/auth/signout', 'POST');

    if (!logoutResult.success) {
      log(`❌ Falha no logout: ${logoutResult.error}`, 'error');
      return false;
    }

    log(`✅ Logout realizado com sucesso`, 'success');
    log(`🎉 TESTE COMPLETO PARA ${userType.toUpperCase()} - SUCESSO!`, 'success');
    
    return true;

  } catch (error) {
    log(`❌ Erro durante o teste: ${error.message}`, 'error');
    return false;
  }
}

// Função para limpar usuários de teste
async function cleanupTestUsers() {
  log('\n🧹 LIMPANDO USUÁRIOS DE TESTE...', 'warning');
  
  const testEmails = [
    'customer.test@example.com',
    'restaurant.test@example.com',
    'driver.test@example.com'
  ];

  for (const email of testEmails) {
    try {
      // Tentar fazer login para obter o UID
      const userCredential = await signInWithEmailAndPassword(auth, email, 'test123456');
      const user = userCredential.user;
      
      log(`🗑️ Removendo usuário: ${email} (${user.uid})`, 'warning');
      
      // Fazer logout
      await signOut(auth);
      
      // Nota: Para deletar completamente o usuário, seria necessário usar Firebase Admin SDK
      // Por enquanto, apenas fazemos logout
      
    } catch (error) {
      // Usuário não existe ou erro de login - isso é esperado
      log(`ℹ️ Usuário ${email} não encontrado ou já removido`, 'info');
    }
  }
}

// Função principal de teste
async function runTests() {
  log('🚀 INICIANDO TESTES DO NOVO SISTEMA DE AUTENTICAÇÃO', 'info');
  log('=' .repeat(60), 'info');
  
  const testResults = [];

  // Limpar usuários de teste existentes
  await cleanupTestUsers();

  // Aguardar um pouco
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Testar cada tipo de usuário
  const userTypes = [
    { type: 'customer', email: 'customer.test@example.com', name: 'Cliente Teste' },
    { type: 'restaurant', email: 'restaurant.test@example.com', name: 'Restaurante Teste' },
    { type: 'delivery_driver', email: 'driver.test@example.com', name: 'Entregador Teste' }
  ];

  for (const userType of userTypes) {
    const result = await testUserSignup(
      userType.type,
      userType.email,
      'test123456',
      userType.name
    );
    
    testResults.push({
      type: userType.type,
      success: result
    });

    // Aguardar entre os testes
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Resumo dos resultados
  log('\n📊 RESUMO DOS TESTES', 'info');
  log('=' .repeat(30), 'info');
  
  let successCount = 0;
  let totalCount = testResults.length;

  testResults.forEach(result => {
    const status = result.success ? '✅ PASSOU' : '❌ FALHOU';
    log(`${result.type.toUpperCase()}: ${status}`, result.success ? 'success' : 'error');
    if (result.success) successCount++;
  });

  log(`\n📈 RESULTADO FINAL: ${successCount}/${totalCount} testes passaram`, 
       successCount === totalCount ? 'success' : 'warning');

  if (successCount === totalCount) {
    log('🎉 TODOS OS TESTES PASSARAM! Sistema funcionando corretamente.', 'success');
  } else {
    log('⚠️ Alguns testes falharam. Verifique os logs acima.', 'warning');
  }

  process.exit(successCount === totalCount ? 0 : 1);
}

// Executar testes
runTests().catch(error => {
  log(`❌ Erro fatal durante os testes: ${error.message}`, 'error');
  process.exit(1);
});