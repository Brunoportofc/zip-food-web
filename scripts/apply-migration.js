require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function applyMigration() {
  try {
    console.log('🚀 APLICANDO MIGRAÇÃO DE SINCRONIZAÇÃO DE USUÁRIOS');
    console.log('=' .repeat(60));
    
    // Ler o arquivo de migração
    const migrationPath = path.join(__dirname, '..', 'database', 'migrations', '005_create_user_sync_trigger.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Lendo migração:', migrationPath);
    
    // Dividir o SQL em comandos individuais
    const commands = migrationSQL
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
    
    console.log(`📝 Encontrados ${commands.length} comandos SQL para executar`);
    
    // Executar cada comando
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i] + ';';
      console.log(`\n${i + 1}/${commands.length} Executando comando...`);
      
      try {
        const { data, error } = await supabaseAdmin.rpc('exec', { sql: command });
        
        if (error) {
          console.log(`❌ Erro no comando ${i + 1}:`, error.message);
          
          // Alguns erros são esperados (como DROP TRIGGER IF EXISTS)
          if (error.message.includes('does not exist')) {
            console.log('ℹ️  Erro esperado (objeto não existe), continuando...');
          } else {
            throw error;
          }
        } else {
          console.log(`✅ Comando ${i + 1} executado com sucesso`);
        }
      } catch (cmdError) {
        console.log(`❌ Erro crítico no comando ${i + 1}:`, cmdError.message);
        
        // Tentar executar usando uma abordagem alternativa
        try {
          console.log('🔄 Tentando abordagem alternativa...');
          
          // Para comandos de função, tentar executar diretamente
          if (command.includes('CREATE OR REPLACE FUNCTION')) {
            const { error: altError } = await supabaseAdmin
              .from('pg_stat_user_functions')
              .select('*')
              .limit(1);
            
            if (altError && altError.code === 'PGRST116') {
              console.log('⚠️  Não é possível executar funções via API REST');
              console.log('💡 Execute esta migração manualmente no SQL Editor do Supabase');
              break;
            }
          }
        } catch (altError) {
          console.log('❌ Abordagem alternativa também falhou:', altError.message);
        }
      }
    }
    
    // Verificar se a sincronização funcionou
    console.log('\n🔍 VERIFICANDO RESULTADO DA MIGRAÇÃO...');
    
    // Contar usuários antes e depois
    const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
    const { data: publicUsers } = await supabaseAdmin
      .from('users')
      .select('*');
    
    console.log(`📊 Usuários em auth.users: ${authUsers?.users?.length || 0}`);
    console.log(`📊 Usuários em public.users: ${publicUsers?.length || 0}`);
    
    if (authUsers?.users?.length === publicUsers?.length) {
      console.log('✅ SUCESSO: Todos os usuários foram sincronizados!');
    } else {
      console.log('⚠️  Ainda há discrepância entre as tabelas');
      console.log('💡 Pode ser necessário executar a migração manualmente');
    }
    
    // Testar o trigger criando um usuário
    console.log('\n🧪 TESTANDO TRIGGER COM USUÁRIO DE TESTE...');
    
    const testEmail = `test-trigger-${Date.now()}@zipfood.com`;
    
    const { data: newUser, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
      email: testEmail,
      password: 'teste123456',
      user_metadata: {
        name: 'Teste Trigger',
        user_type: 'customer',
        phone: '(16) 99999-9999'
      }
    });
    
    if (signUpError) {
      console.log('❌ Erro ao criar usuário de teste:', signUpError.message);
    } else {
      console.log('✅ Usuário de teste criado em auth.users');
      
      // Aguardar um pouco para o trigger executar
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Verificar se foi criado em public.users
      const { data: testUserInPublic } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('email', testEmail)
        .single();
      
      if (testUserInPublic) {
        console.log('✅ TRIGGER FUNCIONANDO: Usuário foi sincronizado automaticamente!');
        
        // Limpar usuário de teste
        await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
        await supabaseAdmin
          .from('users')
          .delete()
          .eq('email', testEmail);
        
        console.log('🧹 Usuário de teste removido');
      } else {
        console.log('❌ TRIGGER NÃO FUNCIONOU: Usuário não foi sincronizado');
      }
    }
    
  } catch (error) {
    console.error('❌ Erro geral na aplicação da migração:', error);
    console.log('\n💡 INSTRUÇÕES MANUAIS:');
    console.log('1. Acesse o SQL Editor no painel do Supabase');
    console.log('2. Execute o conteúdo do arquivo database/migrations/005_create_user_sync_trigger.sql');
    console.log('3. Verifique se os triggers foram criados corretamente');
  }
}

applyMigration();