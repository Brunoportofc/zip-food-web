const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  console.log('Certifique-se de que NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY estão definidas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('🚀 Criando tabela sms_verification_codes...');
    
    // Criar a tabela diretamente usando SQL
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS sms_verification_codes (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        phone VARCHAR(20) NOT NULL,
        code VARCHAR(6) NOT NULL,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      CREATE INDEX IF NOT EXISTS idx_sms_verification_phone ON sms_verification_codes(phone);
      CREATE INDEX IF NOT EXISTS idx_sms_verification_code ON sms_verification_codes(code);
      CREATE INDEX IF NOT EXISTS idx_sms_verification_expires ON sms_verification_codes(expires_at);
    `;
    
    console.log('📝 Executando SQL para criar tabela...');
    
    // Usar o cliente SQL direto do Supabase
    const { error: createError } = await supabase.rpc('exec', {
      sql: createTableSQL
    });
    
    if (createError) {
      console.warn('⚠️  Aviso ao criar tabela:', createError.message);
    }
    
    // Verificar se a tabela foi criada testando uma inserção
    console.log('🔍 Testando se a tabela foi criada...');
    
    // Primeiro, vamos verificar se existe algum usuário para testar
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id')
      .limit(1);
    
    if (userError) {
      console.log('⚠️  Não foi possível verificar usuários:', userError.message);
    }
    
    // Tentar inserir um código de teste (se houver usuários)
    if (users && users.length > 0) {
      const testUserId = users[0].id;
      const { error: insertError } = await supabase
        .from('sms_verification_codes')
        .insert({
          user_id: testUserId,
          phone: '+5516982007961',
          code: '123456',
          expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString()
        });
      
      if (insertError) {
        console.error('❌ Erro ao inserir código de teste:', insertError.message);
      } else {
        console.log('✅ Tabela criada e funcionando!');
        
        // Limpar o código de teste
        await supabase
          .from('sms_verification_codes')
          .delete()
          .eq('code', '123456');
      }
    } else {
      // Se não há usuários, apenas tentar fazer select na tabela
      const { error: selectError } = await supabase
        .from('sms_verification_codes')
        .select('*')
        .limit(1);
      
      if (selectError) {
        console.error('❌ Tabela não foi criada:', selectError.message);
      } else {
        console.log('✅ Tabela criada com sucesso!');
      }
    }
    
    console.log('🎉 Migração concluída!');
    
  } catch (error) {
    console.error('❌ Erro ao executar migração:', error);
    process.exit(1);
  }
}

runMigration();