-- SQL para verificar se a estrutura da tabela orders está correta
-- Execute no Supabase SQL Editor

-- 1. Verificar se as colunas customer_phone e customer_cpf existem
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    CASE 
        WHEN column_name IN ('customer_phone', 'customer_cpf') THEN '✅ NOVO'
        ELSE ''
    END as status
FROM information_schema.columns 
WHERE table_name = 'orders' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Verificar especificamente os campos implementados
SELECT 
    'customer_phone' as campo,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'orders' 
            AND column_name = 'customer_phone'
        ) THEN '✅ EXISTE' 
        ELSE '❌ NÃO EXISTE' 
    END as status

UNION ALL

SELECT 
    'customer_cpf' as campo,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'orders' 
            AND column_name = 'customer_cpf'
        ) THEN '✅ EXISTE' 
        ELSE '❌ NÃO EXISTE' 
    END as status;

-- 3. Contar quantos pedidos têm CPF e telefone preenchidos
SELECT 
    COUNT(*) as total_pedidos,
    COUNT(customer_phone) as pedidos_com_telefone,
    COUNT(customer_cpf) as pedidos_com_cpf,
    ROUND(
        (COUNT(customer_phone)::decimal / NULLIF(COUNT(*), 0)) * 100, 2
    ) as percentual_telefone,
    ROUND(
        (COUNT(customer_cpf)::decimal / NULLIF(COUNT(*), 0)) * 100, 2
    ) as percentual_cpf
FROM orders;

-- 4. Mostrar exemplos de pedidos com CPF/telefone (se houver)
SELECT 
    id,
    customer_name,
    customer_email,
    customer_phone,
    customer_cpf,
    created_at
FROM orders 
WHERE customer_phone IS NOT NULL 
   OR customer_cpf IS NOT NULL
ORDER BY created_at DESC 
LIMIT 5;