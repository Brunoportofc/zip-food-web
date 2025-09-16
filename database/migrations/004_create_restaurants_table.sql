-- Migração 004: Criar tabela de restaurantes simplificada
-- Foco em simplicidade e internacionalização (preparado para Israel)

-- Criar tabela de restaurantes
CREATE TABLE IF NOT EXISTS restaurants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Informações básicas
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Localização (simplificada)
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    country VARCHAR(100) DEFAULT 'Israel',
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    
    -- Tipo de cozinha
    cuisine_type VARCHAR(100) NOT NULL,
    
    -- Horário de funcionamento (formato JSON para flexibilidade)
    operating_hours JSONB DEFAULT '{}',
    
    -- Contato
    phone VARCHAR(20),
    email VARCHAR(255),
    
    -- Status e configurações
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    accepts_orders BOOLEAN DEFAULT true,
    
    -- Configurações de delivery
    delivery_fee DECIMAL(10, 2) DEFAULT 0.00,
    minimum_order DECIMAL(10, 2) DEFAULT 0.00,
    delivery_radius_km INTEGER DEFAULT 5,
    
    -- Avaliações
    rating DECIMAL(3, 2) DEFAULT 0.00,
    total_reviews INTEGER DEFAULT 0,
    
    -- Metadados
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    
    -- Índices para performance
    CONSTRAINT restaurants_name_check CHECK (length(name) >= 2),
    CONSTRAINT restaurants_rating_check CHECK (rating >= 0 AND rating <= 5)
);

-- Criar índices para otimização de consultas
CREATE INDEX IF NOT EXISTS idx_restaurants_city ON restaurants(city);
CREATE INDEX IF NOT EXISTS idx_restaurants_cuisine_type ON restaurants(cuisine_type);
CREATE INDEX IF NOT EXISTS idx_restaurants_is_active ON restaurants(is_active);
CREATE INDEX IF NOT EXISTS idx_restaurants_location ON restaurants USING GIST (
    ll_to_earth(latitude, longitude)
) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_restaurants_created_at ON restaurants(created_at);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_restaurants_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_restaurants_updated_at
    BEFORE UPDATE ON restaurants
    FOR EACH ROW
    EXECUTE FUNCTION update_restaurants_updated_at();

-- Inserir dados de exemplo para testes (restaurantes israelenses)
INSERT INTO restaurants (
    name, 
    description, 
    address, 
    city, 
    country,
    cuisine_type, 
    operating_hours,
    phone,
    email,
    delivery_fee,
    minimum_order
) VALUES 
(
    'שווארמה הכרמל',
    'שווארמה אותנטית בסגנון ירושלמי',
    'רחוב הכרמל 15, תל אביב',
    'תל אביב',
    'Israel',
    'Middle Eastern',
    '{"sunday": {"open": "10:00", "close": "23:00"}, "monday": {"open": "10:00", "close": "23:00"}, "tuesday": {"open": "10:00", "close": "23:00"}, "wednesday": {"open": "10:00", "close": "23:00"}, "thursday": {"open": "10:00", "close": "23:00"}, "friday": {"open": "10:00", "close": "15:00"}, "saturday": {"closed": true}}',
    '+972-3-1234567',
    'carmel.shawarma@example.com',
    15.00,
    50.00
),
(
    'פיצה נפוליטנה',
    'פיצה איטלקית אותנתית בתנור עץ',
    'שדרות רוטשילד 45, תל אביב',
    'תל אביב',
    'Israel',
    'Italian',
    '{"sunday": {"open": "12:00", "close": "24:00"}, "monday": {"open": "12:00", "close": "24:00"}, "tuesday": {"open": "12:00", "close": "24:00"}, "wednesday": {"open": "12:00", "close": "24:00"}, "thursday": {"open": "12:00", "close": "24:00"}, "friday": {"open": "12:00", "close": "15:00"}, "saturday": {"closed": true}}',
    '+972-3-7654321',
    'napoletana.pizza@example.com',
    20.00,
    80.00
),
(
    'בורגר בר',
    'המבורגרים גורמה עם רכיבים טריים',
    'רחוב דיזנגוף 123, תל אביב',
    'תל אביב',
    'Israel',
    'American',
    '{"sunday": {"open": "11:00", "close": "23:00"}, "monday": {"open": "11:00", "close": "23:00"}, "tuesday": {"open": "11:00", "close": "23:00"}, "wednesday": {"open": "11:00", "close": "23:00"}, "thursday": {"open": "11:00", "close": "23:00"}, "friday": {"open": "11:00", "close": "15:00"}, "saturday": {"closed": true}}',
    '+972-3-9876543',
    'burger.bar@example.com',
    12.00,
    60.00
);

-- Comentários para documentação
COMMENT ON TABLE restaurants IS 'Tabela de restaurantes simplificada com foco em internacionalização';
COMMENT ON COLUMN restaurants.operating_hours IS 'Horários de funcionamento em formato JSON flexível';
COMMENT ON COLUMN restaurants.cuisine_type IS 'Tipo de cozinha (ex: Middle Eastern, Italian, American, Asian)';
COMMENT ON COLUMN restaurants.delivery_radius_km IS 'Raio de entrega em quilômetros';