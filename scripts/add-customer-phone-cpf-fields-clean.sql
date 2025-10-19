-- Adicionar campos customer_phone e customer_cpf na tabela orders
-- Execute no Supabase SQL Editor

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS customer_phone TEXT NULL;

ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS customer_cpf TEXT NULL;

-- Verificar se foi criado corretamente
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND table_schema = 'public'
AND column_name IN ('customer_phone', 'customer_cpf')
ORDER BY column_name;