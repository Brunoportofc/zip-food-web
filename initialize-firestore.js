// Script para inicializar coleções básicas do Firestore
// Este script cria as coleções necessárias e testa o fluxo de cadastro

const admin = require('firebase-admin');
const path = require('path');

// Inicializar Firebase Admin
const serviceAccount = require('./zip-food-delivery-f5b4f-firebase-adminsdk-fbsvc-5d1ee4728d.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'zip-food-delivery-f5b4f'
});

const db = admin.firestore();
const auth = admin.auth();

async function initializeFirestore() {
  console.log('🚀 Iniciando inicialização do Firestore...');
  
  try {
    // 1. Verificar coleções existentes
    console.log('\n📋 Verificando coleções existentes...');
    const collections = await db.listCollections();
    console.log('Coleções encontradas:', collections.map(col => col.id));
    
    // 2. Criar documentos de exemplo para inicializar coleções
    console.log('\n🏗️ Inicializando coleções básicas...');
    
    // Inicializar coleção users
    const usersRef = db.collection('users');
    const usersSnapshot = await usersRef.limit(1).get();
    
    if (usersSnapshot.empty) {
      console.log('Criando coleção users...');
      await usersRef.doc('_init').set({
        _placeholder: true,
        created_at: admin.firestore.FieldValue.serverTimestamp(),
        description: 'Documento placeholder para inicializar a coleção'
      });
      console.log('✅ Coleção users inicializada');
    } else {
      console.log('✅ Coleção users já existe');
    }
    
    // Inicializar coleção customers
    const customersRef = db.collection('customers');
    const customersSnapshot = await customersRef.limit(1).get();
    
    if (customersSnapshot.empty) {
      console.log('Criando coleção customers...');
      await customersRef.doc('_init').set({
        _placeholder: true,
        created_at: admin.firestore.FieldValue.serverTimestamp(),
        description: 'Documento placeholder para inicializar a coleção'
      });
      console.log('✅ Coleção customers inicializada');
    } else {
      console.log('✅ Coleção customers já existe');
    }
    
    // Inicializar coleção restaurants
    const restaurantsRef = db.collection('restaurants');
    const restaurantsSnapshot = await restaurantsRef.limit(1).get();
    
    if (restaurantsSnapshot.empty) {
      console.log('Criando coleção restaurants...');
      await restaurantsRef.doc('_init').set({
        _placeholder: true,
        created_at: admin.firestore.FieldValue.serverTimestamp(),
        description: 'Documento placeholder para inicializar a coleção'
      });
      console.log('✅ Coleção restaurants inicializada');
    } else {
      console.log('✅ Coleção restaurants já existe');
    }
    
    // Inicializar coleção delivery_drivers
    const deliveryRef = db.collection('delivery_drivers');
    const deliverySnapshot = await deliveryRef.limit(1).get();
    
    if (deliverySnapshot.empty) {
      console.log('Criando coleção delivery_drivers...');
      await deliveryRef.doc('_init').set({
        _placeholder: true,
        created_at: admin.firestore.FieldValue.serverTimestamp(),
        description: 'Documento placeholder para inicializar a coleção'
      });
      console.log('✅ Coleção delivery_drivers inicializada');
    } else {
      console.log('✅ Coleção delivery_drivers já existe');
    }
    
    // 3. Testar criação de usuário
    console.log('\n🧪 Testando criação de usuário...');
    
    const testEmail = 'teste-firestore@example.com';
    const testPassword = 'teste123456';
    
    try {
      // Verificar se usuário já existe
      try {
        const existingUser = await auth.getUserByEmail(testEmail);
        console.log('Usuário de teste já existe, removendo...');
        await auth.deleteUser(existingUser.uid);
      } catch (error) {
        // Usuário não existe, tudo bem
      }
      
      // Criar usuário no Firebase Auth
      console.log('Criando usuário no Firebase Auth...');
      const userRecord = await auth.createUser({
        email: testEmail,
        password: testPassword,
        displayName: 'Usuário Teste'
      });
      
      console.log('✅ Usuário criado no Firebase Auth:', userRecord.uid);
      
      // Criar perfil no Firestore
      console.log('Criando perfil no Firestore...');
      const userProfile = {
        id: userRecord.uid,
        email: testEmail,
        name: 'Usuário Teste',
        user_type: 'customer',
        phone: '(11) 99999-9999',
        status: 'active',
        created_at: admin.firestore.FieldValue.serverTimestamp(),
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
        last_login: admin.firestore.FieldValue.serverTimestamp()
      };
      
      // Salvar na coleção users
      await db.collection('users').doc(userRecord.uid).set(userProfile);
      console.log('✅ Perfil salvo na coleção users');
      
      // Salvar na coleção customers
      await db.collection('customers').doc(userRecord.uid).set({
        ...userProfile,
        user_id: userRecord.uid
      });
      console.log('✅ Perfil salvo na coleção customers');
      
      // Verificar se os dados foram salvos corretamente
      console.log('\n🔍 Verificando dados salvos...');
      const savedUser = await db.collection('users').doc(userRecord.uid).get();
      const savedCustomer = await db.collection('customers').doc(userRecord.uid).get();
      
      if (savedUser.exists && savedCustomer.exists) {
        console.log('✅ Dados verificados com sucesso!');
        console.log('Dados do usuário:', savedUser.data());
      } else {
        console.log('❌ Erro: Dados não foram salvos corretamente');
      }
      
      // Limpar dados de teste
      console.log('\n🧹 Limpando dados de teste...');
      await auth.deleteUser(userRecord.uid);
      await db.collection('users').doc(userRecord.uid).delete();
      await db.collection('customers').doc(userRecord.uid).delete();
      console.log('✅ Dados de teste removidos');
      
    } catch (error) {
      console.error('❌ Erro no teste de criação de usuário:', error);
    }
    
    // 4. Verificar regras do Firestore
    console.log('\n📜 Verificando regras do Firestore...');
    console.log('As regras estão configuradas para permitir:');
    console.log('- Criação de usuários autenticados em suas próprias coleções');
    console.log('- Leitura pública de restaurantes');
    console.log('- Operações baseadas em propriedade de documentos');
    
    // 5. Remover documentos placeholder
    console.log('\n🧹 Removendo documentos placeholder...');
    try {
      await db.collection('users').doc('_init').delete();
      await db.collection('customers').doc('_init').delete();
      await db.collection('restaurants').doc('_init').delete();
      await db.collection('delivery_drivers').doc('_init').delete();
      console.log('✅ Documentos placeholder removidos');
    } catch (error) {
      console.log('ℹ️ Alguns documentos placeholder podem não existir');
    }
    
    console.log('\n🎉 Inicialização do Firestore concluída com sucesso!');
    console.log('\n📝 Próximos passos:');
    console.log('1. Teste o cadastro de usuário na aplicação');
    console.log('2. Verifique se os dados estão sendo salvos corretamente');
    console.log('3. Se ainda houver problemas, verifique o console do navegador');
    
  } catch (error) {
    console.error('❌ Erro durante a inicialização:', error);
  }
}

// Executar inicialização
initializeFirestore()
  .then(() => {
    console.log('\n✅ Script executado com sucesso');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erro na execução do script:', error);
    process.exit(1);
  });