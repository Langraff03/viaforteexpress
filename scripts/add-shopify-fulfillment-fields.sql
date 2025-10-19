-- ============================================
-- Script: Adicionar campos para Fulfillment Automático Shopify
-- Descrição: Adiciona campos necessários para processar pedidos 
--            automaticamente na Shopify via API Admin
-- Data: 2025-10-19
-- ============================================

-- Adicionar novos campos na tabela shopify_configs
ALTER TABLE shopify_configs
ADD COLUMN IF NOT EXISTS shop_url VARCHAR(255),
ADD COLUMN IF NOT EXISTS api_access_token TEXT,
ADD COLUMN IF NOT EXISTS auto_fulfill BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS tracking_company VARCHAR(100) DEFAULT 'Custom';

-- Comentários para documentação
COMMENT ON COLUMN shopify_configs.shop_url IS 'URL da loja Shopify (ex: minhaloja.myshopify.com)';
COMMENT ON COLUMN shopify_configs.api_access_token IS 'Token de acesso da API Admin da Shopify para criar fulfillments';
COMMENT ON COLUMN shopify_configs.auto_fulfill IS 'Se true, cria fulfillment automaticamente na Shopify quando receber webhook';
COMMENT ON COLUMN shopify_configs.tracking_company IS 'Nome da transportadora para aparecer no fulfillment da Shopify';

-- Criar índice para otimizar buscas
CREATE INDEX IF NOT EXISTS idx_shopify_configs_user_active 
ON shopify_configs(user_id, is_active) 
WHERE is_active = true;

-- Verificar estrutura da tabela após alterações
SELECT 
    column_name, 
    data_type, 
    character_maximum_length,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'shopify_configs'
ORDER BY ordinal_position;