-- ============================================================================
-- CRIAR PERFIS PARA USUÁRIOS EXISTENTES NA AUTENTICAÇÃO
-- ============================================================================
-- Baseado nos usuários que já existem na autenticação

-- 1. VERIFICAR USUÁRIOS EXISTENTES
SELECT 'Usuários na autenticação:' as status;
SELECT id, email, created_at 
FROM auth.users 
ORDER BY created_at;

-- 2. CRIAR PERFIL PARA USUÁRIO GATEWAY ASSET
-- UUID: 9d8415b4-be9f-4922-b478-9f57122ea045
-- Email: asset@gmail.com
INSERT INTO public.profiles (id, role, client_id, gateway_id, full_name, updated_at)
VALUES (
    '9d8415b4-be9f-4922-b478-9f57122ea045',
    'gateway_user'::public.app_role,
    '0ec3137d-ee68-4aba-82de-143b3c61516a',  -- Cliente Rapid Transporte
    '7e7e93d9-fc1a-4ae0-b7ab-775494d57cad',  -- Gateway Asset
    'Usuário Gateway Asset',
    now()
) ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    client_id = EXCLUDED.client_id,
    gateway_id = EXCLUDED.gateway_id,
    full_name = EXCLUDED.full_name,
    updated_at = EXCLUDED.updated_at;

-- 3. CRIAR PERFIL PARA USUÁRIO ADMIN
-- UUID: 0642a1af-cb0f-423e-8bd3-4f8189fb88cf
-- Email: lucasadmin@gmail.com
INSERT INTO public.profiles (id, role, client_id, gateway_id, full_name, updated_at)
VALUES (
    '0642a1af-cb0f-423e-8bd3-4f8189fb88cf',
    'admin'::public.app_role,
    '0ec3137d-ee68-4aba-82de-143b3c61516a',  -- Cliente Rapid Transporte
    NULL,  -- Admin não tem gateway específico
    'Administrador do Sistema',
    now()
) ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    client_id = EXCLUDED.client_id,
    full_name = EXCLUDED.full_name,
    updated_at = EXCLUDED.updated_at;

-- 4. VERIFICAR SE OS PERFIS FORAM CRIADOS
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

-- 5. VERIFICAR ESTRUTURA COMPLETA
SELECT 'Sistema configurado:' as info;
SELECT 'Cliente:' as tipo, name as nome FROM public.clients WHERE id = '0ec3137d-ee68-4aba-82de-143b3c61516a'
UNION ALL
SELECT 'Gateway:', name FROM public.gateways WHERE id = '7e7e93d9-fc1a-4ae0-b7ab-775494d57cad' AND is_active = true
UNION ALL
SELECT 'Admin:', full_name FROM public.profiles WHERE role = 'admin'
UNION ALL
SELECT 'Gateway User:', full_name FROM public.profiles WHERE role = 'gateway_user';

-- 6. TESTAR INSERÇÃO DE PEDIDO PARA VERIFICAR RLS
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
    '0ec3137d-ee68-4aba-82de-143b3c61516a',
    '7e7e93d9-fc1a-4ae0-b7ab-775494d57cad',
    'TEST-PERFIS-' || extract(epoch from now())::text,
    5699,
    'paid'::public.order_status,
    'Teste Perfis Criados',
    'teste@perfis.com',
    'São Paulo',
    'SP',
    'PERFISOK',
    'PAY-PERFIS-' || extract(epoch from now())::text,
    'paid',
    now(),
    now()
);

-- 7. VERIFICAR SE O TESTE FUNCIONOU
SELECT 'Teste de inserção com perfis:' as status;
SELECT 
    id, 
    customer_name, 
    payment_id, 
    status, 
    tracking_code,
    created_at
FROM public.orders 
WHERE external_id LIKE 'TEST-PERFIS-%'
ORDER BY created_at DESC
LIMIT 1;

-- 8. LIMPAR TESTE
DELETE FROM public.orders WHERE external_id LIKE 'TEST-PERFIS-%';

-- 9. VERIFICAÇÃO FINAL
SELECT 'VERIFICAÇÃO FINAL:' as status;

SELECT 'Gateway ativo:' as item, 
       CASE WHEN COUNT(*) > 0 THEN '✅ SIM' ELSE '❌ NÃO' END as resultado
FROM public.gateways 
WHERE id = '7e7e93d9-fc1a-4ae0-b7ab-775494d57cad' AND is_active = true

UNION ALL

SELECT 'Usuários na auth:', 
       COUNT(*)::text || ' usuários'
FROM auth.users

UNION ALL

SELECT 'Perfis criados:', 
       COUNT(*)::text || ' perfis'
FROM public.profiles

UNION ALL

SELECT 'Admin configurado:', 
       CASE WHEN COUNT(*) > 0 THEN '✅ SIM' ELSE '❌ NÃO' END
FROM public.profiles WHERE role = 'admin'

UNION ALL

SELECT 'Gateway user configurado:', 
       CASE WHEN COUNT(*) > 0 THEN '✅ SIM' ELSE '❌ NÃO' END
FROM public.profiles WHERE role = 'gateway_user'

UNION ALL

SELECT 'Inserção funciona:', 
       CASE WHEN COUNT(*) > 0 THEN '✅ SIM' ELSE '❌ NÃO' END
FROM pg_policies 
WHERE tablename = 'orders' AND policyname = 'Permitir inserção via webhook';

COMMIT;

-- ============================================================================
-- CREDENCIAIS PARA LOGIN:
-- ============================================================================
-- 
-- 👑 ADMINISTRADOR:
-- Email: lucasadmin@gmail.com
-- Senha: (a senha que você definiu)
-- Acesso: /admin
-- 
-- 🔧 USUÁRIO GATEWAY:
-- Email: asset@gmail.com  
-- Senha: (a senha que você definiu)
-- Acesso: /gateway/dashboard
-- 
-- ============================================================================
-- PRÓXIMOS PASSOS:
-- ============================================================================
-- 1. Execute: npm run devall
-- 2. Acesse: http://localhost:5173/login
-- 3. Teste os logins com as credenciais acima
-- 4. Verifique se o webhook funciona sem erros
-- ============================================================================