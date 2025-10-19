# 👥 Guia Completo para Criar Usuários - Passo a Passo

## 🎯 Objetivo
Criar usuários administrador e gateway com autenticação e perfis completos.

## 📋 Passo 1: Criar Usuários na Autenticação do Supabase

### 1.1 Acessar o Supabase
1. Acesse [app.supabase.com](https://app.supabase.com)
2. Selecione seu projeto
3. Vá para **Authentication** → **Users**

### 1.2 Criar Usuário Administrador
1. Clique em **"Add User"**
2. Preencha:
   - **Email**: `admin@rapidtransporte.com`
   - **Password**: `admin123456`
   - **User ID**: `a1b2c3d4-e5f6-7890-abcd-ef1234567890` (opcional, mas recomendado)
3. Marque **"Auto-confirm user"**
4. Clique em **"Create User"**

### 1.3 Criar Usuário Gateway
1. Clique em **"Add User"** novamente
2. Preencha:
   - **Email**: `gateway@rapidtransporte.com`
   - **Password**: `gateway123456`
   - **User ID**: `b2c3d4e5-f6g7-8901-bcde-f23456789012` (opcional, mas recomendado)
3. Marque **"Auto-confirm user"**
4. Clique em **"Create User"**

## 📋 Passo 2: Criar Perfis na Tabela Profiles

### 2.1 Acessar SQL Editor
1. No Supabase, vá para **SQL Editor**
2. Clique em **"New Query"**

### 2.2 Executar SQL para Criar Perfis

Cole e execute este SQL:

```sql
-- PERFIL ADMINISTRADOR
INSERT INTO public.profiles (id, role, client_id, gateway_id, full_name, updated_at) 
VALUES (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',  -- ID do usuário admin
    'admin'::public.app_role,
    '0ec3137d-ee68-4aba-82de-143b3c61516a',  -- Cliente padrão
    NULL,  -- Admin não tem gateway específico
    'Administrador do Sistema',
    now()
) ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    client_id = EXCLUDED.client_id,
    full_name = EXCLUDED.full_name,
    updated_at = EXCLUDED.updated_at;

-- PERFIL USUÁRIO GATEWAY
INSERT INTO public.profiles (id, role, client_id, gateway_id, full_name, updated_at) 
VALUES (
    'b2c3d4e5-f6g7-8901-bcde-f23456789012',  -- ID do usuário gateway
    'gateway_user'::public.app_role,
    '0ec3137d-ee68-4aba-82de-143b3c61516a',  -- Cliente padrão
    '7e7e93d9-fc1a-4ae0-b7ab-775494d57cad',  -- Gateway Asset padrão
    'Usuário Gateway Asset',
    now()
) ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    client_id = EXCLUDED.client_id,
    gateway_id = EXCLUDED.gateway_id,
    full_name = EXCLUDED.full_name,
    updated_at = EXCLUDED.updated_at;
```

### 2.3 Verificar se Foi Criado

Execute este SQL para verificar:

```sql
SELECT 
    p.id,
    p.role,
    p.full_name,
    c.name as client_name,
    COALESCE(g.name, 'N/A') as gateway_name
FROM public.profiles p
LEFT JOIN public.clients c ON p.client_id = c.id
LEFT JOIN public.gateways g ON p.gateway_id = g.id
ORDER BY p.role;
```

## 📋 Passo 3: Verificar se os IDs Coincidem

### 3.1 Se Você Não Usou IDs Fixos

Se você não especificou os IDs na criação dos usuários, precisa descobrir os IDs reais:

1. Vá para **Authentication** → **Users**
2. Clique em cada usuário para ver o ID
3. Substitua os IDs no SQL acima pelos IDs reais

### 3.2 Comando para Descobrir IDs (se tiver acesso)

```sql
SELECT id, email FROM auth.users 
WHERE email IN (
    'admin@rapidtransporte.com',
    'gateway@rapidtransporte.com'
);
```

## 📋 Passo 4: Testar o Sistema

### 4.1 Iniciar o Sistema
```bash
npm run devall
```

### 4.2 Testar Login
1. Acesse: http://localhost:5173/login
2. Teste com admin:
   - Email: `admin@rapidtransporte.com`
   - Senha: `admin123456`
   - Deve redirecionar para `/admin`

3. Teste com gateway user:
   - Email: `gateway@rapidtransporte.com`
   - Senha: `gateway123456`
   - Deve redirecionar para `/gateway/dashboard`

## 🎉 Resultado Final

### 👑 Usuário Administrador
- **Email**: admin@rapidtransporte.com
- **Senha**: admin123456
- **Role**: admin
- **Acesso**: Painel administrativo completo
- **URL**: /admin

### 🔧 Usuário Gateway
- **Email**: gateway@rapidtransporte.com
- **Senha**: gateway123456
- **Role**: gateway_user
- **Acesso**: Dashboard do gateway Asset
- **URL**: /gateway/dashboard

## 🚨 Solução de Problemas

### Erro: "User not found"
- Verifique se o usuário foi criado na autenticação
- Confirme se o email está correto

### Erro: "Profile not found"
- Verifique se o perfil foi criado na tabela profiles
- Confirme se o ID do perfil coincide com o ID do usuário na autenticação

### Login não redireciona
- Verifique se o role está correto no perfil
- Confirme se as políticas RLS estão configuradas

### Comando para Recriar Perfil
Se precisar recriar um perfil:

```sql
DELETE FROM public.profiles WHERE id = 'SEU_UUID_AQUI';
-- Depois execute novamente o INSERT
```

## 📞 Verificação Rápida

Execute este comando para verificar tudo:

```sql
-- Verificar estrutura completa
SELECT 'Usuários na autenticação:' as tipo, email as info FROM auth.users
UNION ALL
SELECT 'Perfis criados:', full_name FROM public.profiles
UNION ALL  
SELECT 'Cliente:', name FROM public.clients
UNION ALL
SELECT 'Gateway:', name FROM public.gateways;
```

---

**✅ Usuários criados e sistema pronto para uso!**