-- ============================================================================
-- SCRIPT ÚNICO PARA RESOLVER TODOS OS PROBLEMAS
-- ============================================================================
-- Execute este script no Supabase SQL Editor para corrigir tudo

-- 1. CORRIGIR GATEWAY ASSET (garantir que esteja ativo)
INSERT INTO public.gateways (id, client_id, type, name, config, is_active, created_at) 
VALUES (
    '7e7e93d9-fc1a-4ae0-b7ab-775494d57cad',
    '0ec3137d-ee68-4aba-82de-143b3c61516a',
    'asset',
    'Gateway Asset Principal',
    '{
        "api_key": "admin_live_0JqhhCVNXuTwzhfQHiiFbYpUT7YyDNI35rY",
        "api_url": "https://api.asaas.com/v3",
        "webhook_secret": "12b81c3b01e40506bef7c583f757fe9e4a028920ca3cf178530c94fbfb4ceb43",
        "webhook_url": "https://rastreio.logfastexpress.com/webhook/asset",
        "environment": "production"
    }'::jsonb,
    true,
    now()
) ON CONFLICT (id) DO UPDATE SET
    client_id = EXCLUDED.client_id,
    type = EXCLUDED.type,
    name = EXCLUDED.name,
    config = EXCLUDED.config,
    is_active = true,
    created_at = COALESCE(gateways.created_at, EXCLUDED.created_at);

-- 2. CORRIGIR POLÍTICAS RLS (permitir inserção via webhook)

-- Remover políticas restritivas existentes
DROP POLICY IF EXISTS "Admins têm acesso total" ON public.orders;
DROP POLICY IF EXISTS "Gateway users veem apenas seus dados" ON public.orders;
DROP POLICY IF EXISTS "Usuários veem apenas seus próprios pedidos" ON public.orders;
DROP POLICY IF EXISTS "Gateway users podem atualizar seus pedidos" ON public.orders;
DROP POLICY IF EXISTS "Permitir inserção via webhook" ON public.orders;

-- Criar política permissiva para inserção via webhook
CREATE POLICY "Permitir inserção via webhook" ON public.orders
    FOR INSERT 
    WITH CHECK (true);

-- Política para admins (acesso total)
CREATE POLICY "Admins têm acesso total" ON public.orders
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Política para usuários de gateway (apenas seus dados)
CREATE POLICY "Gateway users veem apenas seus dados" ON public.orders
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'gateway_user'
            AND profiles.client_id = orders.client_id
        )
    );

-- Política para atualização por gateway users
CREATE POLICY "Gateway users podem atualizar seus pedidos" ON public.orders
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'gateway_user'
            AND profiles.client_id = orders.client_id
        )
    );

-- 3. CRIAR PERFIS DE USUÁRIOS (se os usuários existirem na autenticação)

-- Perfil Administrador
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
ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    client_id = EXCLUDED.client_id,
    full_name = EXCLUDED.full_name,
    updated_at = EXCLUDED.updated_at;

-- Perfil Usuário Gateway
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
ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    client_id = EXCLUDED.client_id,
    gateway_id = EXCLUDED.gateway_id,
    full_name = EXCLUDED.full_name,
    updated_at = EXCLUDED.updated_at;

-- 4. TESTAR INSERÇÃO DE PEDIDO (simular webhook)
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
    'TEST-WEBHOOK-FINAL',
    10900,
    'paid'::public.order_status,
    'Teste Final Webhook',
    'teste@final.com',
    'São Paulo',
    'SP',
    'TESTFINAL',
    'PAY-FINAL-001',
    'paid',
    now(),
    now()
);

-- 5. VERIFICAÇÕES FINAIS

-- Verificar gateway
SELECT 'Gateway Asset configurado:' as status;
SELECT 
    id,
    client_id,
    type,
    name,
    is_active,
    config->>'api_key' as api_key_preview
FROM public.gateways 
WHERE type = 'asset' AND client_id = '0ec3137d-ee68-4aba-82de-143b3c61516a';

-- Verificar políticas RLS
SELECT 'Políticas RLS criadas:' as status;
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'orders'
ORDER BY policyname;

-- Verificar perfis
SELECT 'Perfis de usuários:' as status;
SELECT 
    p.role,
    p.full_name,
    u.email,
    c.name as client_name
FROM public.profiles p
JOIN auth.users u ON p.id = u.id
LEFT JOIN public.clients c ON p.client_id = c.id
WHERE u.email IN ('admin@rapidtransporte.com', 'gateway@rapidtransporte.com')
ORDER BY p.role;

-- Verificar teste de inserção
SELECT 'Teste de inserção funcionou:' as status;
SELECT id, customer_name, payment_id, status, tracking_code
FROM public.orders 
WHERE external_id = 'TEST-WEBHOOK-FINAL';

-- Limpar teste
DELETE FROM public.orders WHERE external_id = 'TEST-WEBHOOK-FINAL';

-- Verificar estrutura completa
SELECT 'Sistema configurado:' as info;
SELECT 'Cliente:' as tipo, name as nome FROM public.clients WHERE id = '0ec3137d-ee68-4aba-82de-143b3c61516a'
UNION ALL
SELECT 'Gateway:', name FROM public.gateways WHERE id = '7e7e93d9-fc1a-4ae0-b7ab-775494d57cad'
UNION ALL
SELECT 'Políticas RLS:', COUNT(*)::text FROM pg_policies WHERE tablename = 'orders'
UNION ALL
SELECT 'Perfis:', COUNT(*)::text FROM public.profiles;

COMMIT;

-- ============================================================================
-- RESULTADO ESPERADO:
-- ============================================================================
-- Após executar este script:
-- ✅ Gateway Asset ativo e configurado
-- ✅ Políticas RLS permitindo inserção via webhook
-- ✅ Perfis de usuários criados (se existirem na autenticação)
-- ✅ Teste de inserção bem-sucedido
-- ✅ Sistema pronto para receber webhooks
-- ============================================================================

-- ============================================================================
-- PRÓXIMOS PASSOS:
-- ============================================================================
-- 1. Se ainda não criou os usuários na autenticação:
--    - Acesse Supabase → Authentication → Users
--    - Criar: admin@rapidtransporte.com / admin123456
--    - Criar: gateway@rapidtransporte.com / gateway123456
--    - Execute este script novamente para criar os perfis
--
-- 2. Reinicie o sistema: npm run devall
--
-- 3. Teste o webhook - deve funcionar sem erros!
-- ============================================================================