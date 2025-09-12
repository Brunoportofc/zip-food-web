-- Migração para adicionar colunas de reset de senha
-- Data: 2024
-- Descrição: Adiciona campos para gerenciar tokens de redefinição de senha

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS reset_token TEXT,
ADD COLUMN IF NOT EXISTS reset_token_expires_at TIMESTAMPTZ;

-- Criar índice para melhorar performance na busca por tokens
CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users(reset_token) WHERE reset_token IS NOT NULL;

-- Comentários para documentação
COMMENT ON COLUMN users.reset_token IS 'Token temporário para redefinição de senha';
COMMENT ON COLUMN users.reset_token_expires_at IS 'Data de expiração do token de redefinição';