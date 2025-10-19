-- ============================================================================
-- VERIFICAR E CORRIGIR APENAS O QUE ESTÁ FALTANDO
-- ============================================================================

-- 1. VERIFICAR ESTADO ATUAL DO GATEWAY
SELECT 'Estado atual do gateway:' as status;
SELECT 
    id,
    client_id,
    type,
    name,
    is_active,
    config->>'api_key' as api_key_preview
FROM public.gateways 
WHERE type = 'asset' AND client_id = '0ec3137d-ee68-4aba-82de-143b3c61516a';

-- 2. GARANTIR QUE O GATEWAY ESTEJA ATIVO (se existir)
UPDATE public.gateways 
SET is_active = true,
    config = '{
        "api_key": "admin_live_0JqhhCVNXuTwzhfQHiiFbYpUT7YyDNI35rY",
        "api_url": "https://api.asaas.com/v3",
        "webhook_secret": "12b81c3b01e40506bef7c583f757fe9e4a028920ca3cf178530c94fbfb4ceb43"
    }'::jsonb
WHERE id = '7e7e93d9-fc1a-4ae0-b7ab-775494d57cad';

-- 3. VERIFICAR POLÍTICAS RLS EXISTENTES
SELECT 'Políticas RLS atuais:' as status;
SELECT policyname, cmd, permissive
FROM pg_policies 
WHERE tablename = 'orders'
ORDER BY policyname;

-- 4. VERIFICAR USUÁRIOS NA AUTENTICAÇÃO
SELECT 'Usuários na autenticação:' as status;
SELECT id, email, email_confirmed_at IS NOT NULL as confirmado
FROM auth.users 
WHERE email IN ('admin@rapidtransporte.com', 'gateway@rapidtransporte.com')
ORDER BY email;

-- 5. VERIFICAR PERFIS EXISTENTES
SELECT 'Perfis existentes:' as status;
SELECT 
    p.id,
    p.role,
    p.full_name,
    u.email
FROM public.profiles p
JOIN auth.users u ON p.id = u.id
WHERE u.email IN ('admin@rapidtransporte.com', 'gateway@rapidtransporte.com')
ORDER BY p.role;

-- 6. CRIAR PERFIS APENAS SE OS USUÁRIOS EXISTIREM E OS PERFIS NÃO EXISTIREM
INSERT INTO public.profiles (id, role, client_id, gateway_id, full_name, updated_at)
SELECT 
    u.id,
    'admin'::public.app_role,
    '0ec3137d-ee68-4aba-82de-143b3c61516a',
    NULL,
    'Administrador do Sistema',
    now()
FROM auth.users u
WHERE u.email = 'admin@rapidtransporte.com'
  AND NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = u.id);

INSERT INTO public.profiles (id, role, client_id, gateway_id, full_name, updated_at)
SELECT 
    u.id,
    'gateway_user'::public.app_role,
    '0ec3137d-ee68-4aba-82de-143b3c61516a',
    '7e7e93d9-fc1a-4ae0-b7ab-775494d57cad',
    'Usuário Gateway Asset',
    now()
FROM auth.users u
WHERE u.email = 'gateway@rapidtransporte.com'
  AND NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = u.id);

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
    'TEST-FINAL-' || extract(epoch from now())::text,
    5699,
    'paid'::public.order_status,
    'Teste Final Sistema',
    'teste@sistema.com',
    'São Paulo',
    'SP',
    'TESTOK',
    'PAY-TEST-' || extract(epoch from now())::text,
    'paid',
    now(),
    now()
);

-- 8. VERIFICAR SE O TESTE FUNCIONOU
SELECT 'Teste de inserção:' as status;
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

-- 9. LIMPAR TESTES ANTIGOS (manter apenas o mais recente)
DELETE FROM public.orders 
WHERE external_id LIKE 'TEST-FINAL-%' 
  AND created_at < (
    SELECT MAX(created_at) - INTERVAL '1 minute'
    FROM public.orders 
    WHERE external_id LIKE 'TEST-FINAL-%'
  );

-- 10. VERIFICAÇÃO FINAL COMPLETA
SELECT 'VERIFICAÇÃO FINAL:' as status;

SELECT 'Gateway ativo:' as item, 
       CASE WHEN COUNT(*) > 0 THEN '✅ SIM' ELSE '❌ NÃO' END as resultado
FROM public.gateways 
WHERE id = '7e7e93d9-fc1a-4ae0-b7ab-775494d57cad' AND is_active = true

UNION ALL

SELECT 'Política RLS webhook:', 
       CASE WHEN COUNT(*) > 0 THEN '✅ SIM' ELSE '❌ NÃO' END
FROM pg_policies 
WHERE tablename = 'orders' AND policyname = 'Permitir inserção via webhook'

UNION ALL

SELECT 'Usuários na auth:', 
       CASE WHEN COUNT(*) >= 2 THEN '✅ SIM' ELSE '❌ FALTANDO' END
FROM auth.users 
WHERE email IN ('admin@rapidtransporte.com', 'gateway@rapidtransporte.com')

UNION ALL

SELECT 'Perfis criados:', 
       CASE WHEN COUNT(*) >= 2 THEN '✅ SIM' ELSE '❌ FALTANDO' END
FROM public.profiles p
JOIN auth.users u ON p.id = u.id
WHERE u.email IN ('admin@rapidtransporte.com', 'gateway@rapidtransporte.com')

UNION ALL

SELECT 'Inserção funciona:', 
       CASE WHEN COUNT(*) > 0 THEN '✅ SIM' ELSE '❌ NÃO' END
FROM public.orders 
WHERE external_id LIKE 'TEST-FINAL-%';

COMMIT;

-- ============================================================================
-- INSTRUÇÕES BASEADAS NO RESULTADO:
-- ============================================================================
-- 
-- Se "Gateway ativo" = ❌ NÃO:
--   Execute: scripts/fix-gateway-asset.sql
--
-- Se "Usuários na auth" = ❌ FALTANDO:
--   Crie os usuários no Supabase Authentication
--
-- Se "Perfis criados" = ❌ FALTANDO:
--   Execute este script novamente após criar os usuários
--
-- Se "Inserção funciona" = ❌ NÃO:
--   Há problema com RLS, execute: scripts/fix-rls-policies.sql
--
-- Se TUDO = ✅ SIM:
--   Sistema está funcionando! Reinicie: npm run devall
-- ============================================================================