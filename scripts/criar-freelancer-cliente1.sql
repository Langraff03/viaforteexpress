-- Script para criar o usuário freelancer: cliente1@rapid.com
-- Execute este script no SQL Editor do Supabase

-- ============================================
-- PASSO 1: Criar usuário na tabela auth.users
-- ============================================
-- UUID válido gerado para este usuário específico
INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    role,
    aud,
    confirmation_sent_at,
    recovery_sent_at,
    email_change_sent_at,
    email_change_confirm_status,
    banned_until,
    deleted_at
) VALUES (
    'a1b2c3d4-e5f6-7890-1234-567890abcdef'::uuid,  -- UUID válido
    '00000000-0000-0000-0000-000000000000',
    'cliente1@rapid.com',
    crypt('cliente123', gen_salt('bf')),  -- Senha criptografada
    NOW(),
    NOW(),
    NOW(),
    '',
    '',
    '',
    '',
    '{"provider": "email", "providers": ["email"]}',
    '{}',
    false,
    'authenticated',
    'authenticated',
    NOW(),
    null,
    null,
    0,
    null,
    null
) ON CONFLICT (id) DO UPDATE SET
    email = 'cliente1@rapid.com',
    encrypted_password = crypt('cliente123', gen_salt('bf')),
    email_confirmed_at = NOW(),
    updated_at = NOW();

-- ============================================
-- PASSO 2: Criar perfil do freelancer
-- ============================================
INSERT INTO profiles (
    id,
    role,
    full_name,
    updated_at
) VALUES (
    'a1b2c3d4-e5f6-7890-1234-567890abcdef'::uuid,  -- Mesmo UUID
    'freelancer',
    'Cliente 1 - Freelancer',
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    role = 'freelancer',
    full_name = 'Cliente 1 - Freelancer',
    updated_at = NOW();

-- ============================================
-- PASSO 3: Verificar se foi criado corretamente
-- ============================================
SELECT 
    'Usuário freelancer criado com sucesso!' as status,
    u.id,
    u.email,
    p.role,
    p.full_name,
    u.created_at
FROM auth.users u
JOIN profiles p ON u.id = p.id
WHERE u.email = 'cliente1@rapid.com';

-- ============================================
-- INFORMAÇÕES PARA LOGIN:
-- ============================================
-- Email: cliente1@rapid.com
-- Senha: cliente123
-- URL: http://localhost:5173
-- Redirecionamento automático: /freelancer/dashboard