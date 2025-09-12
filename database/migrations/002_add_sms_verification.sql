-- Migração para sistema de redefinição de senha via SMS

-- Tornar o campo phone obrigatório na tabela users
ALTER TABLE users ALTER COLUMN phone SET NOT NULL;

-- Adicionar constraint para validar formato do telefone (formato brasileiro)
ALTER TABLE users ADD CONSTRAINT phone_format_check 
    CHECK (phone ~ '^\+55[1-9][0-9]{1}9?[0-9]{8}$');

-- Criar tabela para códigos de verificação SMS
CREATE TABLE IF NOT EXISTS sms_verification_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    phone VARCHAR(20) NOT NULL,
    code VARCHAR(6) NOT NULL,
    purpose VARCHAR(20) NOT NULL CHECK (purpose IN ('password_reset', 'phone_verification')),
    is_used BOOLEAN DEFAULT FALSE,
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para otimização
CREATE INDEX IF NOT EXISTS idx_sms_codes_user_id ON sms_verification_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_sms_codes_phone ON sms_verification_codes(phone);
CREATE INDEX IF NOT EXISTS idx_sms_codes_code ON sms_verification_codes(code);
CREATE INDEX IF NOT EXISTS idx_sms_codes_expires_at ON sms_verification_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_sms_codes_purpose ON sms_verification_codes(purpose);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_sms_verification_codes_updated_at 
    BEFORE UPDATE ON sms_verification_codes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Função para limpar códigos expirados automaticamente
CREATE OR REPLACE FUNCTION cleanup_expired_sms_codes()
RETURNS void AS $$
BEGIN
    DELETE FROM sms_verification_codes 
    WHERE expires_at < NOW() OR is_used = TRUE;
END;
$$ LANGUAGE plpgsql;

-- Função para gerar código de 6 dígitos
CREATE OR REPLACE FUNCTION generate_sms_code()
RETURNS VARCHAR(6) AS $$
BEGIN
    RETURN LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- Função para criar código de verificação
CREATE OR REPLACE FUNCTION create_sms_verification_code(
    p_user_id UUID,
    p_phone VARCHAR(20),
    p_purpose VARCHAR(20)
)
RETURNS VARCHAR(6) AS $$
DECLARE
    v_code VARCHAR(6);
    v_expires_at TIMESTAMP;
BEGIN
    -- Limpar códigos expirados primeiro
    PERFORM cleanup_expired_sms_codes();
    
    -- Invalidar códigos anteriores não utilizados para o mesmo usuário e propósito
    UPDATE sms_verification_codes 
    SET is_used = TRUE 
    WHERE user_id = p_user_id 
      AND purpose = p_purpose 
      AND is_used = FALSE;
    
    -- Gerar novo código
    v_code := generate_sms_code();
    v_expires_at := NOW() + INTERVAL '15 minutes';
    
    -- Inserir novo código
    INSERT INTO sms_verification_codes (
        user_id, phone, code, purpose, expires_at
    ) VALUES (
        p_user_id, p_phone, v_code, p_purpose, v_expires_at
    );
    
    RETURN v_code;
END;
$$ LANGUAGE plpgsql;

-- Função para verificar código SMS
CREATE OR REPLACE FUNCTION verify_sms_code(
    p_phone VARCHAR(20),
    p_code VARCHAR(6),
    p_purpose VARCHAR(20)
)
RETURNS BOOLEAN AS $$
DECLARE
    v_record RECORD;
    v_is_valid BOOLEAN := FALSE;
BEGIN
    -- Buscar código válido
    SELECT * INTO v_record
    FROM sms_verification_codes
    WHERE phone = p_phone
      AND code = p_code
      AND purpose = p_purpose
      AND is_used = FALSE
      AND expires_at > NOW()
      AND attempts < max_attempts
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF FOUND THEN
        -- Marcar como usado
        UPDATE sms_verification_codes
        SET is_used = TRUE, updated_at = NOW()
        WHERE id = v_record.id;
        
        v_is_valid := TRUE;
    ELSE
        -- Incrementar tentativas se código existe mas está incorreto
        UPDATE sms_verification_codes
        SET attempts = attempts + 1, updated_at = NOW()
        WHERE phone = p_phone
          AND purpose = p_purpose
          AND is_used = FALSE
          AND expires_at > NOW();
    END IF;
    
    RETURN v_is_valid;
END;
$$ LANGUAGE plpgsql;

-- Políticas RLS para sms_verification_codes
ALTER TABLE sms_verification_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their SMS codes" ON sms_verification_codes 
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage SMS codes" ON sms_verification_codes 
    FOR ALL USING (TRUE);

-- Comentários para documentação
COMMENT ON TABLE sms_verification_codes IS 'Tabela para armazenar códigos de verificação SMS para redefinição de senha e verificação de telefone';
COMMENT ON COLUMN sms_verification_codes.code IS 'Código numérico de 6 dígitos';
COMMENT ON COLUMN sms_verification_codes.purpose IS 'Propósito do código: password_reset ou phone_verification';
COMMENT ON COLUMN sms_verification_codes.expires_at IS 'Data/hora de expiração do código (15 minutos após criação)';
COMMENT ON COLUMN sms_verification_codes.attempts IS 'Número de tentativas de verificação do código';
COMMENT ON COLUMN sms_verification_codes.max_attempts IS 'Número máximo de tentativas permitidas (padrão: 3)';