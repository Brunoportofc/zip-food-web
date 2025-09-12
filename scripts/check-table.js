const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTable() {
  try {
    console.log('🔍 Verificando se a tabela sms_verification_codes existe...');
    
    // Tentar fazer select na tabela
    const { data, error } = await supabase
      .from('sms_verification_codes')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Tabela sms_verification_codes NÃO existe:', error.message);
      console.log('\n📋 INSTRUÇÕES:');
      console.log('1. Acesse o painel do Supabase: https://supabase.com/dashboard');
      console.log('2. Vá para seu projeto');
      console.log('3. Clique em "SQL Editor" no menu lateral');
      console.log('4. Execute o SQL que está no arquivo CREATE_TABLE.sql');
      console.log('\n📄 Conteúdo do SQL:');
      console.log('CREATE TABLE IF NOT EXISTS sms_verification_codes (');
      console.log('  id SERIAL PRIMARY KEY,');
      console.log('  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,');
      console.log('  phone VARCHAR(20) NOT NULL,');
      console.log('  code VARCHAR(6) NOT NULL,');
      console.log('  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,');
      console.log('  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),');
      console.log('  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()');
      console.log(');');
      return false;
    } else {
      console.log('✅ Tabela sms_verification_codes existe e está funcionando!');
      return true;
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar tabela:', error);
    return false;
  }
}

checkTable().then(exists => {
  if (exists) {
    console.log('🎉 Sistema pronto para usar SMS!');
  } else {
    console.log('⚠️  Crie a tabela primeiro antes de testar o SMS.');
  }
});