require('dotenv').config({ path: '.env.local' });

// Usar import dinâmico para node-fetch
let fetch;

async function initFetch() {
  if (!fetch) {
    const fetchModule = await import('node-fetch');
    fetch = fetchModule.default;
  }
  return fetch;
}

const API_BASE = 'http://localhost:3001/api/auth';

console.log('🧪 Testando Validações de Autenticação');
console.log('==========================================');

// Dados de teste
const testUsers = {
  customer: {
    name: 'Cliente Teste',
    email: 'cliente.teste@zipfood.com',
    password: 'test123456',
    userType: 'customer',
    phone: '(11) 99999-1111',
    address: 'Rua Cliente, 123'
  },
  restaurant: {
    name: 'Restaurante Teste',
    email: 'restaurante.teste@zipfood.com',
    password: 'test123456',
    userType: 'restaurant',
    phone: '(11) 99999-2222',
    address: 'Rua Restaurante, 456'
  },
  delivery: {
    name: 'Entregador Teste',
    email: 'entregador.teste@zipfood.com',
    password: 'test123456',
    userType: 'delivery',
    phone: '(11) 99999-3333',
    address: 'Rua Entregador, 789'
  }
};

async function registerUser(userData) {
  try {
    const response = await fetch(`${API_BASE}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData)
    });
    
    const data = await response.json();
    return { success: response.ok, status: response.status, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function loginUser(email, password, userType) {
  try {
    const response = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, userType })
    });
    
    const data = await response.json();
    return { success: response.ok, status: response.status, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function testServerConnection() {
  console.log('\n🌐 Testando Conexão com Servidor...');
  
  try {
    const response = await fetch('http://localhost:3001');
    
    if (response.ok) {
      console.log('✅ Servidor está rodando!');
      return true;
    } else {
      console.log('❌ Servidor retornou erro:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Não foi possível conectar ao servidor:', error.message);
    console.log('💡 Certifique-se de que o servidor está rodando em http://localhost:3001');
    return false;
  }
}

async function testUniqueEmailValidation() {
  console.log('\n📧 Teste 1: Validação de Email Único por Tipo de Conta');
  console.log('======================================================');
  
  // 1. Registrar um cliente
  console.log('\n1.1 Registrando cliente...');
  const customerResult = await registerUser(testUsers.customer);
  
  if (customerResult.success) {
    console.log('✅ Cliente registrado com sucesso');
  } else {
    console.log('❌ Falha ao registrar cliente:', customerResult.data?.error || customerResult.error);
    return false;
  }
  
  // 2. Tentar registrar restaurante com mesmo email
  console.log('\n1.2 Tentando registrar restaurante com mesmo email...');
  const duplicateRestaurant = {
    ...testUsers.restaurant,
    email: testUsers.customer.email // Usar mesmo email do cliente
  };
  
  const duplicateResult = await registerUser(duplicateRestaurant);
  
  if (!duplicateResult.success && duplicateResult.status === 409) {
    console.log('✅ Validação funcionando: Email duplicado rejeitado');
    console.log('📝 Mensagem:', duplicateResult.data?.error);
    return true;
  } else {
    console.log('❌ FALHA: Sistema permitiu email duplicado');
    return false;
  }
}

async function testUserTypeValidation() {
  console.log('\n🔐 Teste 2: Validação de Tipo de Conta no Login');
  console.log('===============================================');
  
  // 1. Registrar um restaurante
  console.log('\n2.1 Registrando restaurante...');
  const restaurantResult = await registerUser(testUsers.restaurant);
  
  if (restaurantResult.success) {
    console.log('✅ Restaurante registrado com sucesso');
  } else {
    console.log('❌ Falha ao registrar restaurante:', restaurantResult.data?.error || restaurantResult.error);
    return false;
  }
  
  // 2. Tentar fazer login como cliente usando credenciais de restaurante
  console.log('\n2.2 Tentando login como cliente com credenciais de restaurante...');
  const wrongTypeLogin = await loginUser(
    testUsers.restaurant.email,
    testUsers.restaurant.password,
    'customer' // Tipo errado
  );
  
  if (!wrongTypeLogin.success && wrongTypeLogin.status === 403) {
    console.log('✅ Validação funcionando: Tipo de conta incorreto rejeitado');
    console.log('📝 Mensagem:', wrongTypeLogin.data?.error);
  } else {
    console.log('❌ FALHA: Sistema permitiu login com tipo incorreto');
    return false;
  }
  
  // 3. Fazer login correto
  console.log('\n2.3 Fazendo login correto como restaurante...');
  const correctLogin = await loginUser(
    testUsers.restaurant.email,
    testUsers.restaurant.password,
    'restaurant' // Tipo correto
  );
  
  if (correctLogin.success) {
    console.log('✅ Login correto funcionando');
    return true;
  } else {
    console.log('❌ FALHA: Login correto não funcionou:', correctLogin.data?.error || correctLogin.error);
    return false;
  }
}

async function testDeliveryUserValidation() {
  console.log('\n🚚 Teste 3: Validação para Entregador');
  console.log('====================================');
  
  // 1. Registrar entregador
  console.log('\n3.1 Registrando entregador...');
  const deliveryResult = await registerUser(testUsers.delivery);
  
  if (deliveryResult.success) {
    console.log('✅ Entregador registrado com sucesso');
  } else {
    console.log('❌ Falha ao registrar entregador:', deliveryResult.data?.error || deliveryResult.error);
    return false;
  }
  
  // 2. Tentar login como restaurante
  console.log('\n3.2 Tentando login como restaurante com credenciais de entregador...');
  const wrongLogin = await loginUser(
    testUsers.delivery.email,
    testUsers.delivery.password,
    'restaurant'
  );
  
  if (!wrongLogin.success && wrongLogin.status === 403) {
    console.log('✅ Validação funcionando: Tipo incorreto rejeitado');
    console.log('📝 Mensagem:', wrongLogin.data?.error);
    return true;
  } else {
    console.log('❌ FALHA: Sistema permitiu login com tipo incorreto');
    return false;
  }
}

async function main() {
  // Inicializar fetch
  await initFetch();
  
  // Verificar se servidor está rodando
  const serverRunning = await testServerConnection();
  
  if (!serverRunning) {
    console.log('\n⚠️  Servidor não está rodando. Execute "npm run dev" primeiro.');
    return;
  }
  
  let allTestsPassed = true;
  
  // Executar testes
  try {
    const test1 = await testUniqueEmailValidation();
    const test2 = await testUserTypeValidation();
    const test3 = await testDeliveryUserValidation();
    
    allTestsPassed = test1 && test2 && test3;
    
  } catch (error) {
    console.error('\n❌ Erro durante os testes:', error);
    allTestsPassed = false;
  }
  
  // Resultado final
  console.log('\n' + '='.repeat(50));
  if (allTestsPassed) {
    console.log('🎉 TODOS OS TESTES PASSARAM!');
    console.log('✅ Sistema de validação funcionando corretamente');
  } else {
    console.log('❌ ALGUNS TESTES FALHARAM');
    console.log('⚠️  Verifique as implementações acima');
  }
  console.log('='.repeat(50));
}

main().catch(console.error);