const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRLSPolicies() {
  try {
    console.log('=== VERIFICANDO POLÍTICAS RLS ===');
    
    // Tentar inserir um restaurante de teste diretamente
    const testData = {
      name: 'Teste RLS',
      description: 'Teste para verificar RLS',
      address: 'Rua Teste, 123',
      city: 'São Paulo',
      cuisine_type: 'brasileira',
      user_id: 'f9d604b8-2166-4863-82c8-31e2c89b4fe9',
      created_by: 'f9d604b8-2166-4863-82c8-31e2c89b4fe9',
      status: 'approved',
      is_active: true
    };
    
    console.log('Tentando inserir com service role key...');
    const { data, error } = await supabase
      .from('restaurants')
      .insert([testData])
      .select();
    
    if (error) {
      console.error('Erro na inserção:', error);
    } else {
      console.log('✅ Inserção bem-sucedida:', data);
      
      // Verificar se os campos foram realmente inseridos
      const { data: checkData, error: checkError } = await supabase
        .from('restaurants')
        .select('id, name, user_id, created_by')
        .eq('name', 'Teste RLS')
        .single();
      
      if (checkError) {
        console.error('Erro ao verificar inserção:', checkError);
      } else {
        console.log('Dados inseridos:', checkData);
      }
    }
    
  } catch (err) {
    console.error('Erro na verificação:', err);
  }
}

checkRLSPolicies();