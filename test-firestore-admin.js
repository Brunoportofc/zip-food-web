// Teste usando Firebase Admin SDK para verificar permissões
const admin = require('firebase-admin');
const path = require('path');

// Inicializar Firebase Admin usando o arquivo de credenciais
const serviceAccount = require('./zip-food-delivery-f5b4f-firebase-adminsdk-fbsvc-5d1ee4728d.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'zip-food-delivery-f5b4f'
});

const db = admin.firestore();
const auth = admin.auth();

async function testFirestoreWithAdmin() {
  try {
    console.log('🧪 Testando Firestore com Firebase Admin SDK...');
    
    // Criar usuário temporário
    const email = `admin-test-${Date.now()}@example.com`;
    const password = 'test123456';
    
    console.log('📝 Criando usuário no Firebase Auth...');
    const userRecord = await auth.createUser({
      email: email,
      password: password,
      displayName: 'Admin Test User'
    });
    
    console.log('✅ Usuário criado:', userRecord.uid);
    
    // Tentar escrever no Firestore usando Admin SDK
    console.log('📄 Tentando escrever no Firestore com Admin SDK...');
    const userData = {
      id: userRecord.uid,
      email: userRecord.email,
      name: 'Admin Test User',
      user_type: 'customer',
      status: 'active',
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    };
    
    await db.collection('users').doc(userRecord.uid).set(userData);
    console.log('✅ Documento criado com sucesso no Firestore usando Admin SDK!');
    
    // Ler o documento para confirmar
    const docRef = db.collection('users').doc(userRecord.uid);
    const doc = await docRef.get();
    
    if (doc.exists) {
      console.log('✅ Documento lido com sucesso:', doc.data());
    } else {
      console.log('❌ Documento não encontrado');
    }
    
    // Limpar usuário de teste
    console.log('🧹 Removendo usuário de teste...');
    await auth.deleteUser(userRecord.uid);
    await db.collection('users').doc(userRecord.uid).delete();
    console.log('✅ Usuário de teste removido');
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
    console.error('Código do erro:', error.code);
    console.error('Mensagem do erro:', error.message);
  }
}

testFirestoreWithAdmin()
  .then(() => {
    console.log('✅ Script executado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro na execução:', error);
    process.exit(1);
  });