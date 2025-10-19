-- ============================================================================
-- SCRIPT PARA CRIAR PERFIS DE USUÁRIOS PADRÃO
-- ============================================================================
-- Execute este script no Supabase SQL Editor após criar os usuários na autenticação

-- IMPORTANTE: Substitua os UUIDs pelos IDs reais dos usuários criados na autenticação

-- 1. PERFIL ADMINISTRADOR
-- Substitua 'SEU_UUID_ADMIN_AQUI' pelo ID do usuário admin criado na autenticação
INSERT INTO public.profiles (id, role, client_id, gateway_id, full_name, updated_at) 
VALUES (
    'SEU_UUID_ADMIN_AQUI',  -- Substitua pelo ID real do usuário admin
    'admin'::public.app_role,
    '0ec3137d-ee68-4aba-82de-143b3c61516a',  -- Cliente padrão
    NULL,  -- Admin não tem gateway específico
    'Administrador do Sistema',
    now()
) ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    client_id = EXCLUDED.client_id,
    full_name = EXCLUDED.full_name,
    updated_at = EXCLUDED.updated_at;

-- 2. PERFIL USUÁRIO GATEWAY
-- Substitua 'SEU_UUID_GATEWAY_AQUI' pelo ID do usuário gateway criado na autenticação
INSERT INTO public.profiles (id, role, client_id, gateway_id, full_name, updated_at) 
VALUES (
    'SEU_UUID_GATEWAY_AQUI',  -- Substitua pelo ID real do usuário gateway
    'gateway_user'::public.app_role,
    '0ec3137d-ee68-4aba-82de-143b3c61516a',  -- Cliente padrão
    '7e7e93d9-fc1a-4ae0-b7ab-775494d57cad',  -- Gateway Asset padrão
    'Usuário Gateway Asset',
    now()
) ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    client_id = EXCLUDED.client_id,
    gateway_id = EXCLUDED.gateway_id,
    full_name = EXCLUDED.full_name,
    updated_at = EXCLUDED.updated_at;

-- 3. VERIFICAR SE OS PERFIS FORAM CRIADOS
SELECT 
    p.id,
    p.role,
    p.full_name,
    c.name as client_name,
    g.name as gateway_name
FROM public.profiles p
LEFT JOIN public.clients c ON p.client_id = c.id
LEFT JOIN public.gateways g ON p.gateway_id = g.id
ORDER BY p.role;

-- ============================================================================
-- INSTRUÇÕES PARA OBTER OS UUIDs DOS USUÁRIOS
-- ============================================================================

-- Para obter os IDs dos usuários criados na autenticação, execute:
-- (Isso só funciona se você tiver acesso à tabela auth.users)

-- SELECT id, email FROM auth.users WHERE email IN (
--     'admin@rapidtransporte.com',
--     'gateway@rapidtransporte.com'
-- );

-- ============================================================================
-- ALTERNATIVA: CRIAR USUÁRIOS COM IDs FIXOS
-- ============================================================================

-- Se você quiser usar IDs fixos (mais fácil para desenvolvimento), 
-- use estes comandos para criar os usuários na autenticação:

-- ADMIN (ID fixo)
-- UUID: a1b2c3d4-e5f6-7890-abcd-ef1234567890
INSERT INTO public.profiles (id, role, client_id, gateway_id, full_name, updated_at) 
VALUES (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'admin'::public.app_role,
    '0ec3137d-ee68-4aba-82de-143b3c61516a',
    NULL,
    'Administrador do Sistema',
    now()
) ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    client_id = EXCLUDED.client_id,
    full_name = EXCLUDED.full_name,
    updated_at = EXCLUDED.updated_at;

-- GATEWAY USER (ID fixo)
-- UUID: b2c3d4e5-f6g7-8901-bcde-f23456789012
INSERT INTO public.profiles (id, role, client_id, gateway_id, full_name, updated_at) 
VALUES (
    'b2c3d4e5-f6g7-8901-bcde-f23456789012',
    'gateway_user'::public.app_role,
    '0ec3137d-ee68-4aba-82de-143b3c61516a',
    '7e7e93d9-fc1a-4ae0-b7ab-775494d57cad',
    'Usuário Gateway Asset',
    now()
) ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    client_id = EXCLUDED.client_id,
    gateway_id = EXCLUDED.gateway_id,
    full_name = EXCLUDED.full_name,
    updated_at = EXCLUDED.updated_at;

-- ============================================================================
-- CREDENCIAIS PARA OS USUÁRIOS (criar manualmente na autenticação)
-- ============================================================================

-- ADMIN:
-- Email: admin@rapidtransporte.com
-- Senha: admin123456
-- ID: a1b2c3d4-e5f6-7890-abcd-ef1234567890

-- GATEWAY USER:
-- Email: gateway@rapidtransporte.com  
-- Senha: gateway123456
-- ID: b2c3d4e5-f6g7-8901-bcde-f23456789012

-- ============================================================================
-- VERIFICAÇÃO FINAL
-- ============================================================================

-- Verificar se tudo foi criado corretamente
SELECT 'Perfis criados:' as status;
SELECT 
    p.id,
    p.role,
    p.full_name,
    c.name as client_name,
    COALESCE(g.name, 'N/A') as gateway_name
FROM public.profiles p
LEFT JOIN public.clients c ON p.client_id = c.id
LEFT JOIN public.gateways g ON p.gateway_id = g.id
ORDER BY p.role;

COMMIT;