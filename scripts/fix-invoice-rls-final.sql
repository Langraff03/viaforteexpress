-- Script SQL para corrigir RLS da Nota Fiscal
-- Execute no Supabase Dashboard > SQL Editor

-- Verificar tabelas existentes
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('customers', 'order_items', 'orders')
ORDER BY table_name;

-- Remover policies existentes que podem estar bloqueando
DROP POLICY IF EXISTS "allow_read_orders" ON public.orders;
DROP POLICY IF EXISTS "allow_insert_orders" ON public.orders;
DROP POLICY IF EXISTS "allow_update_orders" ON public.orders;
DROP POLICY IF EXISTS "allow_webhook_insert" ON public.orders;

-- Permitir leitura pública dos pedidos (frontend)
CREATE POLICY "allow_public_read_orders" ON public.orders
  FOR SELECT
  TO public
  USING (true);

-- Permitir apenas service_role inserir pedidos (backend)
CREATE POLICY "allow_service_role_insert_orders" ON public.orders
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Permitir apenas service_role atualizar pedidos (backend)
CREATE POLICY "allow_service_role_update_orders" ON public.orders
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Criar policies para tabelas auxiliares (se existirem)
DO $$
BEGIN
  -- Tabela customers
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'customers') THEN
    DROP POLICY IF EXISTS "allow_public_read_customers" ON public.customers;
    CREATE POLICY "allow_public_read_customers" ON public.customers
      FOR SELECT
      TO public
      USING (true);
    RAISE NOTICE 'Policy criada para tabela customers';
  ELSE
    RAISE NOTICE 'Tabela customers não existe - pulando';
  END IF;

  -- Tabela order_items
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'order_items') THEN
    DROP POLICY IF EXISTS "allow_public_read_order_items" ON public.order_items;
    CREATE POLICY "allow_public_read_order_items" ON public.order_items
      FOR SELECT
      TO public
      USING (true);
    RAISE NOTICE 'Policy criada para tabela order_items';
  ELSE
    RAISE NOTICE 'Tabela order_items não existe - pulando';
  END IF;
END $$;

-- Verificar policies criadas
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename IN ('customers', 'order_items', 'orders')
  AND policyname LIKE '%public_read%'
ORDER BY tablename, policyname;

-- Mensagem final
SELECT 'Políticas RLS configuradas com sucesso para nota fiscal!' as status;