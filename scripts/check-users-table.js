require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkUsersTable() {
  try {
    console.log('🔍 Verificando estrutura da tabela users...');
    
    // Tentar buscar qualquer usuário existente para ver a estrutura
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Erro ao consultar tabela users:', error);
      return;
    }
    
    if (users && users.length > 0) {
      console.log('📋 Estrutura da tabela users (campos disponíveis):');
      console.log(Object.keys(users[0]));
      console.log('\n📄 Exemplo de usuário existente:');
      console.log(JSON.stringify(users[0], null, 2));
    } else {
      console.log('📭 Tabela users está vazia');
      
      // Vamos tentar inserir um usuário com todos os campos possíveis
      console.log('\n🧪 Testando inserção com campos mínimos...');
      
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('123456', 10);
      
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          name: 'Usuário Teste',
          email: 'teste@zipfood.com',
          phone: '(16) 98200-7961',
          password_hash: hashedPassword,
          user_type: 'customer' // Tentando com user_type
        })
        .select()
        .single();
      
      if (insertError) {
        console.error('❌ Erro na inserção de teste:', insertError);
        
        // Tentar outros valores para user_type
        const userTypes = ['client', 'user', 'cliente', 'consumidor'];
        
        for (const type of userTypes) {
          console.log(`\n🔄 Tentando user_type: ${type}`);
          
          const { data, error } = await supabase
            .from('users')
            .insert({
              name: 'Usuário Teste',
              email: `teste${type}@zipfood.com`,
              phone: '(16) 98200-7961',
              password_hash: hashedPassword,
              user_type: type
            })
            .select()
            .single();
          
          if (!error) {
            console.log(`✅ Sucesso com user_type: ${type}`);
            console.log('📄 Usuário criado:', data);
            break;
          } else {
            console.log(`❌ Falhou com ${type}:`, error.message);
          }
        }
      } else {
        console.log('✅ Usuário de teste criado com sucesso!');
        console.log('📄 Dados:', newUser);
      }
    }
    
  } catch (error) {
    console.error('💥 Erro geral:', error);
  }
}

checkUsersTable();