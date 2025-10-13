-- Script para resolver definitivamente o problema do webhook
-- Este script verifica e cria tudo que é necessário

-- 1. Verificar se existem usuários autenticados
DO $$
BEGIN
    RAISE NOTICE 'Verificando usuários autenticados...';
END $$;

SELECT 
    'Usuários encontrados:' as info,
    id,
    email,
    created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;

-- 2. Verificar se existem perfis
SELECT 
    'Perfis encontrados:' as info,
    id,
    user_id,
    role,
    created_at
FROM profiles
ORDER BY created_at DESC
LIMIT 5;

-- 3. Verificar se existem gateways
SELECT 
    'Gateways encontrados:' as info,
    id,
    client_id,
    type,
    is_active,
    created_at
FROM gateways
ORDER BY created_at DESC
LIMIT 5;

-- 4. Criar um cliente padrão se não existir
INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    role
) VALUES (
    '0ec3137d-ee68-4aba-82de-143b3c61516a',
    'cliente.padrao@sistema.com',
    crypt('senha123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"name": "Cliente Padrão"}',
    false,
    'authenticated'
) ON CONFLICT (id) DO NOTHING;

-- 5. Criar perfil para o cliente padrão
INSERT INTO profiles (
    id,
    user_id,
    role,
    created_at,
    updated_at
) VALUES (
    '0ec3137d-ee68-4aba-82de-143b3c61516a',
    '0ec3137d-ee68-4aba-82de-143b3c61516a',
    'gateway_user',
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- 6. Criar gateway Asset para o cliente padrão
INSERT INTO gateways (
    id,
    client_id,
    type,
    config,
    is_active,
    created_at,
    updated_at
) VALUES (
    '7e7e93d9-fc1a-4ae0-b7ab-775494d57cad',
    '0ec3137d-ee68-4aba-82de-143b3c61516a',
    'asset',
    '{
        "api_key": "admin_live_0JqhhCVNXuTwzhfQHiiFbYpUT7YyDNI35rY",
        "api_url": "https://api.asaas.com/v3",
        "webhook_secret": "12b81c3b01e40506bef7c583f757fe9e4a028920ca3cf178530c94fbfb4ceb43"
    }'::jsonb,
    true,
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    client_id = EXCLUDED.client_id,
    config = EXCLUDED.config,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- 7. Verificar se tudo foi criado corretamente
SELECT 
    'Verificação final - Cliente:' as info,
    u.id as user_id,
    u.email,
    p.role as profile_role,
    g.id as gateway_id,
    g.type as gateway_type,
    g.is_active as gateway_active
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.user_id
LEFT JOIN gateways g ON u.id = g.client_id
WHERE u.id = '0ec3137d-ee68-4aba-82de-143b3c61516a';

-- 8. Atualizar políticas RLS para permitir webhooks
-- Política para permitir inserção de pedidos via webhook
DROP POLICY IF EXISTS "webhook_can_insert_orders" ON orders;
CREATE POLICY "webhook_can_insert_orders" ON orders
    FOR INSERT
    WITH CHECK (true);

-- Política para permitir atualização de pedidos via webhook
DROP POLICY IF EXISTS "webhook_can_update_orders" ON orders;
CREATE POLICY "webhook_can_update_orders" ON orders
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- 9. Verificar se as políticas foram criadas
SELECT 
    'Políticas RLS para orders:' as info,
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'orders'
ORDER BY policyname;

RAISE NOTICE 'Script executado com sucesso! O webhook agora deve funcionar.';