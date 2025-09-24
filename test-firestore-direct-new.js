// test-firestore-direct-new.js
// Script para testar conexão direta com Firestore usando as credenciais corretas

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, getDoc } = require('firebase/firestore');

// Configuração do Firebase usando as credenciais corretas
const firebaseConfig = {
  apiKey: "AIzaSyAkECfPgG5p2lPnRbXM-8JqXUBDMMiO2PU",
  authDomain: "zip-food-delivery-f5b4f.firebaseapp.com",
  projectId: "zip-food-delivery-f5b4f",
  storageBucket: "zip-food-delivery-f5b4f.firebasestorage.app",
  messagingSenderId: "211604078790",
  appId: "1:211604078790:web:ba245e4c6a03f4c39e97c7",
  measurementId: "G-KESSPNE0J2"
};

async function testFirestore() {
  try {
    console.log('🚀 Inicializando Firebase...');
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    console.log('✅ Firebase inicializado com sucesso');
    console.log('📊 Projeto ID:', firebaseConfig.projectId);
    
    // Testar escrita
    const testDocRef = doc(db, 'test', 'connection-test');
    const testData = {
      message: 'Teste de conexão',
      timestamp: new Date().toISOString(),
      success: true
    };
    
    console.log('📝 Tentando escrever documento de teste...');
    await setDoc(testDocRef, testData);
    console.log('✅ Documento escrito com sucesso!');
    
    // Testar leitura
    console.log('📖 Tentando ler documento de teste...');
    const docSnap = await getDoc(testDocRef);
    
    if (docSnap.exists()) {
      console.log('✅ Documento lido com sucesso!');
      console.log('📄 Dados:', docSnap.data());
    } else {
      console.log('❌ Documento não encontrado');
    }
    
    console.log('🎉 Teste concluído com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
    console.error('Código do erro:', error.code);
    console.error('Mensagem do erro:', error.message);
  }
}

// Executar teste
testFirestore();