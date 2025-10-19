-- ============================================================================
-- CORREÇÃO MÍNIMA PARA PRODUÇÃO - APENAS REMOVE RECURSÃO INFINITA
-- ⚠️  SEGURO: Não afeta políticas existentes que já funcionam
-- ============================================================================

-- 🎯 ESTE É O ARQUIVO PARA COPIAR E COLAR NO SUPABASE!

-- Remove APENAS a política que causa "infinite recursion detected"
DROP POLICY IF EXISTS "admin_full_access_profiles" ON profiles;

-- ============================================================================
-- VERIFICAÇÃO: Execute para confirmar que a correção funcionou
-- ============================================================================

-- Query 1: Verifica políticas na tabela profiles (deve mostrar apenas policies sem recursão)
SELECT 
  tablename,
  policyname,
  cmd
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- Query 2: Verifica se ainda existe alguma política de admin problemática
SELECT COUNT(*) as politicas_admin_profiles
FROM pg_policies 
WHERE tablename = 'profiles' 
AND policyname LIKE '%admin%';

-- RESULTADO ESPERADO:
-- Query 1: Deve mostrar apenas "users_own_profile" (ou outras que NÃO sejam admin)
-- Query 2: Deve retornar 0 (zero políticas de admin na tabela profiles)

-- ============================================================================
-- 🚨 IMPORTANTE: 
-- Esta correção remove APENAS a política problemática
-- Mantém todo o resto do sistema funcionando normalmente
-- Produção NÃO será afetada
-- ============================================================================