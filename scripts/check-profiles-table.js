require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkProfilesTable() {
  try {
    console.log('🔍 Verificando tabela profiles...');
    
    // Tentar buscar qualquer perfil existente para ver a estrutura
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Erro ao consultar tabela profiles:', error);
      console.log('📝 A tabela profiles pode não existir ou não ter permissões adequadas');
      return;
    }
    
    if (profiles && profiles.length > 0) {
      console.log('📋 Estrutura da tabela profiles (campos disponíveis):');
      console.log(Object.keys(profiles[0]));
      console.log('\n📄 Exemplo de perfil existente:');
      console.log(JSON.stringify(profiles[0], null, 2));
    } else {
      console.log('📭 Tabela profiles está vazia');
      
      // Verificar se a tabela existe tentando inserir um registro de teste
      console.log('\n🧪 Testando se a tabela profiles existe...');
      
      const { data: newProfile, error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: '00000000-0000-0000-0000-000000000000', // UUID fictício
          user_type: 'customer',
          name: 'Teste Profile'
        })
        .select()
        .single();
      
      if (insertError) {
        console.error('❌ Erro ao inserir na tabela profiles:', insertError);
        if (insertError.code === '42P01') {
          console.log('📝 A tabela profiles não existe!');
        }
      } else {
        console.log('✅ Tabela profiles existe e aceita inserções');
        console.log('📄 Dados inseridos:', newProfile);
        
        // Remover o registro de teste
        await supabase
          .from('profiles')
          .delete()
          .eq('id', '00000000-0000-0000-0000-000000000000');
        console.log('🧹 Registro de teste removido');
      }
    }
    
  } catch (err) {
    console.error('❌ Erro na verificação:', err);
  }
}

checkProfilesTable();