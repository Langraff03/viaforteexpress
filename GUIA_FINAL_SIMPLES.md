# 🚀 Configuração Completa - Guia Super Simples

## 🗑️ 1. Limpar Banco (se necessário)

Execute no **Supabase SQL Editor**:

```sql
SET session_replication_role = replica;
DROP TABLE IF EXISTS public.log_offer_emails CASCADE;
DROP TABLE IF EXISTS public.log_external_lead_batches CASCADE;
DROP TABLE IF EXISTS public.log_lead_file_uploads CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.leads CASCADE;
DROP TABLE IF EXISTS public.offers CASCADE;
DROP TABLE IF EXISTS public.gateways CASCADE;
DROP TABLE IF EXISTS public.clients CASCADE;
DROP TYPE IF EXISTS public.lead_status CASCADE;
DROP TYPE IF EXISTS public.order_status CASCADE;
DROP TYPE IF EXISTS public.app_role CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
SET session_replication_role = DEFAULT;
```

## 🏗️ 2. Criar Estrutura do Banco

Execute no **Supabase SQL Editor**: [`scripts/setup-complete-system.sql`](scripts/setup-complete-system.sql)

## 👥 3. Criar Usuários na Autenticação

1. Acesse **Supabase** → **Authentication** → **Users**
2. Clique **"Add User"**

**Usuário Admin:**
- Email: `admin@rapidtransporte.com`
- Senha: `admin123456`
- Marcar: "Auto-confirm user"

**Usuário Gateway:**
- Email: `gateway@rapidtransporte.com`
- Senha: `gateway123456`
- Marcar: "Auto-confirm user"

## 🎭 4. Criar Perfis dos Usuários

Execute no **Supabase SQL Editor**:

```sql
-- PERFIL ADMINISTRADOR (busca UUID automaticamente)
INSERT INTO public.profiles (id, role, client_id, gateway_id, full_name, updated_at)
SELECT 
    u.id,
    'admin'::public.app_role,
    '0ec3137d-ee68-4aba-82de-143b3c61516a',
    NULL,
    'Administrador do Sistema',
    now()
FROM auth.users u
WHERE u.email = 'admin@rapidtransporte.com'
ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    client_id = EXCLUDED.client_id,
    full_name = EXCLUDED.full_name,
    updated_at = EXCLUDED.updated_at;

-- PERFIL USUÁRIO GATEWAY (busca UUID automaticamente)
INSERT INTO public.profiles (id, role, client_id, gateway_id, full_name, updated_at)
SELECT 
    u.id,
    'gateway_user'::public.app_role,
    '0ec3137d-ee68-4aba-82de-143b3c61516a',
    '7e7e93d9-fc1a-4ae0-b7ab-775494d57cad',
    'Usuário Gateway Asset',
    now()
FROM auth.users u
WHERE u.email = 'gateway@rapidtransporte.com'
ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    client_id = EXCLUDED.client_id,
    gateway_id = EXCLUDED.gateway_id,
    full_name = EXCLUDED.full_name,
    updated_at = EXCLUDED.updated_at;
```

## ✅ 5. Verificar se Funcionou

Execute no **Supabase SQL Editor**:

```sql
SELECT 
    p.role,
    p.full_name,
    u.email,
    c.name as client_name
FROM public.profiles p
JOIN auth.users u ON p.id = u.id
LEFT JOIN public.clients c ON p.client_id = c.id
ORDER BY p.role;
```

Deve mostrar:
- admin | Administrador do Sistema | admin@rapidtransporte.com
- gateway_user | Usuário Gateway Asset | gateway@rapidtransporte.com

## 🎯 6. Testar o Sistema

```bash
npm run devall
```

Acesse: http://localhost:5173/login

**Teste Admin:**
- Email: `admin@rapidtransporte.com`
- Senha: `admin123456`
- Deve ir para: `/admin`

**Teste Gateway:**
- Email: `gateway@rapidtransporte.com`
- Senha: `gateway123456`
- Deve ir para: `/gateway/dashboard`

## 🎉 Pronto!

### 👑 Admin
- **Email**: admin@rapidtransporte.com
- **Senha**: admin123456
- **Acesso**: Painel administrativo completo

### 🔧 Gateway User
- **Email**: gateway@rapidtransporte.com
- **Senha**: gateway123456
- **Acesso**: Dashboard do gateway Asset

### 💳 Gateway Asset
- **Tipo**: Asset (Asaas)
- **Webhook**: http://localhost:3001/webhook/asset
- **Status**: Ativo

---

**✨ Sistema 100% funcional em 4 passos simples!**

**Não precisa de UUIDs específicos - o SQL busca automaticamente!**