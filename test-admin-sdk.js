// test-admin-sdk.js
// Teste usando Firebase Admin SDK

const admin = require('firebase-admin');
const fs = require('fs');

// Carregar as credenciais do Admin SDK
const serviceAccount = JSON.parse(
  fs.readFileSync('./zip-food-delivery-f5b4f-firebase-adminsdk-fbsvc-5d1ee4728d.json', 'utf8')
);

async function testAdminSDK() {
  try {
    console.log('🚀 Inicializando Firebase Admin SDK...');
    
    // Inicializar o Admin SDK
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: 'zip-food-delivery-f5b4f'
    });
    
    const auth = admin.auth();
    const db = admin.firestore();
    
    console.log('✅ Firebase Admin SDK inicializado com sucesso');
    
    // Dados do usuário de teste
    const timestamp = Date.now();
    const userData = {
      email: `testadmin${timestamp}@example.com`,
      password: 'password123',
      name: `Test Admin User ${timestamp}`,
      user_type: 'customer',
      phone: '(11) 99999-9999'
    };
    
    console.log('📝 Criando usuário no Firebase Auth (Admin SDK)...');
    const userRecord = await auth.createUser({
      email: userData.email,
      password: userData.password,
      displayName: userData.name,
    });
    
    console.log('✅ Usuário criado no Firebase Auth:', userRecord.uid);
    
    // Criar documento no Firestore usando Admin SDK
    console.log('📄 Criando documento do usuário no Firestore (Admin SDK)...');
    const firestoreUserData = {
      id: userRecord.uid,
      email: userRecord.email || '',
      name: userData.name,
      user_type: userData.user_type,
      phone: userData.phone,
      status: 'active',
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    };
    
    await db.collection('users').doc(userRecord.uid).set(firestoreUserData);
    console.log('✅ Documento do usuário criado com sucesso');
    
    // Criar documento específico do tipo de usuário
    console.log('📄 Criando documento específico do tipo de usuário...');
    const customerData = {
      id: userRecord.uid,
      email: userRecord.email || '',
      name: userData.name,
      phone: userData.phone,
      address: '',
      preferences: {},
      order_history: [],
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    };
    
    await db.collection('customers').doc(userRecord.uid).set(customerData);
    console.log('✅ Documento do customer criado com sucesso');
    
    console.log('🎉 Teste com Admin SDK concluído com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
    console.error('Código do erro:', error.code);
    console.error('Mensagem do erro:', error.message);
  }
}

// Executar teste
testAdminSDK();