# Instruções para Aplicar a Migração Multi-Gateway

Como não foi possível aplicar a migração automaticamente via API, siga estas instruções para aplicar a migração manualmente através do painel de administração do Supabase:

## 1. Acesse o Painel do Supabase

1. Acesse [https://app.supabase.com/](https://app.supabase.com/)
2. Faça login com suas credenciais
3. Selecione o projeto `tkrqqwihozqfzmaulego`

## 2. Acesse o Editor SQL

1. No menu lateral, clique em "SQL Editor"
2. Clique em "New Query" para criar uma nova consulta

## 3. Execute o Script de Migração

1. Copie o conteúdo do arquivo `supabase/migrations/20250603191149_add_multi_gateway_support.sql`
2. Cole no editor SQL
3. Clique em "Run" para executar a migração

## 4. Verifique a Migração

Após executar a migração, verifique se as tabelas foram criadas corretamente:

1. No menu lateral, clique em "Table Editor"
2. Verifique se a tabela `gateways` foi criada
3. Verifique se as colunas `client_id` e `gateway_id` foram adicionadas às tabelas `orders`, `email_logs`, `order_tracking` e `webhook_logs`

## 5. Teste o Sistema

1. Execute o sistema localmente com `npm run dev`
2. Verifique se o sistema está funcionando corretamente com a nova estrutura de gateways

## Observações

- As políticas de RLS (Row Level Security) foram configuradas para garantir que:
  - Usuários 'admin' possam ver todos os registros do seu cliente
  - Usuários 'gateway_user' só vejam registros do seu gateway
- Certifique-se de que os usuários existentes tenham os campos `client_id` e `gateway_id` preenchidos corretamente