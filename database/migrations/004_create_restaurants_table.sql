-- database/migrations/004_create_restaurants_table.sql

-- Habilita a extensão para gerar UUIDs se ainda não estiver habilitada
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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
    
    -- ===================== CORREÇÃO ADICIONADA =====================
    -- Garante que todo restaurante esteja vinculado a um usuário.
    user_id UUID NOT NULL,
    created_by UUID NOT NULL,
    -- ===============================================================
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Adiciona a restrição de chave estrangeira para user_id
    CONSTRAINT fk_user
        FOREIGN KEY(user_id) 
        REFERENCES auth.users(id)
        ON DELETE CASCADE,

    -- Adiciona a restrição de chave estrangeira para created_by
    CONSTRAINT fk_creator
        FOREIGN KEY(created_by) 
        REFERENCES auth.users(id)
        ON DELETE SET NULL
);

-- Habilita a Segurança de Nível de Linha (RLS) na tabela de restaurantes
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;

-- Política de RLS: Permite que usuários autenticados leiam todos os restaurantes
CREATE POLICY "Allow authenticated read access"
ON public.restaurants
FOR SELECT
TO authenticated
USING (true);

-- Política de RLS: Permite que um usuário insira um novo restaurante para si mesmo
CREATE POLICY "Allow individual insert"
ON public.restaurants
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Política de RLS: Permite que um usuário atualize seu próprio restaurante
CREATE POLICY "Allow individual update"
ON public.restaurants
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Política de RLS: Permite que um usuário exclua seu próprio restaurante
CREATE POLICY "Allow individual delete"
ON public.restaurants
FOR DELETE
USING (auth.uid() = user_id);

-- Cria um gatilho para atualizar o campo updated_at automaticamente
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplica o gatilho à tabela
CREATE TRIGGER on_restaurants_updated
BEFORE UPDATE ON public.restaurants
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Adiciona comentários para clareza
COMMENT ON TABLE public.restaurants IS 'Stores information about partner restaurants.';
COMMENT ON COLUMN public.restaurants.user_id IS 'Foreign key to the user who owns the restaurant.';
COMMENT ON COLUMN public.restaurants.created_by IS 'Foreign key to the user who created the record.';