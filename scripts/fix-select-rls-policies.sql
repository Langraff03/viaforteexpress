-- =================================================================
-- VERSÃO 3 (FINAL E SEGURA) - ARQUIVO DE CORREÇÃO DEFINITIVO PARA POLÍTICAS DE RLS
--
-- OBJETIVO: Implementar políticas de RLS idempotentes e robustas,
-- garantindo que a execução repetida não cause erros e que as
-- permissões essenciais para o login funcionem corretamente.
-- =================================================================

-- 1. Habilitar RLS (é seguro rodar múltiplas vezes).
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gateways ENABLE ROW LEVEL SECURITY;

-- 2. Função auxiliar para verificar se o usuário é 'admin'.
-- Usar "CREATE OR REPLACE" torna o script seguro para re-execução.
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- 3. Políticas para 'profiles'
-- Usar "DROP POLICY IF EXISTS" antes de cada "CREATE POLICY" garante que não haverá conflitos.
DROP POLICY IF EXISTS "all_access_for_admins" ON public.profiles;
CREATE POLICY "all_access_for_admins" ON public.profiles FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "user_can_read_own_profile" ON public.profiles;
CREATE POLICY "user_can_read_own_profile" ON public.profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "user_can_update_own_profile" ON public.profiles;
CREATE POLICY "user_can_update_own_profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 4. Políticas para 'clients'
DROP POLICY IF EXISTS "all_access_for_admins" ON public.clients;
CREATE POLICY "all_access_for_admins" ON public.clients FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "user_can_read_associated_client" ON public.clients;
CREATE POLICY "user_can_read_associated_client" ON public.clients FOR SELECT USING (EXISTS (
  SELECT 1 FROM public.profiles WHERE public.profiles.id = auth.uid() AND public.profiles.client_id = public.clients.id
));

-- 5. Políticas para 'gateways'
DROP POLICY IF EXISTS "all_access_for_admins" ON public.gateways;
CREATE POLICY "all_access_for_admins" ON public.gateways FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "user_can_read_associated_gateway" ON public.gateways;
CREATE POLICY "user_can_read_associated_gateway" ON public.gateways FOR SELECT USING (EXISTS (
  SELECT 1 FROM public.profiles WHERE public.profiles.id = auth.uid() AND public.profiles.gateway_id = public.gateways.id
));

-- Mensagem de conclusão
SELECT 'Políticas de RLS (V3 - FINAL) foram aplicadas com sucesso.' as status;