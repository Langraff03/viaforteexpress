-- ============================================================================
-- CRIAR PERFIS DINAMICAMENTE USANDO OS UUIDs CORRETOS DA AUTENTICAÇÃO
-- ============================================================================

-- 1. VERIFICAR USUÁRIOS EXISTENTES NA AUTENTICAÇÃO
SELECT 'Usuários na autenticação:' as status;
SELECT id, email, created_at 
FROM auth.users 
ORDER BY created_at;

-- 2. VERIFICAR SE HÁ CONSTRAINT PROBLEMÁTICA
SELECT 'Constraints da tabela profiles:' as status;
SELECT conname, contype, confrelid::regclass as referenced_table
FROM pg_constraint 
WHERE conrelid = 'public.profiles'::regclass;

-- 3. REMOVER CONSTRAINT PROBLEMÁTICA SE EXISTIR
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- 4. CRIAR CONSTRAINT CORRETA PARA auth.users
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_id_fkey 
FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 5. CRIAR PERFIS DINAMICAMENTE PARA TODOS OS USUÁRIOS EXISTENTES

-- Criar perfil para o primeiro usuário como admin
INSERT INTO public.profiles (id, role, client_id, gateway_id, full_name, updated_at)
SELECT 
    u.id,
    'admin'::public.app_role,
    '0ec3137d-ee68-4aba-82de-143b3c61516a',
    NULL,
    CASE 
        WHEN u.email LIKE '%admin%' THEN 'Administrador do Sistema'
        WHEN u.email LIKE '%lucas%' THEN 'Administrador do Sistema'
        ELSE 'Administrador'
    END,
    now()
FROM auth.users u
WHERE u.email LIKE '%admin%' OR u.email LIKE '%lucas%'
ORDER BY u.created_at
LIMIT 1
ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    client_id = EXCLUDED.client_id,
    full_name = EXCLUDED.full_name,
    updated_at = EXCLUDED.updated_at;

-- Criar perfil para usuário gateway
INSERT INTO public.profiles (id, role, client_id, gateway_id, full_name, updated_at)
SELECT 
    u.id,
    'gateway_user'::public.app_role,
    '0ec3137d-ee68-4aba-82de-143b3c61516a',
    '7e7e93d9-fc1a-4ae0-b7ab-775494d57cad',
    CASE 
        WHEN u.email LIKE '%asset%' THEN 'Usuário Gateway Asset'
        WHEN u.email LIKE '%gateway%' THEN 'Usuário Gateway Asset'
        ELSE 'Usuário Gateway'
    END,
    now()
FROM auth.users u
WHERE u.email LIKE '%asset%' OR u.email LIKE '%gateway%'
ORDER BY u.created_at
LIMIT 1
ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    client_id = EXCLUDED.client_id,
    gateway_id = EXCLUDED.gateway_id,
    full_name = EXCLUDED.full_name,
    updated_at = EXCLUDED.updated_at;

-- Se não encontrou usuários específicos, criar para os dois primeiros usuários
INSERT INTO public.profiles (id, role, client_id, gateway_id, full_name, updated_at)
SELECT 
    u.id,
    CASE 
        WHEN ROW_NUMBER() OVER (ORDER BY u.created_at) = 1 THEN 'admin'::public.app_role
        ELSE 'gateway_user'::public.app_role
    END,
    '0ec3137d-ee68-4aba-82de-143b3c61516a',
    CASE 
        WHEN ROW_NUMBER() OVER (ORDER BY u.created_at) = 1 THEN NULL
        ELSE '7e7e93d9-fc1a-4ae0-b7ab-775494d57cad'
    END,
    CASE 
        WHEN ROW_NUMBER() OVER (ORDER BY u.created_at) = 1 THEN 'Administrador do Sistema'
        ELSE 'Usuário Gateway Asset'
    END,
    now()
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = u.id)
ORDER BY u.created_at
LIMIT 2
ON CONFLICT (id) DO NOTHING;

-- 6. VERIFICAR PERFIS CRIADOS
SELECT 'Perfis criados:' as status;
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

-- 7. TESTAR INSERÇÃO DE PEDIDO
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
    'TEST-DINAMICO-' || extract(epoch from now())::text,
    5699,
    'paid'::public.order_status,
    'Teste Perfis Dinâmicos',
    'teste@dinamico.com',
    'São Paulo',
    'SP',
    'DINAMICO',
    'PAY-DIN-' || extract(epoch from now())::text,
    'paid',
    now(),
    now()
);

-- 8. VERIFICAR TESTE
SELECT 'Teste de inserção:' as status;
SELECT 
    id, 
    customer_name, 
    payment_id, 
    status, 
    tracking_code
FROM public.orders 
WHERE external_id LIKE 'TEST-DINAMICO-%'
ORDER BY created_at DESC
LIMIT 1;

-- 9. LIMPAR TESTE
DELETE FROM public.orders WHERE external_id LIKE 'TEST-DINAMICO-%';

-- 10. VERIFICAÇÃO FINAL
SELECT 'VERIFICAÇÃO FINAL:' as status;

SELECT 'Usuários na auth:' as item, 
       COUNT(*)::text || ' usuários' as resultado
FROM auth.users

UNION ALL

SELECT 'Perfis criados:', 
       COUNT(*)::text || ' perfis'
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

SELECT 'RLS webhook ativo:', 
       CASE WHEN COUNT(*) > 0 THEN '✅ SIM' ELSE '❌ NÃO' END
FROM pg_policies 
WHERE tablename = 'orders' AND policyname = 'Permitir inserção via webhook';

-- 11. MOSTRAR CREDENCIAIS PARA LOGIN
SELECT 'CREDENCIAIS PARA LOGIN:' as info;
SELECT 
    CASE p.role 
        WHEN 'admin' THEN '👑 ADMIN'
        WHEN 'gateway_user' THEN '🔧 GATEWAY USER'
        ELSE '👤 USER'
    END as tipo,
    u.email as email,
    'Senha definida por você' as senha,
    CASE p.role 
        WHEN 'admin' THEN '/admin'
        WHEN 'gateway_user' THEN '/gateway/dashboard'
        ELSE '/'
    END as acesso
FROM public.profiles p
JOIN auth.users u ON p.id = u.id
ORDER BY p.role;

COMMIT;

-- ============================================================================
-- RESULTADO ESPERADO:
-- ============================================================================
-- ✅ Constraint corrigida para referenciar auth.users
-- ✅ Perfis criados dinamicamente para usuários existentes
-- ✅ Admin e Gateway User configurados
-- ✅ Sistema pronto para funcionar
-- ============================================================================