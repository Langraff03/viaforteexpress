-- Script para corrigir as policies RLS para permitir que o frontend leia os pedidos
-- Mantém a segurança para operações de escrita (apenas backend com service role)
-- Mas permite leitura pública dos pedidos para o frontend

-- Primeiro, vamos verificar se RLS está habilitado na tabela orders
-- (deve estar habilitado)

-- Remover policies existentes que podem estar bloqueando a leitura
DROP POLICY IF EXISTS "allow_read_orders" ON public.orders;
DROP POLICY IF EXISTS "allow_insert_orders" ON public.orders;
DROP POLICY IF EXISTS "allow_update_orders" ON public.orders;
DROP POLICY IF EXISTS "allow_webhook_insert" ON public.orders;

-- Criar policy que permite leitura pública dos pedidos
-- Isso permite que o frontend (usando anon key) possa ler os pedidos
CREATE POLICY "allow_public_read_orders" ON public.orders
  FOR SELECT
  TO public
  USING (true);

-- Criar policy que permite apenas ao service_role inserir pedidos
-- Isso garante que apenas o backend pode criar novos pedidos
CREATE POLICY "allow_service_role_insert_orders" ON public.orders
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Criar policy que permite apenas ao service_role atualizar pedidos
-- Isso garante que apenas o backend pode atualizar pedidos
CREATE POLICY "allow_service_role_update_orders" ON public.orders
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Criar policies para permitir leitura pública das tabelas relacionadas à nota fiscal

-- Permitir leitura pública da tabela customers (para dados do cliente na nota fiscal)
DROP POLICY IF EXISTS "allow_public_read_customers" ON public.customers;
CREATE POLICY "allow_public_read_customers" ON public.customers
  FOR SELECT
  TO public
  USING (true);

-- Permitir leitura pública da tabela order_items (para itens da nota fiscal)
DROP POLICY IF EXISTS "allow_public_read_order_items" ON public.order_items;
CREATE POLICY "allow_public_read_order_items" ON public.order_items
  FOR SELECT
  TO public
  USING (true);

-- Verificar se as policies foram criadas corretamente
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename IN ('orders', 'customers', 'order_items')
ORDER BY tablename, policyname;