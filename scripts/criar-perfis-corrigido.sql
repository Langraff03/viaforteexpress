-- ============================================================================
-- CRIAR PERFIS COM TIPOS CORRETOS (UUID)
-- ============================================================================

-- 1. VERIFICAR USUÁRIOS EXISTENTES
SELECT 'Usuários na autenticação:' as status;
SELECT id, email, created_at 
FROM auth.users 
ORDER BY created_at;

-- 2. CORRIGIR FOREIGN KEY CONSTRAINT
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_id_fkey 
FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 3. CRIAR PERFIL ADMIN (primeiro usuário ou que contenha admin/lucas)
INSERT INTO public.profiles (id, role, client_id, gateway_id, full_name, updated_at)
SELECT 
    u.id,
    'admin'::public.app_role,
    '0ec3137d-ee68-4aba-82de-143b3c61516a'::uuid,
    NULL::uuid,
    'Administrador do Sistema',
    now()
FROM auth.users u
WHERE u.email ILIKE '%admin%' OR u.email ILIKE '%lucas%'
ORDER BY u.created_at
LIMIT 1
ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    client_id = EXCLUDED.client_id,
    gateway_id = EXCLUDED.gateway_id,
    full_name = EXCLUDED.full_name,
    updated_at = EXCLUDED.updated_at;

-- 4. CRIAR PERFIL GATEWAY USER (usuário que contenha asset/gateway)
INSERT INTO public.profiles (id, role, client_id, gateway_id, full_name, updated_at)
SELECT 
    u.id,
    'gateway_user'::public.app_role,
    '0ec3137d-ee68-4aba-82de-143b3c61516a'::uuid,
    '7e7e93d9-fc1a-4ae0-b7ab-775494d57cad'::uuid,
    'Usuário Gateway Asset',
    now()
FROM auth.users u
WHERE u.email ILIKE '%asset%' OR u.email ILIKE '%gateway%'
ORDER BY u.created_at
LIMIT 1
ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    client_id = EXCLUDED.client_id,
    gateway_id = EXCLUDED.gateway_id,
    full_name = EXCLUDED.full_name,
    updated_at = EXCLUDED.updated_at;

-- 5. FALLBACK: Se não encontrou usuários específicos, usar os primeiros 2
WITH numbered_users AS (
    SELECT 
        u.id,
        u.email,
        ROW_NUMBER() OVER (ORDER BY u.created_at) as rn
    FROM auth.users u
    WHERE NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = u.id)
    LIMIT 2
)
INSERT INTO public.profiles (id, role, client_id, gateway_id, full_name, updated_at)
SELECT 
    nu.id,
    CASE 
        WHEN nu.rn = 1 THEN 'admin'::public.app_role
        ELSE 'gateway_user'::public.app_role
    END,
    '0ec3137d-ee68-4aba-82de-143b3c61516a'::uuid,
    CASE 
        WHEN nu.rn = 1 THEN NULL::uuid
        ELSE '7e7e93d9-fc1a-4ae0-b7ab-775494d57cad'::uuid
    END,
    CASE 
        WHEN nu.rn = 1 THEN 'Administrador do Sistema'
        ELSE 'Usuário Gateway Asset'
    END,
    now()
FROM numbered_users nu
ON CONFLICT (id) DO NOTHING;

-- 6. VERIFICAR PERFIS CRIADOS
SELECT 'Perfis criados com sucesso:' as status;
SELECT 
    p.id,
    p.role,
    p.full_name,
    u.email,
    c.name as client_name,
    COALESCE(g.name, 'Acesso Total') as gateway_access
FROM public.profiles p
JOIN auth.users u ON p.id = u.id
LEFT JOIN public.clients c ON p.client_id = c.id
LEFT JOIN public.gateways g ON p.gateway_id = g.id
ORDER BY p.role;

-- 7. GARANTIR QUE O GATEWAY ESTEJA ATIVO
UPDATE public.gateways 
SET is_active = true,
    config = jsonb_build_object(
        'api_key', 'admin_live_0JqhhCVNXuTwzhfQHiiFbYpUT7YyDNI35rY',
        'api_url', 'https://api.asaas.com/v3',
        'webhook_secret', '12b81c3b01e40506bef7c583f757fe9e4a028920ca3cf178530c94fbfb4ceb43'
    )
WHERE id = '7e7e93d9-fc1a-4ae0-b7ab-775494d57cad';

-- 8. TESTAR INSERÇÃO DE PEDIDO
INSERT INTO public.orders (
    id,
    client_id,
    gateway_id,
    external_id,
    amount,
    status,
    customer_name,
    customer_email,
    city,
    state,
    tracking_code,
    payment_id,
    payment_status,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    '0ec3137d-ee68-4aba-82de-143b3c61516a'::uuid,
    '7e7e93d9-fc1a-4ae0-b7ab-775494d57cad'::uuid,
    'TEST-FINAL-' || extract(epoch from now())::text,
    5699,
    'paid'::public.order_status,
    'Teste Final Corrigido',
    'teste@final.com',
    'São Paulo',
    'SP',
    'FINALOK',
    'PAY-FINAL-' || extract(epoch from now())::text,
    'paid',
    now(),
    now()
);

-- 9. VERIFICAR TESTE
SELECT 'Teste de inserção funcionou:' as status;
SELECT 
    id, 
    customer_name, 
    payment_id, 
    status, 
    tracking_code,
    created_at
FROM public.orders 
WHERE external_id LIKE 'TEST-FINAL-%'
ORDER BY created_at DESC
LIMIT 1;

-- 10. LIMPAR TESTE
DELETE FROM public.orders WHERE external_id LIKE 'TEST-FINAL-%';

-- 11. VERIFICAÇÃO FINAL COMPLETA
SELECT 'VERIFICAÇÃO FINAL DO SISTEMA:' as status;

SELECT 'Usuários na autenticação:' as item, 
       COUNT(*)::text as quantidade
FROM auth.users

UNION ALL

SELECT 'Perfis criados:', 
       COUNT(*)::text
FROM public.profiles

UNION ALL

SELECT 'Gateway ativo:', 
       CASE WHEN COUNT(*) > 0 THEN '✅ SIM' ELSE '❌ NÃO' END
FROM public.gateways 
WHERE id = '7e7e93d9-fc1a-4ae0-b7ab-775494d57cad' AND is_active = true

UNION ALL

SELECT 'Admin configurado:', 
       CASE WHEN COUNT(*) > 0 THEN '✅ SIM' ELSE '❌ NÃO' END
FROM public.profiles WHERE role = 'admin'

UNION ALL

SELECT 'Gateway user configurado:', 
       CASE WHEN COUNT(*) > 0 THEN '✅ SIM' ELSE '❌ NÃO' END
FROM public.profiles WHERE role = 'gateway_user'

UNION ALL

SELECT 'Política RLS webhook:', 
       CASE WHEN COUNT(*) > 0 THEN '✅ SIM' ELSE '❌ NÃO' END
FROM pg_policies 
WHERE tablename = 'orders' AND policyname = 'Permitir inserção via webhook';

-- 12. MOSTRAR CREDENCIAIS PARA LOGIN
SELECT 'CREDENCIAIS PARA LOGIN:' as info, '' as email, '' as acesso;

SELECT 
    CASE p.role 
        WHEN 'admin' THEN '👑 ADMINISTRADOR'
        WHEN 'gateway_user' THEN '🔧 GATEWAY USER'
        ELSE '👤 USUÁRIO'
    END as tipo,
    u.email as email,
    CASE p.role 
        WHEN 'admin' THEN '/admin'
        WHEN 'gateway_user' THEN '/gateway/dashboard'
        ELSE '/'
    END as acesso
FROM public.profiles p
JOIN auth.users u ON p.id = u.id
ORDER BY p.role;

-- 13. VERIFICAR CONFIGURAÇÃO DO GATEWAY
SELECT 'Configuração do Gateway Asset:' as status;
SELECT 
    id,
    name,
    type,
    is_active,
    config->>'api_key' as api_key_preview,
    config->>'webhook_secret' as webhook_secret_preview
FROM public.gateways 
WHERE id = '7e7e93d9-fc1a-4ae0-b7ab-775494d57cad';

COMMIT;

-- ============================================================================
-- RESULTADO ESPERADO:
-- ============================================================================
-- ✅ Foreign key constraint corrigida
-- ✅ Perfis criados com tipos UUID corretos
-- ✅ Gateway ativo e configurado
-- ✅ Admin e Gateway User funcionando
-- ✅ RLS permitindo inserção via webhook
-- ✅ Sistema 100% funcional
-- ============================================================================

-- ============================================================================
-- PRÓXIMOS PASSOS:
-- ============================================================================
-- 1. Execute: npm run devall
-- 2. Acesse: http://localhost:5173/login
-- 3. Use as credenciais mostradas acima
-- 4. Verifique se o webhook funciona sem erros
-- ============================================================================