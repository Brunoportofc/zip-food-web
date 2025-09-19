require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function applyConstraintFix() {
  try {
    console.log('🔧 APLICANDO CORREÇÃO DO CONSTRAINT USER_TYPE');
    console.log('=' .repeat(50));
    
    // Ler o arquivo de migração
    const migrationPath = 'database/migrations/006_fix_user_type_constraint.sql';
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Migração carregada:', migrationPath);
    
    // Dividir em comandos individuais
    const commands = migrationSQL
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd && !cmd.startsWith('--') && !cmd.startsWith('COMMENT'));
    
    console.log(`📋 ${commands.length} comandos para executar\n`);
    
    // Executar cada comando
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      if (!command) continue;
      
      console.log(`${i + 1}️⃣ Executando: ${command.substring(0, 60)}...`);
      
      try {
        const { error } = await supabaseAdmin.rpc('exec', { sql: command });
        
        if (error) {
          console.log(`❌ Erro: ${error.message}`);
        } else {
          console.log('✅ Sucesso');
        }
      } catch (cmdError) {
        console.log(`❌ Erro na execução: ${cmdError.message}`);
      }
    }
    
    // Verificar se a correção funcionou
    console.log('\n🔍 VERIFICANDO CORREÇÃO...');
    
    try {
      // Tentar inserir um usuário de teste com delivery_driver
      const testUser = {
        id: '00000000-0000-0000-0000-000000000001',
        email: 'test-constraint@test.com',
        user_type: 'delivery_driver',
        name: 'Teste Constraint',
        password_hash: 'test'
      };
      
      const { error: insertError } = await supabaseAdmin
        .from('users')
        .insert(testUser);
      
      if (insertError) {
        console.log(`❌ Constraint ainda não funciona: ${insertError.message}`);
      } else {
        console.log('✅ Constraint corrigido! delivery_driver aceito');
        
        // Remover usuário de teste
        await supabaseAdmin
          .from('users')
          .delete()
          .eq('id', testUser.id);
        
        console.log('🧹 Usuário de teste removido');
      }
    } catch (testError) {
      console.log(`❌ Erro no teste: ${testError.message}`);
    }
    
    console.log('\n🎯 CORREÇÃO DO CONSTRAINT FINALIZADA!');
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

applyConstraintFix();