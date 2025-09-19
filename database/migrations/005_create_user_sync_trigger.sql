-- Migração para criar trigger de sincronização entre auth.users e public.users
-- Esta migração resolve o problema onde usuários são criados em auth.users mas não em public.users

-- 1. Criar função para sincronizar usuário
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Inserir novo usuário na tabela public.users
  INSERT INTO public.users (
    id,
    email,
    user_type,
    name,
    phone,
    password_hash,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'customer'),
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'phone',
    '$2b$10$default.hash.for.oauth.users', -- Hash padrão para usuários OAuth
    NEW.created_at,
    NEW.updated_at
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    user_type = EXCLUDED.user_type,
    name = EXCLUDED.name,
    phone = EXCLUDED.phone,
    updated_at = EXCLUDED.updated_at;

  -- Se o usuário for um restaurante, criar entrada na tabela restaurants
  IF COALESCE(NEW.raw_user_meta_data->>'user_type', 'customer') = 'restaurant' THEN
    INSERT INTO public.restaurants (
      id,
      user_id,
      name,
      description,
      address,
      phone,
      email,
      created_by,
      created_at,
      updated_at
    )
    VALUES (
      gen_random_uuid(),
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'restaurant_name', NEW.raw_user_meta_data->>'name', 'Novo Restaurante'),
      'Restaurante criado automaticamente',
      NEW.raw_user_meta_data->>'address',
      NEW.raw_user_meta_data->>'phone',
      NEW.email,
      NEW.id,
      NEW.created_at,
      NEW.updated_at
    )
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  -- Se o usuário for um entregador, criar entrada na tabela delivery_drivers
  IF COALESCE(NEW.raw_user_meta_data->>'user_type', 'customer') = 'delivery_driver' THEN
    INSERT INTO public.delivery_drivers (
      id,
      user_id,
      name,
      phone,
      email,
      vehicle_type,
      license_plate,
      created_at,
      updated_at
    )
    VALUES (
      gen_random_uuid(),
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
      NEW.raw_user_meta_data->>'phone',
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'vehicle_type', 'moto'),
      NEW.raw_user_meta_data->>'license_plate',
      NEW.created_at,
      NEW.updated_at
    )
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Criar trigger na tabela auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Criar função para atualizar usuário existente
CREATE OR REPLACE FUNCTION public.handle_user_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualizar usuário na tabela public.users
  UPDATE public.users SET
    email = NEW.email,
    name = COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', name),
    phone = COALESCE(NEW.raw_user_meta_data->>'phone', phone),
    updated_at = NEW.updated_at
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Criar trigger para atualizações
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_update();

-- 5. Sincronizar usuários existentes que não estão na tabela public.users
INSERT INTO public.users (
  id,
  email,
  user_type,
  name,
  phone,
  password_hash,
  created_at,
  updated_at
)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'user_type', 'customer') as user_type,
  COALESCE(
    au.raw_user_meta_data->>'name', 
    au.raw_user_meta_data->>'full_name', 
    split_part(au.email, '@', 1)
  ) as name,
  au.raw_user_meta_data->>'phone' as phone,
  '$2b$10$default.hash.for.oauth.users' as password_hash,
  au.created_at,
  au.updated_at
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- 6. Criar entradas para restaurantes existentes
INSERT INTO public.restaurants (
  id,
  user_id,
  name,
  description,
  address,
  phone,
  email,
  created_by,
  created_at,
  updated_at
)
SELECT 
  gen_random_uuid(),
  au.id,
  COALESCE(au.raw_user_meta_data->>'restaurant_name', au.raw_user_meta_data->>'name', 'Restaurante Migrado'),
  'Restaurante migrado automaticamente',
  au.raw_user_meta_data->>'address',
  au.raw_user_meta_data->>'phone',
  au.email,
  au.id,
  au.created_at,
  au.updated_at
FROM auth.users au
LEFT JOIN public.restaurants r ON au.id = r.user_id
WHERE r.user_id IS NULL 
  AND COALESCE(au.raw_user_meta_data->>'user_type', 'customer') = 'restaurant'
ON CONFLICT (user_id) DO NOTHING;

-- 7. Criar entradas para entregadores existentes
INSERT INTO public.delivery_drivers (
  id,
  user_id,
  name,
  phone,
  email,
  vehicle_type,
  license_plate,
  created_at,
  updated_at
)
SELECT 
  gen_random_uuid(),
  au.id,
  COALESCE(au.raw_user_meta_data->>'name', au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1)),
  au.raw_user_meta_data->>'phone',
  au.email,
  COALESCE(au.raw_user_meta_data->>'vehicle_type', 'moto'),
  au.raw_user_meta_data->>'license_plate',
  au.created_at,
  au.updated_at
FROM auth.users au
LEFT JOIN public.delivery_drivers dd ON au.id = dd.user_id
WHERE dd.user_id IS NULL 
  AND COALESCE(au.raw_user_meta_data->>'user_type', 'customer') = 'delivery_driver'
ON CONFLICT (user_id) DO NOTHING;

-- 8. Comentários explicativos
COMMENT ON FUNCTION public.handle_new_user() IS 'Função trigger para sincronizar novos usuários de auth.users para public.users e tabelas relacionadas';
COMMENT ON FUNCTION public.handle_user_update() IS 'Função trigger para sincronizar atualizações de usuários de auth.users para public.users';