const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 Diagnóstico do Supabase');
console.log('========================');

// Verificar variáveis de ambiente
console.log('\n📋 Variáveis de Ambiente:');
console.log('SUPABASE_URL:', supabaseUrl ? '✅ Configurada' : '❌ Não encontrada');
console.log('SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅ Configurada' : '❌ Não encontrada');
console.log('ANON_KEY:', supabaseAnonKey ? '✅ Configurada' : '❌ Não encontrada');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '✅ Configurada' : '❌ Não encontrada');

if (!supabaseUrl || !supabaseServiceKey) {
  console.log('\n❌ Variáveis de ambiente obrigatórias não encontradas!');
  process.exit(1);
}

// Criar cliente Supabase
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testConnection() {
  try {
    console.log('\n🔌 Testando Conectividade...');
    
    // Teste básico de conexão
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error) {
      console.log('❌ Erro na conexão:', error.message);
      return false;
    }
    
    console.log('✅ Conexão com Supabase estabelecida!');
    return true;
  } catch (err) {
    console.log('❌ Erro de conectividade:', err.message);
    return false;
  }
}

async function checkTables() {
  console.log('\n📊 Verificando Tabelas...');
  
  const tables = ['users', 'customers', 'restaurants', 'delivery_drivers'];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`❌ Tabela '${table}': ${error.message}`);
      } else {
        console.log(`✅ Tabela '${table}': OK`);
      }
    } catch (err) {
      console.log(`❌ Tabela '${table}': ${err.message}`);
    }
  }
}

async function testAuth() {
  console.log('\n🔐 Testando Autenticação...');
  
  try {
    // Criar cliente para autenticação
    const authClient = createClient(supabaseUrl, supabaseAnonKey);
    
    // Tentar registrar um usuário de teste
    const testEmail = `test-${Date.now()}@zipfood.com`;
    const testPassword = 'test123456';
    
    console.log('Testando registro de usuário...');
    const { data: signUpData, error: signUpError } = await authClient.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          name: 'Usuário Teste',
          user_type: 'customer'
        }
      }
    });
    
    if (signUpError) {
      console.log('❌ Erro no registro:', signUpError.message);
    } else {
      console.log('✅ Registro de usuário funcionando!');
      
      // Limpar usuário de teste
      if (signUpData.user) {
        await supabase.auth.admin.deleteUser(signUpData.user.id);
        console.log('🧹 Usuário de teste removido');
      }
    }
    
  } catch (err) {
    console.log('❌ Erro no teste de autenticação:', err.message);
  }
}

async function main() {
  const isConnected = await testConnection();
  
  if (isConnected) {
    await checkTables();
    await testAuth();
  }
  
  console.log('\n🏁 Diagnóstico concluído!');
}

main().catch(console.error);