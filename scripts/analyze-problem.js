require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function analyzeProblem() {
  try {
    console.log('🔍 ANÁLISE COMPLETA DO PROBLEMA DE CRIAÇÃO DE CONTA');
    console.log('=' .repeat(60));
    
    // 1. Verificar tabelas existentes
    console.log('\n1️⃣ VERIFICANDO TABELAS EXISTENTES...');
    
    const tables = ['users', 'customers', 'profiles', 'restaurants', 'delivery_drivers'];
    const tableStatus = {};
    
    for (const table of tables) {
      try {
        const { data, error } = await supabaseAdmin
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          tableStatus[table] = { exists: false, error: error.message };
        } else {
          tableStatus[table] = { exists: true, count: data?.length || 0 };
        }
      } catch (err) {
        tableStatus[table] = { exists: false, error: err.message };
      }
    }
    
    console.log('📋 Status das tabelas:');
    Object.entries(tableStatus).forEach(([table, status]) => {
      if (status.exists) {
        console.log(`  ✅ ${table}: EXISTE`);
      } else {
        console.log(`  ❌ ${table}: NÃO EXISTE (${status.error})`);
      }
    });
    
    // 2. Verificar fluxo de autenticação
    console.log('\n2️⃣ ANALISANDO FLUXO DE AUTENTICAÇÃO...');
    
    // Verificar usuários na tabela auth.users
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (authError) {
      console.log('❌ Erro ao consultar auth.users:', authError.message);
    } else {
      console.log(`📊 Usuários em auth.users: ${authUsers.users?.length || 0}`);
      
      if (authUsers.users && authUsers.users.length > 0) {
        const lastUser = authUsers.users[authUsers.users.length - 1];
        console.log('📄 Último usuário criado:');
        console.log(`  - ID: ${lastUser.id}`);
        console.log(`  - Email: ${lastUser.email}`);
        console.log(`  - Metadados: ${JSON.stringify(lastUser.user_metadata)}`);
        console.log(`  - Criado em: ${lastUser.created_at}`);
      }
    }
    
    // 3. Verificar usuários na tabela public.users
    console.log('\n3️⃣ VERIFICANDO TABELA PUBLIC.USERS...');
    
    const { data: publicUsers, error: publicError } = await supabaseAdmin
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(3);
    
    if (publicError) {
      console.log('❌ Erro ao consultar public.users:', publicError.message);
    } else {
      console.log(`📊 Usuários em public.users: ${publicUsers?.length || 0}`);
      
      if (publicUsers && publicUsers.length > 0) {
        console.log('📄 Últimos usuários:');
        publicUsers.forEach((user, index) => {
          console.log(`  ${index + 1}. ${user.name} (${user.email}) - Tipo: ${user.user_type}`);
        });
      }
    }
    
    // 4. Verificar se há discrepância entre auth.users e public.users
    console.log('\n4️⃣ VERIFICANDO DISCREPÂNCIAS...');
    
    if (authUsers.users && publicUsers) {
      const authCount = authUsers.users.length;
      const publicCount = publicUsers.length;
      
      if (authCount > publicCount) {
        console.log(`⚠️  PROBLEMA IDENTIFICADO: ${authCount - publicCount} usuário(s) em auth.users não estão em public.users`);
        
        // Encontrar usuários que estão em auth mas não em public
        const authIds = authUsers.users.map(u => u.id);
        const publicIds = publicUsers.map(u => u.id);
        const missingIds = authIds.filter(id => !publicIds.includes(id));
        
        console.log('👤 Usuários faltando em public.users:');
        missingIds.forEach(id => {
          const authUser = authUsers.users.find(u => u.id === id);
          console.log(`  - ${authUser.email} (ID: ${id})`);
        });
      } else {
        console.log('✅ Todos os usuários de auth.users estão em public.users');
      }
    }
    
    // 5. Verificar políticas RLS
    console.log('\n5️⃣ VERIFICANDO POLÍTICAS RLS...');
    
    // Tentar inserir um usuário de teste para verificar se as políticas estão bloqueando
    console.log('🧪 Testando inserção direta na tabela users...');
    
    const testUser = {
      email: 'teste-direto@zipfood.com',
      password_hash: '$2b$10$test.hash.for.testing',
      user_type: 'customer',
      name: 'Teste Direto',
      phone: '(16) 99999-9999'
    };
    
    const { data: insertTest, error: insertError } = await supabaseAdmin
      .from('users')
      .insert(testUser)
      .select()
      .single();
    
    if (insertError) {
      console.log('❌ Erro ao inserir usuário de teste:', insertError.message);
      console.log('📝 Código:', insertError.code);
      
      if (insertError.code === '42501') {
        console.log('🔒 PROBLEMA: Políticas RLS estão bloqueando inserções');
      }
    } else {
      console.log('✅ Inserção de teste bem-sucedida');
      
      // Limpar o usuário de teste
      await supabaseAdmin
        .from('users')
        .delete()
        .eq('email', 'teste-direto@zipfood.com');
    }
    
    // 6. Resumo dos problemas encontrados
    console.log('\n6️⃣ RESUMO DOS PROBLEMAS ENCONTRADOS:');
    console.log('=' .repeat(50));
    
    const problems = [];
    
    if (!tableStatus.profiles?.exists) {
      problems.push('❌ Tabela "profiles" não existe (middleware espera ela)');
    }
    
    if (!tableStatus.customers?.exists) {
      problems.push('❌ Tabela "customers" não existe (código tenta inserir nela)');
    }
    
    if (authUsers.users && publicUsers && authUsers.users.length > publicUsers.length) {
      problems.push('❌ Usuários criados em auth.users não estão sendo replicados para public.users');
    }
    
    if (problems.length === 0) {
      console.log('✅ Nenhum problema estrutural encontrado');
      console.log('💡 O problema pode estar na lógica de negócio ou configuração');
    } else {
      problems.forEach(problem => console.log(problem));
    }
    
    console.log('\n🔧 SOLUÇÕES RECOMENDADAS:');
    console.log('1. Criar trigger para replicar usuários de auth.users para public.users');
    console.log('2. Criar tabela profiles ou ajustar middleware para usar public.users');
    console.log('3. Verificar se o AuthService está usando o cliente correto (admin vs anon)');
    console.log('4. Revisar políticas RLS para permitir inserções necessárias');
    
  } catch (error) {
    console.error('❌ Erro geral na análise:', error);
  }
}

analyzeProblem();