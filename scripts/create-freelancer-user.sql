-- Script para criar usuário freelancer no Supabase
-- Execute este script no SQL Editor do Supabase após criar o usuário na Auth

-- ============================================
-- PASSO 1: Criar usuário na Auth do Supabase
-- ============================================
-- Vá até Authentication > Users no painel do Supabase
-- Clique em "Add User" e preencha:
-- - Email: freelancer@teste.com
-- - Password: 123456 (ou sua escolha)
-- - Auto Confirm User: TRUE
-- 
-- Anote o UUID do usuário criado

-- ============================================
-- PASSO 2: Executar este script
-- ============================================
-- Substitua 'UUID_DO_USUARIO_AQUI' pelo UUID real do usuário criado

-- Exemplo de inserção de perfil freelancer:
INSERT INTO profiles (id, role, full_name, updated_at) 
VALUES (
    'UUID_DO_USUARIO_AQUI'::uuid,  -- Substitua pelo UUID real
    'freelancer',
    'Freelancer Teste',
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    role = 'freelancer',
    full_name = 'Freelancer Teste',
    updated_at = NOW();

-- ============================================
-- EXEMPLO PRÁTICO (use os UUIDs reais):
-- ============================================
-- INSERT INTO profiles (id, role, full_name, updated_at) 
-- VALUES (
--     'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid,
--     'freelancer',
--     'João Silva - Freelancer',
--     NOW()
-- ) ON CONFLICT (id) DO UPDATE SET
--     role = 'freelancer',
--     full_name = 'João Silva - Freelancer',
--     updated_at = NOW();

-- ============================================
-- VERIFICAÇÃO
-- ============================================
-- Verificar se o usuário foi criado corretamente:
SELECT 
    p.id,
    p.role,
    p.full_name,
    u.email,
    u.created_at
FROM profiles p
JOIN auth.users u ON p.id = u.id
WHERE p.role = 'freelancer';

-- ============================================
-- DICAS IMPORTANTES:
-- ============================================
-- 1. O UUID deve ser exatamente igual ao da tabela auth.users
-- 2. O role deve ser 'freelancer' (já foi adicionado ao enum)
-- 3. Após criar, o usuário poderá fazer login normalmente
-- 4. Será redirecionado automaticamente para /freelancer/dashboard