-- Execute este SQL no painel do Supabase (SQL Editor)
-- https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql

-- Criar tabela sms_verification_codes
CREATE TABLE IF NOT EXISTS sms_verification_codes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  phone VARCHAR(20) NOT NULL,
  code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_sms_verification_phone ON sms_verification_codes(phone);
CREATE INDEX IF NOT EXISTS idx_sms_verification_code ON sms_verification_codes(code);
CREATE INDEX IF NOT EXISTS idx_sms_verification_expires ON sms_verification_codes(expires_at);

-- Função para limpar códigos expirados (opcional)
CREATE OR REPLACE FUNCTION cleanup_expired_sms_codes()
RETURNS void AS $$
BEGIN
  DELETE FROM sms_verification_codes 
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_sms_verification_codes_updated_at
  BEFORE UPDATE ON sms_verification_codes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Verificar se a tabela foi criada
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'sms_verification_codes'
ORDER BY ordinal_position;