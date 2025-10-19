-- Script SQL SEGURO para corrigir RLS da Nota Fiscal
-- Este script verifica se as policies já existem antes de criar
-- Execute no Supabase Dashboard > SQL Editor

-- Verificar tabelas existentes
SELECT 'Verificando tabelas existentes...' as status;
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('customers', 'order_items', 'orders')
ORDER BY table_name;

-- Verificar policies existentes
SELECT 'Verificando policies existentes...' as status;
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename IN ('customers', 'order_items', 'orders')
ORDER BY tablename, policyname;

-- Função para criar policy apenas se não existir
DO $$
BEGIN
  -- Policy para leitura pública de orders
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'orders' 
    AND policyname = 'allow_public_read_orders'
  ) THEN
    CREATE POLICY "allow_public_read_orders" ON public.orders
      FOR SELECT
      TO public
      USING (true);
    RAISE NOTICE '✅ Policy "allow_public_read_orders" criada';
  ELSE
    RAISE NOTICE '⚠️  Policy "allow_public_read_orders" já existe - pulando';
  END IF;

  -- Policy para service_role inserir orders
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'orders' 
    AND policyname = 'allow_service_role_insert_orders'
  ) THEN
    CREATE POLICY "allow_service_role_insert_orders" ON public.orders
      FOR INSERT
      TO service_role
      WITH CHECK (true);
    RAISE NOTICE '✅ Policy "allow_service_role_insert_orders" criada';
  ELSE
    RAISE NOTICE '⚠️  Policy "allow_service_role_insert_orders" já existe - pulando';
  END IF;

  -- Policy para service_role atualizar orders
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'orders' 
    AND policyname = 'allow_service_role_update_orders'
  ) THEN
    CREATE POLICY "allow_service_role_update_orders" ON public.orders
      FOR UPDATE
      TO service_role
      USING (true)
      WITH CHECK (true);
    RAISE NOTICE '✅ Policy "allow_service_role_update_orders" criada';
  ELSE
    RAISE NOTICE '⚠️  Policy "allow_service_role_update_orders" já existe - pulando';
  END IF;

  -- Tabela customers (se existir)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'customers') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'customers' 
      AND policyname = 'allow_public_read_customers'
    ) THEN
      CREATE POLICY "allow_public_read_customers" ON public.customers
        FOR SELECT
        TO public
        USING (true);
      RAISE NOTICE '✅ Policy "allow_public_read_customers" criada';
    ELSE
      RAISE NOTICE '⚠️  Policy "allow_public_read_customers" já existe - pulando';
    END IF;
  ELSE
    RAISE NOTICE 'ℹ️  Tabela customers não existe - pulando';
  END IF;

  -- Tabela order_items (se existir)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'order_items') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'order_items' 
      AND policyname = 'allow_public_read_order_items'
    ) THEN
      CREATE POLICY "allow_public_read_order_items" ON public.order_items
        FOR SELECT
        TO public
        USING (true);
      RAISE NOTICE '✅ Policy "allow_public_read_order_items" criada';
    ELSE
      RAISE NOTICE '⚠️  Policy "allow_public_read_order_items" já existe - pulando';
    END IF;
  ELSE
    RAISE NOTICE 'ℹ️  Tabela order_items não existe - pulando';
  END IF;

END $$;

-- Verificar resultado final
SELECT 'Verificando policies após execução...' as status;
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
SELECT '🎉 Script executado com sucesso! Policies RLS configuradas para nota fiscal.' as status;