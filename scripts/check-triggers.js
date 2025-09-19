require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTriggers() {
  try {
    console.log('🔍 Verificando triggers e funções relacionadas à criação de usuários...');
    
    // Verificar se existe algum trigger na tabela auth.users
    console.log('\n1️⃣ Verificando triggers na tabela auth.users...');
    const { data: authTriggers, error: authTriggersError } = await supabaseAdmin
      .rpc('exec', {
        sql: `
          SELECT 
            trigger_name,
            event_manipulation,
            action_statement,
            action_timing
          FROM information_schema.triggers 
          WHERE event_object_table = 'users' 
          AND event_object_schema = 'auth';
        `
      });
    
    if (authTriggersError) {
      console.log('❌ Erro ao verificar triggers auth.users:', authTriggersError.message);
    } else {
      console.log('📋 Triggers encontrados na tabela auth.users:', authTriggers?.length || 0);
      if (authTriggers && authTriggers.length > 0) {
        authTriggers.forEach(trigger => {
          console.log(`  - ${trigger.trigger_name}: ${trigger.event_manipulation} ${trigger.action_timing}`);
        });
      }
    }
    
    // Verificar se existe algum trigger na tabela public.users
    console.log('\n2️⃣ Verificando triggers na tabela public.users...');
    const { data: publicTriggers, error: publicTriggersError } = await supabaseAdmin
      .rpc('exec', {
        sql: `
          SELECT 
            trigger_name,
            event_manipulation,
            action_statement,
            action_timing
          FROM information_schema.triggers 
          WHERE event_object_table = 'users' 
          AND event_object_schema = 'public';
        `
      });
    
    if (publicTriggersError) {
      console.log('❌ Erro ao verificar triggers public.users:', publicTriggersError.message);
    } else {
      console.log('📋 Triggers encontrados na tabela public.users:', publicTriggers?.length || 0);
      if (publicTriggers && publicTriggers.length > 0) {
        publicTriggers.forEach(trigger => {
          console.log(`  - ${trigger.trigger_name}: ${trigger.event_manipulation} ${trigger.action_timing}`);
        });
      }
    }
    
    // Verificar funções que podem estar relacionadas
    console.log('\n3️⃣ Verificando funções relacionadas a usuários...');
    const { data: functions, error: functionsError } = await supabaseAdmin
      .rpc('exec', {
        sql: `
          SELECT 
            routine_name,
            routine_type,
            routine_definition
          FROM information_schema.routines 
          WHERE routine_schema = 'public' 
          AND (routine_name ILIKE '%user%' OR routine_name ILIKE '%customer%')
          ORDER BY routine_name;
        `
      });
    
    if (functionsError) {
      console.log('❌ Erro ao verificar funções:', functionsError.message);
    } else {
      console.log('📋 Funções encontradas:', functions?.length || 0);
      if (functions && functions.length > 0) {
        functions.forEach(func => {
          console.log(`  - ${func.routine_name} (${func.routine_type})`);
        });
      }
    }
    
    // Verificar estrutura da tabela customers
    console.log('\n4️⃣ Verificando estrutura da tabela customers...');
    const { data: customerStructure, error: structureError } = await supabaseAdmin
      .rpc('exec', {
        sql: `
          SELECT 
            column_name,
            data_type,
            is_nullable,
            column_default
          FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'customers'
          ORDER BY ordinal_position;
        `
      });
    
    if (structureError) {
      console.log('❌ Erro ao verificar estrutura:', structureError.message);
    } else {
      console.log('📋 Estrutura da tabela customers:');
      if (customerStructure && customerStructure.length > 0) {
        customerStructure.forEach(col => {
          console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(NOT NULL)' : '(NULLABLE)'} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

checkTriggers();