-- ============================================================================
-- TESTE DA CORREÇÃO RLS - VERIFICAÇÃO RÁPIDA
-- Execute este SQL no Supabase para verificar se a correção funciona
-- ============================================================================

-- 1. VERIFICAR POLÍTICAS ATUAIS (antes de aplicar a correção)
SELECT 
  tablename,
  policyname,
  cmd
FROM pg_policies 
WHERE tablename IN ('orders', 'profiles')
ORDER BY tablename, policyname;

-- 2. REMOVER POLÍTICA PROBLEMÁTICA (se existir)
DROP POLICY IF EXISTS "admin_full_access_profiles" ON profiles;

-- 3. VERIFICAR SE RECURSÃO FOI ELIMINADA
SELECT 
  tablename,
  policyname
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- RESULTADO ESPERADO:
-- Deve mostrar apenas: "users_own_profile"
-- NÃO deve mostrar: "admin_full_access_profiles"