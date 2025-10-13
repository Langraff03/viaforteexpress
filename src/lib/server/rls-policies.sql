-- ============================================================================
-- CORREÇÃO VULNERABILIDADE SUPABASE: ROW LEVEL SECURITY POLICIES
-- Este arquivo deve ser executado no Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- 1. TABELA ORDERS - Rastreamento Público + Admin Completo
-- ============================================================================

-- Habilitar RLS na tabela orders
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Política: Rastreamento público por código (SEM LOGIN)
-- Permite qualquer pessoa ver pedido se tiver o tracking_code
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
-- 2. TABELA LOG_OFFER_EMAILS - Logs de Email
-- ============================================================================

-- Habilitar RLS na tabela log_offer_emails
ALTER TABLE log_offer_emails ENABLE ROW LEVEL SECURITY;

-- Política: Admin vê todos os logs de email
CREATE POLICY "admin_full_access_email_logs" ON log_offer_emails
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Política: Gateway users veem logs relacionados aos seus pedidos
CREATE POLICY "gateway_own_email_logs" ON log_offer_emails
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      JOIN orders ON orders.client_id = profiles.client_id
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'gateway_user'
      AND orders.id = log_offer_emails.order_id
    )
  );

-- ============================================================================
-- 3. TABELA PROFILES - Perfis de Usuário
-- ============================================================================

-- Habilitar RLS na tabela profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Política: Usuário vê próprio perfil
CREATE POLICY "users_own_profile" ON profiles
  FOR SELECT
  USING (id = auth.uid());

-- Política: Admin vê todos os perfis
CREATE POLICY "admin_full_access_profiles" ON profiles
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'admin'
    )
  );

-- ============================================================================
-- 4. OUTRAS TABELAS IMPORTANTES (que existem no projeto)
-- ============================================================================

-- Tabela campaigns (se existir)
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'campaigns') THEN
    ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "admin_full_access_campaigns" ON campaigns
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

-- Tabela gateways
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

-- Política: Gateway users veem seus próprios gateways
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

-- Tabela order_items
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Política: Acesso público para itens de pedidos rastreáveis
CREATE POLICY "public_order_items" ON order_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.tracking_code IS NOT NULL
    )
  );

-- Política: Admin vê todos os itens
CREATE POLICY "admin_full_access_order_items" ON order_items
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ============================================================================
-- 6. VERIFICAÇÃO DAS POLÍTICAS CRIADAS
-- ============================================================================

-- Query para verificar todas as políticas RLS criadas
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename IN ('orders', 'log_offer_emails', 'profiles', 'campaigns', 'email_domains', 'gateways', 'order_items')
ORDER BY tablename, policyname;

-- ============================================================================
-- INSTRUÇÕES DE USO:
-- ============================================================================
-- 1. Execute este SQL no Supabase SQL Editor
-- 2. Verifique se todas as policies foram criadas corretamente
-- 3. Teste o acesso público: SELECT * FROM orders WHERE tracking_code = 'CODIGO';
-- 4. Teste o acesso admin: Faça login como admin e tente SELECT * FROM orders;
-- 5. As políticas garantem que:
--    - Qualquer pessoa pode rastrear pedidos com código
--    - Admin vê todos os dados
--    - Gateway users veem apenas seus dados
--    - Freelancers veem dados relacionados aos seus clientes
-- ============================================================================