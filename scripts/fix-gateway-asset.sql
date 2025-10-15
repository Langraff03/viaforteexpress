-- ============================================================================
-- CORRIGIR GATEWAY ASSET - GARANTIR QUE ESTEJA ATIVO E CONFIGURADO
-- ============================================================================

-- 1. VERIFICAR ESTADO ATUAL DO GATEWAY
SELECT 'Estado atual do gateway:' as status;
SELECT 
    id,
    client_id,
    type,
    name,
    is_active,
    created_at,
    config->>'api_key' as api_key_preview
FROM public.gateways 
WHERE type = 'asset';

-- 2. ATUALIZAR/INSERIR GATEWAY ASSET COM CONFIGURAÇÃO CORRETA
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
    is_active = true,  -- GARANTIR QUE ESTEJA ATIVO
    created_at = COALESCE(gateways.created_at, EXCLUDED.created_at);

-- 3. VERIFICAR SE FOI CORRIGIDO
SELECT 'Gateway após correção:' as status;
SELECT 
    id,
    client_id,
    type,
    name,
    is_active,
    config->>'api_key' as api_key,
    config->>'webhook_secret' as webhook_secret,
    config->>'api_url' as api_url
FROM public.gateways 
WHERE type = 'asset' AND client_id = '0ec3137d-ee68-4aba-82de-143b3c61516a';

-- 4. VERIFICAR CLIENTE ASSOCIADO
SELECT 'Cliente associado:' as status;
SELECT 
    c.id,
    c.name,
    c.settings
FROM public.clients c
WHERE c.id = '0ec3137d-ee68-4aba-82de-143b3c61516a';

-- 5. TESTE DE CONSULTA QUE O SISTEMA FAZ
SELECT 'Teste da consulta do sistema:' as status;
SELECT 
    id, 
    client_id, 
    config, 
    is_active
FROM public.gateways
WHERE client_id = '0ec3137d-ee68-4aba-82de-143b3c61516a'
  AND type = 'asset'
  AND is_active = true;

-- 6. VERIFICAR TODOS OS GATEWAYS ATIVOS
SELECT 'Todos os gateways ativos:' as status;
SELECT 
    g.id,
    g.type,
    g.name,
    g.is_active,
    c.name as client_name
FROM public.gateways g
LEFT JOIN public.clients c ON g.client_id = c.id
WHERE g.is_active = true
ORDER BY g.type, g.name;

COMMIT;

-- ============================================================================
-- RESULTADO ESPERADO:
-- ============================================================================
-- Após executar este script, o gateway Asset deve estar:
-- ✅ Ativo (is_active = true)
-- ✅ Configurado com API key correta
-- ✅ Associado ao cliente Rapid Transporte
-- ✅ Visível para o sistema de webhook
-- ============================================================================