require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

async function testSignUpFlow() {
  console.log('🧪 Testando fluxo completo de criação de conta...\n');
  
  const testEmail = `test-${Date.now()}@zipfood.com`;
  const testData = {
    email: testEmail,
    password: 'test123456',
    name: 'Usuário Teste Completo',
    userType: 'customer',
    phone: '(16) 98765-4321'
  };
  
  console.log('📝 Dados de teste:', testData);
  
  try {
    // 1. Testar criação de conta via Supabase Auth
    console.log('\n1️⃣ Criando conta via Supabase Auth...');
    const { data: authData, error: authError } = await supabaseClient.auth.signUp({
      email: testData.email,
      password: testData.password,
      options: {
        data: {
          name: testData.name,
          user_type: testData.userType,
          phone: testData.phone,
        },
      },
    });
    
    if (authError) {
      console.error('❌ Erro na criação via Auth:', authError);
      return;
    }
    
    console.log('✅ Conta criada via Auth com sucesso!');
    console.log('📄 User ID:', authData.user?.id);
    console.log('📄 Email:', authData.user?.email);
    console.log('📄 User Metadata:', authData.user?.user_metadata);
    
    const userId = authData.user?.id;
    
    // 2. Verificar se o usuário foi criado na tabela auth.users (via admin)
    console.log('\n2️⃣ Verificando usuário na tabela auth.users...');
    const { data: authUser, error: authUserError } = await supabaseAdmin.auth.admin.getUserById(userId);
    
    if (authUserError) {
      console.error('❌ Erro ao buscar usuário na auth.users:', authUserError);
    } else {
      console.log('✅ Usuário encontrado na auth.users:');
      console.log('📄 ID:', authUser.user.id);
      console.log('📄 Email:', authUser.user.email);
      console.log('📄 Metadata:', authUser.user.user_metadata);
      console.log('📄 Created At:', authUser.user.created_at);
    }
    
    // 3. Verificar se existe na tabela users customizada
    console.log('\n3️⃣ Verificando na tabela users customizada...');
    const { data: customUser, error: customUserError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', testData.email)
      .single();
    
    if (customUserError) {
      console.log('❌ Usuário NÃO encontrado na tabela users customizada:', customUserError.message);
      
      // Verificar se existe algum trigger ou função que deveria criar o registro
      console.log('\n🔍 Verificando se existe trigger para criar usuário na tabela users...');
      
      // Tentar criar manualmente na tabela users
      console.log('\n4️⃣ Tentando criar manualmente na tabela users...');
      const { data: manualUser, error: manualError } = await supabaseAdmin
        .from('users')
        .insert({
          id: userId,
          email: testData.email,
          name: testData.name,
          user_type: testData.userType,
          phone: testData.phone,
        })
        .select()
        .single();
      
      if (manualError) {
        console.error('❌ Erro ao criar manualmente na tabela users:', manualError);
      } else {
        console.log('✅ Usuário criado manualmente na tabela users:');
        console.log('📄 Dados:', manualUser);
      }
    } else {
      console.log('✅ Usuário encontrado na tabela users customizada:');
      console.log('📄 Dados:', customUser);
    }
    
    // 4. Verificar se existe na tabela customers
    console.log('\n5️⃣ Verificando na tabela customers...');
    const { data: customer, error: customerError } = await supabaseAdmin
      .from('customers')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (customerError) {
      console.log('❌ Usuário NÃO encontrado na tabela customers:', customerError.message);
      
      // Tentar criar na tabela customers se for customer
      if (testData.userType === 'customer') {
        console.log('\n6️⃣ Tentando criar na tabela customers...');
        const { data: newCustomer, error: newCustomerError } = await supabaseAdmin
          .from('customers')
          .insert({
            user_id: userId,
            name: testData.name,
            email: testData.email,
            phone: testData.phone,
          })
          .select()
          .single();
        
        if (newCustomerError) {
          console.error('❌ Erro ao criar na tabela customers:', newCustomerError);
        } else {
          console.log('✅ Cliente criado na tabela customers:');
          console.log('📄 Dados:', newCustomer);
        }
      }
    } else {
      console.log('✅ Cliente encontrado na tabela customers:');
      console.log('📄 Dados:', customer);
    }
    
    // 5. Limpeza - remover usuário de teste
    console.log('\n🧹 Limpando dados de teste...');
    
    // Remover da tabela customers se existir
    await supabaseAdmin.from('customers').delete().eq('user_id', userId);
    
    // Remover da tabela users se existir
    await supabaseAdmin.from('users').delete().eq('id', userId);
    
    // Remover do auth
    await supabaseAdmin.auth.admin.deleteUser(userId);
    
    console.log('✅ Limpeza concluída!');
    
  } catch (error) {
    console.error('❌ Erro geral no teste:', error);
  }
}

async function checkDatabaseTriggers() {
  console.log('\n🔍 Verificando triggers e funções do banco...');
  
  try {
    // Verificar se existem triggers na tabela auth.users
    const { data: triggers, error: triggersError } = await supabaseAdmin
      .rpc('get_triggers_info');
    
    if (triggersError) {
      console.log('❌ Não foi possível verificar triggers:', triggersError.message);
    } else {
      console.log('📋 Triggers encontrados:', triggers);
    }
  } catch (error) {
    console.log('❌ Erro ao verificar triggers:', error.message);
  }
}

async function main() {
  await testSignUpFlow();
  await checkDatabaseTriggers();
  console.log('\n🏁 Teste concluído!');
}

main().catch(console.error);