-- Script para adicionar campos anti-vazamento na tabela orders
-- Execute este código diretamente no SQL Editor do Supabase

-- Adicionar campo origem para rastrear fonte do webhook
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS origem text CHECK (origem IN ('luna', 'asset')) DEFAULT 'asset';

-- Adicionar campo status_envio_email para controlar emails únicos
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS status_envio_email text CHECK (status_envio_email IN ('pendente', 'enviado', 'falhou')) DEFAULT 'pendente';

-- Criar índice para otimizar consultas por payment_id + origem
CREATE INDEX IF NOT EXISTS idx_orders_payment_id_origem ON orders(payment_id, origem);

-- Criar índice para otimizar consultas por status_envio_email
CREATE INDEX IF NOT EXISTS idx_orders_status_envio_email ON orders(status_envio_email);

-- Adicionar comentários para documentar os campos
COMMENT ON COLUMN orders.origem IS 'Origem do webhook: luna (direto) ou asset (via gateway)';
COMMENT ON COLUMN orders.status_envio_email IS 'Status do envio de email: pendente, enviado, falhou';

-- Verificar se os campos foram criados com sucesso
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND column_name IN ('origem', 'status_envio_email')
ORDER BY ordinal_position;