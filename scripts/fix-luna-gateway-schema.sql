-- Fix: Permitir gateway_id NULL para Luna Checkout direto
-- PROBLEMA: Schema do banco exige gateway_id NOT NULL, mas Luna direta não deveria ter gateway
-- SOLUÇÃO: Alterar coluna gateway_id para permitir NULL

BEGIN;

-- 1. Alterar coluna gateway_id para permitir NULL
ALTER TABLE orders ALTER COLUMN gateway_id DROP NOT NULL;

-- 2. Adicionar comentário explicativo
COMMENT ON COLUMN orders.gateway_id IS 'ID do gateway de pagamento. NULL para Luna Checkout direto, UUID para Asset Gateway';

-- 3. Verificar se alteração foi aplicada
SELECT 
    column_name, 
    is_nullable, 
    column_default,
    data_type
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND column_name = 'gateway_id';

COMMIT;