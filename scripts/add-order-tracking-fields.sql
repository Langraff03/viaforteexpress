-- Adicionar campos para rastreamento de endereço e email nos pedidos
-- Executar este script no Supabase SQL Editor

-- Adicionar coluna para indicar se o pedido tem endereço de entrega
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS has_shipping_address BOOLEAN DEFAULT false;

-- Adicionar coluna para indicar se o email foi enviado
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS email_sent BOOLEAN DEFAULT false;

-- Adicionar coluna para timestamp do envio do email
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS email_sent_at TIMESTAMP WITH TIME ZONE;

-- Adicionar comentário nas colunas para documentação
COMMENT ON COLUMN orders.has_shipping_address IS 'Indica se o pedido possui endereço de entrega válido';
COMMENT ON COLUMN orders.email_sent IS 'Indica se o email de confirmação foi enviado com sucesso';
COMMENT ON COLUMN orders.email_sent_at IS 'Timestamp do envio do email de confirmação';

-- Criar índices para melhor performance nas consultas
CREATE INDEX IF NOT EXISTS idx_orders_has_shipping_address ON orders(has_shipping_address);
CREATE INDEX IF NOT EXISTS idx_orders_email_sent ON orders(email_sent);
CREATE INDEX IF NOT EXISTS idx_orders_email_sent_at ON orders(email_sent_at);

-- Atualizar registros existentes com base nos dados atuais
-- Para pedidos que já têm tracking_code, assumir que tiveram email enviado
UPDATE orders
SET email_sent = true,
    email_sent_at = updated_at
WHERE tracking_code IS NOT NULL
  AND email_sent = false;

-- Para pedidos que têm city preenchida, assumir que têm endereço
UPDATE orders
SET has_shipping_address = true
WHERE city IS NOT NULL
  AND has_shipping_address = false;