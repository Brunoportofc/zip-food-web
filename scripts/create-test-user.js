require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createTestUser() {
  try {
    console.log('🔍 Verificando se usuário já existe...');
    
    const testPhone = '(16) 98200-7961';
    const testEmail = 'teste.zipfood@exemplo.com';
    
    // Verificar se usuário já existe
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('phone', testPhone)
      .single();
    
    if (existingUser) {
      console.log('✅ Usuário de teste já existe:', existingUser);
      return;
    }
    
    console.log('👤 Criando usuário de teste...');
    
    // Gerar hash da senha
    const hashedPassword = await bcrypt.hash('123456', 10);
    
    // Criar usuário de teste com todos os campos obrigatórios
    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        name: 'Usuário Teste ZipFood',
        email: testEmail,
        phone: testPhone,
        password_hash: hashedPassword,
        user_type: 'customer',
        address: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) {
      console.error('❌ Erro ao criar usuário:', error);
      return;
    }
    
    console.log('✅ Usuário de teste criado com sucesso!');
    console.log('📄 Dados do usuário:', {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      phone: newUser.phone,
      user_type: newUser.user_type
    });
    
    console.log('\n🎯 Agora você pode testar a redefinição de senha com:');
    console.log(`   Telefone: ${testPhone}`);
    console.log(`   Email: ${testEmail}`);
    
  } catch (error) {
    console.error('💥 Erro geral:', error);
  }
}

createTestUser();