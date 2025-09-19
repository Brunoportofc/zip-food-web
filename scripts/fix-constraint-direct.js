require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixConstraintDirect() {
  try {
    console.log('🔧 CORRIGINDO CONSTRAINT USER_TYPE DIRETAMENTE');
    console.log('=' .repeat(50));
    
    // 1. Primeiro, verificar o constraint atual
    console.log('1️⃣ Verificando constraint atual...');
    
    const { data: constraints, error: constraintError } = await supabaseAdmin
      .from('information_schema.check_constraints')
      .select('constraint_name, check_clause')
      .eq('constraint_name', 'users_user_type_check');
    
    if (constraintError) {
      console.log(`❌ Erro ao verificar constraint: ${constraintError.message}`);
    } else {
      console.log('📋 Constraints encontrados:', constraints);
    }
    
    // 2. Remover constraint antigo
    console.log('\n2️⃣ Removendo constraint antigo...');
    
    const { error: dropError } = await supabaseAdmin
      .rpc('exec_sql', { 
        sql: 'ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_user_type_check;' 
      });
    
    if (dropError) {
      console.log(`❌ Erro ao remover constraint: ${dropError.message}`);
    } else {
      console.log('✅ Constraint antigo removido');
    }
    
    // 3. Adicionar novo constraint
    console.log('\n3️⃣ Adicionando novo constraint...');
    
    const { error: addError } = await supabaseAdmin
      .rpc('exec_sql', { 
        sql: "ALTER TABLE public.users ADD CONSTRAINT users_user_type_check CHECK (user_type IN ('customer', 'restaurant', 'delivery_driver'));" 
      });
    
    if (addError) {
      console.log(`❌ Erro ao adicionar constraint: ${addError.message}`);
    } else {
      console.log('✅ Novo constraint adicionado');
    }
    
    // 4. Testar o novo constraint
    console.log('\n4️⃣ Testando novo constraint...');
    
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
      console.log('✅ Constraint funcionando! delivery_driver aceito');
      
      // Remover usuário de teste
      await supabaseAdmin
        .from('users')
        .delete()
        .eq('id', testUser.id);
      
      console.log('🧹 Usuário de teste removido');
    }
    
    console.log('\n🎯 CORREÇÃO FINALIZADA!');
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

fixConstraintDirect();