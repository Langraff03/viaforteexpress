-- ============================================================================
-- SCRIPT SIMPLES PARA CRIAR PERFIS DE USUÁRIOS
-- ============================================================================
-- Execute este script APÓS criar os usuários na autenticação do Supabase

-- IMPORTANTE: Este script busca automaticamente os UUIDs dos usuários criados

-- 1. CRIAR PERFIL ADMINISTRADOR (busca automaticamente o UUID)
INSERT INTO public.profiles (id, role, client_id, gateway_id, full_name, updated_at)
SELECT 
    u.id,
    'admin'::public.app_role,
    '0ec3137d-ee68-4aba-82de-143b3c61516a',  -- Cliente padrão
    NULL,  -- Admin não precisa de gateway específico
    'Administrador do Sistema',
    now()
FROM auth.users u
WHERE u.email = 'admin@rapidtransporte.com'
ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    client_id = EXCLUDED.client_id,
    full_name = EXCLUDED.full_name,
    updated_at = EXCLUDED.updated_at;

-- 2. CRIAR PERFIL USUÁRIO GATEWAY (busca automaticamente o UUID)
INSERT INTO public.profiles (id, role, client_id, gateway_id, full_name, updated_at)
SELECT 
    u.id,
    'gateway_user'::public.app_role,
    '0ec3137d-ee68-4aba-82de-143b3c61516a',  -- Cliente padrão
    '7e7e93d9-fc1a-4ae0-b7ab-775494d57cad',  -- Gateway Asset padrão
    'Usuário Gateway Asset',
    now()
FROM auth.users u
WHERE u.email = 'gateway@rapidtransporte.com'
ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    client_id = EXCLUDED.client_id,
    gateway_id = EXCLUDED.gateway_id,
    full_name = EXCLUDED.full_name,
    updated_at = EXCLUDED.updated_at;

-- 3. VERIFICAR SE OS PERFIS FORAM CRIADOS
SELECT 
    'Perfis criados com sucesso!' as status,
    p.role,
    p.full_name,
    u.email,
    c.name as client_name,
    COALESCE(g.name, 'Todos os gateways') as gateway_access
FROM public.profiles p
JOIN auth.users u ON p.id = u.id
LEFT JOIN public.clients c ON p.client_id = c.id
LEFT JOIN public.gateways g ON p.gateway_id = g.id
WHERE u.email IN ('admin@rapidtransporte.com', 'gateway@rapidtransporte.com')
ORDER BY p.role;

-- 4. VERIFICAR ESTRUTURA COMPLETA
SELECT 'Sistema configurado:' as info;
SELECT 'Cliente:' as tipo, name as nome FROM public.clients WHERE id = '0ec3137d-ee68-4aba-82de-143b3c61516a'
UNION ALL
SELECT 'Gateway:', name FROM public.gateways WHERE id = '7e7e93d9-fc1a-4ae0-b7ab-775494d57cad'
UNION ALL
SELECT 'Admin:', full_name FROM public.profiles WHERE role = 'admin'
UNION ALL
SELECT 'Gateway User:', full_name FROM public.profiles WHERE role = 'gateway_user';

COMMIT;

-- ============================================================================
-- INSTRUÇÕES DE USO:
-- ============================================================================
-- 1. Primeiro, crie os usuários na autenticação do Supabase:
--    - admin@rapidtransporte.com (senha: admin123456)
--    - gateway@rapidtransporte.com (senha: gateway123456)
-- 
-- 2. Depois execute este script no SQL Editor
-- 
-- 3. Os perfis serão criados automaticamente com os UUIDs corretos
-- ============================================================================