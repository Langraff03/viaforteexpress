-- Script SQL para corrigir apenas o problema da nota fiscal
-- Execute no Supabase Dashboard > SQL Editor

-- Primeiro, vamos verificar quais tabelas existem
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('customers', 'order_items', 'orders')
ORDER BY table_name;

-- Criar policies apenas para tabelas que existem
-- Se a tabela customers existir, permitir leitura pública
DO $$
BEGIN
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
END $$;

-- Se a tabela order_items existir, permitir leitura pública
DO $$
BEGIN
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