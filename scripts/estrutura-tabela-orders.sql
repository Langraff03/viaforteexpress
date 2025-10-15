-- SQL para ver a estrutura COMPLETA da tabela orders
-- Execute no Supabase SQL Editor

SELECT 
    column_name AS "Campo",
    data_type AS "Tipo",
    is_nullable AS "Permite NULL",
    column_default AS "Valor Padrão"
FROM information_schema.columns 
WHERE table_name = 'orders' 
  AND table_schema = 'public'
ORDER BY ordinal_position;