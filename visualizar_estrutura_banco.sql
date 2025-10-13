-- =============================================
-- COMANDOS PARA VISUALIZAR A ESTRUTURA DO BANCO DE DADOS
-- =============================================

-- 1. Listar todas as tabelas do esquema public
SELECT 
    table_name,
    table_type
FROM 
    information_schema.tables
WHERE 
    table_schema = 'public'
ORDER BY 
    table_name;

-- 2. Listar todas as colunas de todas as tabelas
SELECT 
    t.table_name,
    c.column_name,
    c.data_type,
    c.column_default,
    c.is_nullable,
    c.character_maximum_length,
    pg_catalog.col_description(format('%s.%s', t.table_schema, t.table_name)::regclass::oid, c.ordinal_position) as column_description
FROM 
    information_schema.tables t
JOIN 
    information_schema.columns c ON t.table_name = c.table_name AND t.table_schema = c.table_schema
WHERE 
    t.table_schema = 'public'
ORDER BY 
    t.table_name,
    c.ordinal_position;

-- 3. Listar todas as chaves primárias
SELECT
    tc.table_schema, 
    tc.table_name, 
    kc.column_name 
FROM 
    information_schema.table_constraints tc
JOIN 
    information_schema.key_column_usage kc ON kc.constraint_name = tc.constraint_name
WHERE 
    tc.constraint_type = 'PRIMARY KEY'
    AND tc.table_schema = 'public'
ORDER BY 
    tc.table_schema, 
    tc.table_name;

-- 4. Listar todas as chaves estrangeiras
SELECT
    tc.table_schema, 
    tc.table_name, 
    kc.column_name,
    ccu.table_schema AS foreign_table_schema,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints tc
JOIN 
    information_schema.key_column_usage kc ON kc.constraint_name = tc.constraint_name
JOIN 
    information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
WHERE 
    tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
ORDER BY 
    tc.table_schema, 
    tc.table_name;

-- 5. Listar todos os índices
SELECT
    tablename,
    indexname,
    indexdef
FROM
    pg_indexes
WHERE
    schemaname = 'public'
ORDER BY
    tablename,
    indexname;

-- 6. Listar todos os triggers
SELECT
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM
    information_schema.triggers
WHERE
    trigger_schema = 'public'
ORDER BY
    event_object_table,
    trigger_name;

-- 7. Listar todos os tipos enumerados
SELECT
    t.typname AS enum_name,
    e.enumlabel AS enum_value
FROM
    pg_type t
JOIN
    pg_enum e ON t.oid = e.enumtypid
JOIN
    pg_catalog.pg_namespace n ON n.oid = t.typnamespace
WHERE
    n.nspname = 'public'
ORDER BY
    t.typname,
    e.enumsortorder;

-- 8. Listar todas as políticas RLS
SELECT
    n.nspname AS schema_name,
    c.relname AS table_name,
    p.polname AS policy_name,
    CASE p.polpermissive WHEN 't' THEN 'PERMISSIVE' ELSE 'RESTRICTIVE' END AS permissive,
    CASE p.polroles[0] WHEN 0 THEN 'PUBLIC' ELSE r.rolname END AS role_name,
    CASE p.polcmd
        WHEN 'r' THEN 'SELECT'
        WHEN 'a' THEN 'INSERT'
        WHEN 'w' THEN 'UPDATE'
        WHEN 'd' THEN 'DELETE'
        WHEN '*' THEN 'ALL'
    END AS command,
    pg_catalog.pg_get_expr(p.polqual, p.polrelid) AS expression
FROM
    pg_policy p
JOIN
    pg_class c ON p.polrelid = c.oid
JOIN
    pg_namespace n ON c.relnamespace = n.oid
LEFT JOIN
    pg_roles r ON r.oid = p.polroles[0]
WHERE
    n.nspname = 'public'
ORDER BY
    n.nspname,
    c.relname,
    p.polname;

-- 9. Verificar se RLS está habilitado nas tabelas
SELECT
    n.nspname AS schema_name,
    c.relname AS table_name,
    CASE c.relrowsecurity WHEN 't' THEN 'Enabled' ELSE 'Disabled' END AS row_level_security
FROM
    pg_class c
JOIN
    pg_namespace n ON c.relnamespace = n.oid
WHERE
    c.relkind = 'r'
    AND n.nspname = 'public'
ORDER BY
    n.nspname,
    c.relname;

-- 10. Listar todas as funções
SELECT
    n.nspname AS schema_name,
    p.proname AS function_name,
    pg_catalog.pg_get_function_arguments(p.oid) AS function_arguments,
    CASE p.prokind
        WHEN 'f' THEN 'function'
        WHEN 'p' THEN 'procedure'
        WHEN 'a' THEN 'aggregate'
        WHEN 'w' THEN 'window'
    END AS function_type,
    l.lanname AS language
FROM
    pg_proc p
JOIN
    pg_namespace n ON p.pronamespace = n.oid
JOIN
    pg_language l ON p.prolang = l.oid
WHERE
    n.nspname = 'public'
ORDER BY
    n.nspname,
    p.proname;

-- 11. Visualizar comentários das tabelas
SELECT
    c.relname AS table_name,
    d.description AS table_description
FROM
    pg_class c
JOIN
    pg_namespace n ON c.relnamespace = n.oid
LEFT JOIN
    pg_description d ON d.objoid = c.oid AND d.objsubid = 0
WHERE
    n.nspname = 'public'
    AND c.relkind = 'r'
ORDER BY
    c.relname;

-- 12. Visualizar estrutura completa de uma tabela específica (substitua 'gateways' pelo nome da tabela)
SELECT
    c.column_name,
    c.data_type,
    c.column_default,
    c.is_nullable,
    c.character_maximum_length,
    pg_catalog.col_description(format('%s.%s', c.table_schema, c.table_name)::regclass::oid, c.ordinal_position) as column_description
FROM
    information_schema.columns c
WHERE
    c.table_schema = 'public'
    AND c.table_name = 'gateways'
ORDER BY
    c.ordinal_position;