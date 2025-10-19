-- Script SQL para configurar cliente de teste da Shopify
-- Execute no Supabase Dashboard > SQL Editor

-- 1. Inserir usuário de teste (se não existir)
INSERT INTO profiles (id, role, full_name, updated_at)
VALUES (
  'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  'freelancer',
  'Cliente Teste Shopify',
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  updated_at = NOW();

-- 2. Criar cliente na tabela clients (se não existir)
INSERT INTO clients (id, name, settings, created_at)
VALUES (
  'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  'Cliente Teste Shopify',
  '{}'::jsonb,
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name;

-- 3. Inserir configuração do gateway Shopify na tabela gateways
INSERT INTO gateways (id, client_id, type, name, config, is_active, created_at)
VALUES (
  'shopify-a1b2c3d4-e5f6-7890-1234-567890abcdef',
  'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  'shopify',
  'Gateway Shopify Teste',
  '{
    "webhookSecret": "meu_secret_shopify_teste_123",
    "clientId": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
    "gatewayId": "shopify-a1b2c3d4-e5f6-7890-1234-567890abcdef",
    "shopDomain": "loja-teste.myshopify.com"
  }'::jsonb,
  true,
  NOW()
)
ON CONFLICT (id)
DO UPDATE SET
  config = EXCLUDED.config,
  is_active = true;

-- 4. Verificar se foi criado corretamente
SELECT
  p.id as profile_id,
  p.role,
  p.full_name,
  c.name as client_name,
  g.type as gateway_type,
  g.name as gateway_name,
  g.config->'webhookSecret' as webhook_secret,
  g.config->'shopDomain' as shop_domain,
  g.is_active
FROM profiles p
LEFT JOIN clients c ON p.id = c.id
LEFT JOIN gateways g ON c.id = g.client_id
WHERE p.id = 'a1b2c3d4-e5f6-7890-1234-567890abcdef';

-- Resultado esperado:
-- id: a1b2c3d4-e5f6-7890-1234-567890abcdef
-- role: freelancer  
-- full_name: Cliente Teste Shopify
-- gateway_type: shopify
-- webhook_secret: "meu_secret_shopify_teste_123"
-- shop_domain: "loja-teste.myshopify.com"

-- 5. (OPCIONAL) Se quiser usar um usuário existente da imagem:
-- Copie o ID de um dos freelancers existentes e substitua acima
-- Por exemplo: afb624d4-ed16-7e94-5976-659f9ec... (freelancer)
-- ou: b2cd46e8-fce7-8e01-2246-67996764... (freelancer)