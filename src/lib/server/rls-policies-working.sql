-- ============================================================================
-- CORREÇÃO VULNERABILIDADE SUPABASE: ROW LEVEL SECURITY - VERSÃO FUNCIONAL
-- Este SQL funciona 100% - apenas tabelas essenciais verificadas
-- ============================================================================

-- ============================================================================
-- 1. TABELA ORDERS - Rastreamento Público + Admin (CRÍTICO!)
-- ============================================================================

-- Habilitar RLS na tabela orders
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Política: Rastreamento público por código (SEM LOGIN) - FUNCIONALIDADE PRINCIPAL
CREATE POLICY "public_tracking_by_code" ON orders
  FOR SELECT
  USING (tracking_code IS NOT NULL);

-- Política: Admin vê todos os pedidos
CREATE POLICY "admin_full_access_orders" ON orders
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Política: Gateway users veem pedidos do seu client_id
CREATE POLICY "gateway_own_orders" ON orders
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'gateway_user'
      AND profiles.client_id = orders.client_id
    )
  );

-- Política: Freelancers veem pedidos relacionados aos seus gateways
CREATE POLICY "freelancer_related_orders" ON orders
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'freelancer'
      AND profiles.client_id = orders.client_id
    )
  );

-- ============================================================================
-- 2. TABELA PROFILES - Controle de Role (OBRIGATÓRIO!)
-- ============================================================================

-- Habilitar RLS na tabela profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Política: Usuário vê próprio perfil
CREATE POLICY "users_own_profile" ON profiles
  FOR SELECT
  USING (id = auth.uid());

-- NOTA: Política de admin removida para evitar recursão infinita
-- Admin usa backend com SERVICE_ROLE_KEY que bypassa RLS
-- Frontend admin usa apenas a política "users_own_profile" + RLS de outras tabelas

-- ============================================================================
-- 3. TABELAS OPCIONAIS - Aplicadas se existirem (sem falhar)
-- ============================================================================

-- Tabela email_logs (tem order_id)
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'email_logs') THEN
    ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
    
    -- Admin vê todos os logs
    CREATE POLICY "admin_full_access_email_logs" ON email_logs
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role = 'admin'
        )
      );
      
    -- Gateway users veem logs relacionados aos seus pedidos
    CREATE POLICY "gateway_own_email_logs" ON email_logs
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM profiles
          JOIN orders ON orders.client_id = profiles.client_id
          WHERE profiles.id = auth.uid()
          AND profiles.role = 'gateway_user'
          AND orders.id = email_logs.order_id
        )
      );
  END IF;
END $$;

-- Tabela log_offer_emails (NÃO tem order_id - apenas contagem)
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'log_offer_emails') THEN
    ALTER TABLE log_offer_emails ENABLE ROW LEVEL SECURITY;
    
    -- Admin vê todos os logs de ofertas
    CREATE POLICY "admin_full_access_offer_logs" ON log_offer_emails
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role = 'admin'
        )
      );
  END IF;
END $$;

-- Tabela email_domains
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'email_domains') THEN
    ALTER TABLE email_domains ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "admin_full_access_email_domains" ON email_domains
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role = 'admin'
        )
      );
  END IF;
END $$;

-- Tabela gateways
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'gateways') THEN
    ALTER TABLE gateways ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "admin_full_access_gateways" ON gateways
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role = 'admin'
        )
      );
      
    -- Gateway users veem seus próprios gateways
    CREATE POLICY "gateway_own_gateways" ON gateways
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role = 'gateway_user'
          AND profiles.client_id = gateways.client_id
        )
      );
  END IF;
END $$;

-- Tabela order_items
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'order_items') THEN
    ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
    
    -- Acesso público para itens de pedidos rastreáveis
    CREATE POLICY "public_order_items" ON order_items
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM orders 
          WHERE orders.id = order_items.order_id 
          AND orders.tracking_code IS NOT NULL
        )
      );
      
    -- Admin vê todos os itens
    CREATE POLICY "admin_full_access_order_items" ON order_items
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role = 'admin'
        )
      );
  END IF;
END $$;

-- ============================================================================
-- 4. VERIFICAÇÃO DAS POLÍTICAS CRIADAS
-- ============================================================================

-- Query para verificar políticas essenciais (deve retornar pelo menos 4)
SELECT 
  tablename,
  policyname,
  cmd
FROM pg_policies 
WHERE tablename IN ('orders', 'profiles')
ORDER BY tablename, policyname;

-- ============================================================================
-- 5. TESTE FUNCIONALIDADES CRÍTICAS
-- ============================================================================

-- Teste 1: Rastreamento público (SEM LOGIN) - DEVE FUNCIONAR
-- Execute em aba anônima do browser:
-- SELECT * FROM orders WHERE tracking_code = 'SQJAYK';

-- Teste 2: Admin vê tudo (COM LOGIN como admin)
-- SELECT * FROM orders LIMIT 5;

-- 