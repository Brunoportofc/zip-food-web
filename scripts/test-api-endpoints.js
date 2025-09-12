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

console.log('🧪 Testando Endpoints de API');
console.log('============================');

async function testRegisterEndpoint() {
  console.log('\n📝 Testando Endpoint de Registro...');
  
  const testUser = {
    name: 'Usuário Teste API',
    email: `test-api-${Date.now()}@zipfood.com`,
    password: 'test123456',
    userType: 'customer',
    phone: '(11) 99999-9999',
    address: 'Rua Teste, 123'
  };
  
  try {
    console.log('Enviando requisição para:', `${API_BASE}/register`);
    console.log('Dados:', JSON.stringify(testUser, null, 2));
    
    const response = await fetch(`${API_BASE}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testUser)
    });
    
    console.log('Status da resposta:', response.status);
    console.log('Headers da resposta:', Object.fromEntries(response.headers));
    
    const data = await response.json();
    console.log('Corpo da resposta:', JSON.stringify(data, null, 2));
    
    if (response.ok && data.success) {
      console.log('✅ Registro funcionando!');
      return { success: true, user: testUser, data };
    } else {
      console.log('❌ Erro no registro:', data.error || data.message);
      return { success: false, error: data };
    }
    
  } catch (error) {
    console.log('❌ Erro na requisição de registro:', error.message);
    return { success: false, error: error.message };
  }
}

async function testLoginEndpoint(email, password) {
  console.log('\n🔐 Testando Endpoint de Login...');
  
  const loginData = {
    email,
    password
  };
  
  try {
    console.log('Enviando requisição para:', `${API_BASE}/login`);
    console.log('Dados:', JSON.stringify(loginData, null, 2));
    
    const response = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(loginData)
    });
    
    console.log('Status da resposta:', response.status);
    console.log('Headers da resposta:', Object.fromEntries(response.headers));
    
    const data = await response.json();
    console.log('Corpo da resposta:', JSON.stringify(data, null, 2));
    
    if (response.ok && data.success) {
      console.log('✅ Login funcionando!');
      return { success: true, data };
    } else {
      console.log('❌ Erro no login:', data.error || data.message);
      return { success: false, error: data };
    }
    
  } catch (error) {
    console.log('❌ Erro na requisição de login:', error.message);
    return { success: false, error: error.message };
  }
}

async function testServerConnection() {
  console.log('\n🌐 Testando Conexão com Servidor...');
  
  try {
    const response = await fetch('http://localhost:3001', {
      method: 'GET'
    });
    
    console.log('Status da conexão:', response.status);
    
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

async function main() {
  // Inicializar fetch
  await initFetch();
  
  // Testar conexão com servidor
  const serverRunning = await testServerConnection();
  
  if (!serverRunning) {
    console.log('\n⚠️  Servidor não está rodando. Execute "npm run dev" primeiro.');
    return;
  }
  
  // Testar registro
  const registerResult = await testRegisterEndpoint();
  
  if (registerResult.success) {
    // Testar login com o usuário criado
    await testLoginEndpoint(registerResult.user.email, registerResult.user.password);
  } else {
    // Testar login com credenciais de desenvolvimento
    console.log('\n🔄 Testando login com credenciais de desenvolvimento...');
    await testLoginEndpoint('admin@gmail.com', '12341234');
  }
  
  console.log('\n🏁 Teste de endpoints concluído!');
}

main().catch(console.error);