-- Migração: Criação da tabela restaurants com todos os campos necessários
-- Data: 2025-01-17
-- Descrição: Tabela para armazenar informações dos restaurantes parceiros

-- Criação da tabela restaurants
CREATE TABLE IF NOT EXISTS public.restaurants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    country VARCHAR(100) DEFAULT 'Brasil',
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    cuisine_type VARCHAR(100) NOT NULL,
    category VARCHAR(100),
    operating_hours JSONB DEFAULT '{}',
    phone VARCHAR(20),
    email VARCHAR(255),
    delivery_fee DECIMAL(10, 2) DEFAULT 0.00,
    minimum_order DECIMAL(10, 2) DEFAULT 0.00,
    delivery_radius_km DECIMAL(5, 2) DEFAULT 5.00,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
    is_active BOOLEAN DEFAULT true,
    user_id UUID,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para otimização de consultas
CREATE INDEX IF NOT EXISTS idx_restaurants_city ON public.restaurants(city);
CREATE INDEX IF NOT EXISTS idx_restaurants_cuisine_type ON public.restaurants(cuisine_type);
CREATE INDEX IF NOT EXISTS idx_restaurants_category ON public.restaurants(category);
CREATE INDEX IF NOT EXISTS idx_restaurants_status ON public.restaurants(status);
CREATE INDEX IF NOT EXISTS idx_restaurants_is_active ON public.restaurants(is_active);
CREATE INDEX IF NOT EXISTS idx_restaurants_user_id ON public.restaurants(user_id);
CREATE INDEX IF NOT EXISTS idx_restaurants_created_by ON public.restaurants(created_by);
CREATE INDEX IF NOT EXISTS idx_restaurants_location ON public.restaurants(latitude, longitude);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updated_at automaticamente
DROP TRIGGER IF EXISTS update_restaurants_updated_at ON public.restaurants;
CREATE TRIGGER update_restaurants_updated_at 
    BEFORE UPDATE ON public.restaurants 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS na tabela restaurants
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;

-- Política para permitir que todos vejam restaurantes ativos e aprovados
DROP POLICY IF EXISTS "Permitir visualização de restaurantes ativos" ON public.restaurants;
CREATE POLICY "Permitir visualização de restaurantes ativos" ON public.restaurants
    FOR SELECT USING (is_active = true AND status = 'approved');

-- Política para permitir que usuários autenticados criem restaurantes
DROP POLICY IF EXISTS "Permitir criação de restaurantes por usuários autenticados" ON public.restaurants;
CREATE POLICY "Permitir criação de restaurantes por usuários autenticados" ON public.restaurants
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Política para permitir que o criador edite seus próprios restaurantes
DROP POLICY IF EXISTS "Permitir edição pelo criador" ON public.restaurants;
CREATE POLICY "Permitir edição pelo criador" ON public.restaurants
    FOR UPDATE USING (created_by = auth.uid() OR user_id = auth.uid());

-- Política para permitir que o criador delete seus próprios restaurantes
DROP POLICY IF EXISTS "Permitir exclusão pelo criador" ON public.restaurants;
CREATE POLICY "Permitir exclusão pelo criador" ON public.restaurants
    FOR DELETE USING (created_by = auth.uid() OR user_id = auth.uid());