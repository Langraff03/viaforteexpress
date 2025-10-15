-- ============================================================================
-- CRIAR PERFIS COM OS DADOS REAIS DO GATEWAY ASSET
-- ============================================================================
-- Baseado nos dados mostrados nas imagens do Supabase

-- Dados identificados:
-- Cliente ID: 0ec3137d-ee68-4aba-82de-143b3c61516a (Rapid Transporte)
-- Gateway ID: 7e7e93d9-fc1a-4ae0-b7ab-775494d57cad (Gateway Asset Principal)

-- 1. CRIAR PERFIL ADMINISTRADOR
-- (busca automaticamente o UUID do usuário admin criado na autenticação)
INSERT INTO public.profiles (id, role, client_id, gateway_id, full_name, updated_at)
SELECT 
    u.id,
    'admin'::public.app_role,
    '0ec3137d-ee68-4aba-82de-143b3c61516a',  -- Cliente Rapid Transporte
    NULL,  -- Admin tem acesso a todos os gateways
    'Administrador do Sistema',
    now()
FROM auth.users u
WHERE u.email = 'admin@rapidtransporte.com'
ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    client_id = EXCLUDED.client_id,
    full_name = EXCLUDED.full_name,
    updated_at = EXCLUDED.updated_at;

-- 2. CRIAR PERFIL USUÁRIO GATEWAY ASSET
-- (busca automaticamente o UUID do usuário gateway criado na autenticação)
INSERT INTO public.profiles (id, role, client_id, gateway_id, full_name, updated_at)
SELECT 
    u.id,
    'gateway_user'::public.app_role,
    '0ec3137d-ee68-4aba-82de-143b3c61516a',  -- Cliente Rapid Transporte
    '7e7e93d9-fc1a-4ae0-b7ab-775494d57cad',  -- Gateway Asset Principal
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

-- 3. VERIFICAR SE OS PERFIS FORAM CRIADOS CORRETAMENTE
SELECT 
    'PERFIS CRIADOS COM SUCESSO!' as status,
    p.role as papel,
    p.full_name as nome_completo,
    u.email as email_usuario,
    c.name as cliente,
    COALESCE(g.name, 'Acesso Total') as gateway_acesso
FROM public.profiles p
JOIN auth.users u ON p.id = u.id
LEFT JOIN public.clients c ON p.client_id = c.id
LEFT JOIN public.gateways g ON p.gateway_id = g.id
WHERE u.email IN ('admin@rapidtransporte.com', 'gateway@rapidtransporte.com')
ORDER BY 
    CASE p.role 
        WHEN 'admin' THEN 1 
        WHEN 'gateway_user' THEN 2 
        ELSE 3 
    END;

-- 4. VERIFICAR ESTRUTURA COMPLETA DO SISTEMA
SELECT 'CONFIGURAÇÃO DO SISTEMA:' as info, '' as detalhes
UNION ALL
SELECT '📊 Cliente:', c.name FROM public.clients c WHERE c.id = '0ec3137d-ee68-4aba-82de-143b3c61516a'
UNION ALL
SELECT '💳 Gateway:', g.name FROM public.gateways g WHERE g.id = '7e7e93d9-fc1a-4ae0-b7ab-775494d57cad'
UNION ALL
SELECT '👑 Admin:', p.full_name FROM public.profiles p WHERE p.role = 'admin'
UNION ALL
SELECT '🔧 Gateway User:', p.full_name FROM public.profiles p WHERE p.role = 'gateway_user';

-- 5. VERIFICAR PERMISSÕES E ACESSOS
SELECT 
    'RESUMO DE ACESSOS:' as tipo,
    '' as usuario,
    '' as permissoes
UNION ALL
SELECT 
    '👑 ADMIN',
    u.email,
    'Acesso total ao sistema, todos os clientes e gateways'
FROM public.profiles p
JOIN auth.users u ON p.id = u.id
WHERE p.role = 'admin'
UNION ALL
SELECT 
    '🔧 GATEWAY USER',
    u.email,
    CONCAT('Acesso ao gateway: ', g.name, ' (', g.type, ')')
FROM public.profiles p
JOIN auth.users u ON p.id = u.id
JOIN public.gateways g ON p.gateway_id = g.id
WHERE p.role = 'gateway_user';

COMMIT;

-- ============================================================================
-- CREDENCIAIS PARA LOGIN:
-- ============================================================================
-- 
-- 👑 ADMINISTRADOR:
-- Email: admin@rapidtransporte.com
-- Senha: admin123456
-- Acesso: /admin (painel administrativo completo)
-- 
-- 🔧 USUÁRIO GATEWAY:
-- Email: gateway@rapidtransporte.com
-- Senha: gateway123456
-- Acesso: /gateway/dashboard (dashboard do Gateway Asset)
-- 
-- ============================================================================
-- PRÓXIMOS PASSOS:
-- ============================================================================
-- 1. Execute: npm run devall
-- 2. Acesse: http://localhost:5173/login
-- 3. Teste os logins com as credenciais acima
-- 4. Verifique se o redirecionamento funciona corretamente
-- ============================================================================