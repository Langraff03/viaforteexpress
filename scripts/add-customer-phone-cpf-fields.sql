-- Migração para adicionar campos customer_phone e customer_cpf na tabela orders
-- Execute este SQL diretamente no Supabase

-- Adicionar coluna customer_phone (telefone do cliente)
ALTER TABLE public.orders 
ADD COLUMN customer_phone TEXT NULL;

-- Adicionar coluna customer_cpf (CPF do cliente)  
ALTER TABLE public.orders
ADD COLUMN customer_cpf TEXT NULL;

-- Adicionar comentários para documentação
COMMENT ON COLUMN public.orders.customer_phone IS 'Telefone do cliente extraído dos webhooks de pagamento';
COMMENT ON COLUMN public.orders.customer_cpf IS 'CPF do cliente extraído dos webhooks de pagamento';

-- Verificar se as colunas foram criadas corretamente
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND column_name IN ('customer_phone', 'customer_cpf')
ORDER BY column_name;