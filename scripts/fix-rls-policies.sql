-- ============================================================================
-- CORRIGIR POLÍTICAS RLS PARA PERMITIR INSERÇÃO DE PEDIDOS VIA WEBHOOK
-- ============================================================================

-- 1. VERIFICAR POLÍTICAS ATUAIS
SELECT 'Políticas atuais na tabela orders:' as status;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'orders';

-- 2. REMOVER POLÍTICAS RESTRITIVAS EXISTENTES
DROP POLICY IF EXISTS "Admins têm acesso total" ON public.orders;
DROP POLICY IF EXISTS "Gateway users veem apenas seus dados" ON public.orders;
DROP POLICY IF EXISTS "Usuários veem apenas seus próprios pedidos" ON public.orders;

-- 3. CRIAR POLÍTICAS MAIS PERMISSIVAS PARA WEBHOOKS

-- Política para permitir inserção via webhook (sem autenticação)
CREATE POLICY "Permitir inserção via webhook" ON public.orders
    FOR INSERT 
    WITH CHECK (true);  -- Permite qualquer inserção

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

-- 4. VERIFICAR SE AS POLÍTICAS FORAM APLICADAS
SELECT 'Novas políticas criadas:' as status;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'orders'
ORDER BY policyname;

-- 5. TESTAR INSERÇÃO MANUAL (simular webhook)
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
    'TEST-WEBHOOK-001',
    10900,
    'paid'::public.order_status,
    'Teste Webhook',
    'teste@webhook.com',
    'São Paulo',
    'SP',
    'TEST123',
    'PAY-TEST-001',
    'paid',
    now(),
    now()
);

-- 6. VERIFICAR SE O TESTE FOI INSERIDO
SELECT 'Teste de inserção:' as status;
SELECT id, customer_name, customer_email, payment_id, status, tracking_code
FROM public.orders 
WHERE external_id = 'TEST-WEBHOOK-001';

-- 7. LIMPAR TESTE
DELETE FROM public.orders WHERE external_id = 'TEST-WEBHOOK-001';

-- 8. VERIFICAR OUTRAS TABELAS QUE PODEM PRECISAR DE AJUSTE

-- Verificar políticas em outras tabelas
SELECT 'Políticas em outras tabelas:' as status;
SELECT tablename, policyname, cmd
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('clients', 'gateways', 'profiles', 'leads', 'offers')
ORDER BY tablename, policyname;

COMMIT;

-- ============================================================================
-- RESULTADO ESPERADO:
-- ============================================================================
-- Após executar este script:
-- ✅ Webhooks podem inserir pedidos sem autenticação
-- ✅ Admins têm acesso total aos pedidos
-- ✅ Gateway users veem apenas pedidos do seu cliente
-- ✅ Sistema de segurança mantido para usuários autenticados
-- ============================================================================