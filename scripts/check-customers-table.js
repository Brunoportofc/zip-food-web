require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkCustomersTable() {
  try {
    console.log('🔍 Verificando se a tabela customers existe...');
    
    // Tentar fazer uma consulta direta na tabela customers
    const { data: customers, error: customersError } = await supabaseAdmin
      .from('customers')
      .select('*')
      .limit(1);
    
    if (customersError) {
      console.log('❌ Tabela customers NÃO EXISTE ou não tem permissões adequadas');
      console.log('📝 Erro:', customersError.message);
      console.log('📝 Código:', customersError.code);
      
      if (customersError.code === 'PGRST205') {
        console.log('\n💡 CAUSA RAIZ IDENTIFICADA:');
        console.log('   A tabela "customers" não existe no banco de dados!');
        console.log('\n🔧 SOLUÇÕES POSSÍVEIS:');
        console.log('   1. Criar a tabela customers');
        console.log('   2. Modificar o código para usar apenas a tabela users');
        console.log('   3. Verificar se existe uma migração pendente');
      }
      
      return;
    }
    
    console.log('✅ Tabela customers existe e é acessível');
    console.log(`📊 Registros encontrados: ${customers?.length || 0}`);
    
    if (customers && customers.length > 0) {
      console.log('📄 Exemplo de registro:');
      console.log(JSON.stringify(customers[0], null, 2));
    }
    
    // Verificar se há algum usuário do tipo customer na tabela users
    console.log('\n🔍 Verificando usuários do tipo customer na tabela users...');
    const { data: customerUsers, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('user_type', 'customer')
      .limit(3);
    
    if (userError) {
      console.error('❌ Erro ao consultar usuários:', userError);
    } else {
      console.log(`📊 Usuários do tipo customer na tabela users: ${customerUsers?.length || 0}`);
      if (customerUsers && customerUsers.length > 0) {
        console.log('📄 Exemplo:');
        console.log(JSON.stringify(customerUsers[0], null, 2));
      }
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

checkCustomersTable();