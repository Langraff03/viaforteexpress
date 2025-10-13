# Como Visualizar a Estrutura do Banco de Dados

Este documento explica como usar os comandos SQL fornecidos no arquivo `visualizar_estrutura_banco.sql` para verificar a estrutura do seu banco de dados Supabase.

## Instruções

1. Acesse o painel de administração do Supabase
2. Vá para o SQL Editor
3. Crie uma nova consulta
4. Copie e cole os comandos do arquivo `visualizar_estrutura_banco.sql`
5. Execute cada comando separadamente para visualizar diferentes aspectos da estrutura do banco

## Comandos Disponíveis

O arquivo `visualizar_estrutura_banco.sql` contém os seguintes comandos:

1. **Listar todas as tabelas** - Mostra todas as tabelas no esquema public
2. **Listar todas as colunas** - Mostra todas as colunas de todas as tabelas com seus tipos de dados
3. **Listar todas as chaves primárias** - Mostra as chaves primárias de cada tabela
4. **Listar todas as chaves estrangeiras** - Mostra as relações entre tabelas
5. **Listar todos os índices** - Mostra os índices criados para otimização de consultas
6. **Listar todos os triggers** - Mostra os triggers configurados no banco
7. **Listar todos os tipos enumerados** - Mostra os tipos enumerados personalizados
8. **Listar todas as políticas RLS** - Mostra as políticas de Row-Level Security
9. **Verificar se RLS está habilitado** - Mostra quais tabelas têm RLS habilitado
10. **Listar todas as funções** - Mostra as funções definidas no banco
11. **Visualizar comentários das tabelas** - Mostra as descrições das tabelas
12. **Visualizar estrutura de uma tabela específica** - Mostra detalhes de uma tabela específica

## Verificações Importantes

Ao analisar a estrutura, certifique-se de verificar:

1. **Tabelas principais** - Confirme que todas as tabelas necessárias foram criadas: `clients`, `gateways`, `users`, `orders`, `order_tracking`, `email_logs`, `webhook_logs`

2. **Colunas de relacionamento** - Verifique se as colunas `client_id` e `gateway_id` existem nas tabelas apropriadas

3. **Políticas RLS** - Confirme que as políticas de segurança estão configuradas corretamente:
   - Usuários `admin` podem ver apenas registros do seu cliente
   - Usuários `gateway_user` podem ver apenas registros do seu gateway

4. **Índices** - Verifique se os índices necessários foram criados para otimizar consultas

5. **Triggers** - Confirme que os triggers para atualização de `updated_at` estão funcionando

## Exemplo de Verificação Específica

Para verificar especificamente a estrutura da tabela `gateways`, execute:

```sql
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
```

Para verificar as políticas RLS da tabela `orders`:

```sql
SELECT
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
    AND c.relname = 'orders'
ORDER BY
    p.polname;