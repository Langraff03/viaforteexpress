-- Criar tabela para configurações Shopify dos freelancers
-- Execute no Supabase Dashboard > SQL Editor

CREATE TABLE IF NOT EXISTS shopify_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  webhook_secret TEXT NOT NULL,
  shop_domain TEXT, -- Opcional: domínio da loja (ex: minhaloja.myshopify.com)
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id) -- Cada usuário pode ter apenas uma configuração Shopify
);

-- Comentários sobre esta tabela:
-- Esta tabela é específica para Shopify e não deve ser confundida com a tabela 'gateways'
-- A tabela 'gateways' é para gateways de pagamento reais (Asset, MercadoPago, etc.)
-- A tabela 'shopify_configs' é para integrações de e-commerce que enviam webhooks

-- Inserir configuração de teste
INSERT INTO shopify_configs (user_id, webhook_secret, shop_domain)
VALUES (
  'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  'meu_secret_shopify_teste_123',
  'loja-teste.myshopify.com'
)
ON CONFLICT (user_id) 
DO UPDATE SET 
  webhook_secret = EXCLUDED.webhook_secret,
  shop_domain = EXCLUDED.shop_domain,
  updated_at = NOW();

-- Verificar se foi criado
SELECT * FROM shopify_configs WHERE user_id = 'a1b2c3d4-e5f6-7890-1234-567890abcdef';