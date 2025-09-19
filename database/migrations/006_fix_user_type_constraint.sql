-- database/migrations/006_fix_user_type_constraint.sql
-- Corrige o constraint user_type para aceitar 'delivery_driver' em vez de 'delivery'

-- Remove o constraint antigo
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_user_type_check;

-- Adiciona o novo constraint com os valores corretos
ALTER TABLE public.users ADD CONSTRAINT users_user_type_check 
CHECK (user_type IN ('customer', 'restaurant', 'delivery_driver'));

-- Atualiza registros existentes que possam ter 'delivery' para 'delivery_driver'
UPDATE public.users 
SET user_type = 'delivery_driver' 
WHERE user_type = 'delivery';

-- Comentário explicativo
COMMENT ON CONSTRAINT users_user_type_check ON public.users IS 
'Permite os tipos de usuário: customer, restaurant, delivery_driver';