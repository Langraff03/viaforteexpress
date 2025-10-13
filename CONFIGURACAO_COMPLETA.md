# 🚀 Configuração Completa do Sistema - Guia Definitivo

Este guia te ajudará a configurar o sistema de rastreamento multi-gateways **completamente do zero** em poucos minutos.

## 📋 Pré-requisitos

✅ **Node.js** instalado (versão 16 ou superior)  
✅ **Conta no Supabase** criada  
✅ **Projeto no Supabase** criado  
✅ **Arquivo `.env`** configurado com as credenciais  

## 🎯 Comando SQL para Limpar Banco (se necessário)

Se você quiser começar do zero, execute este comando no **SQL Editor do Supabase**:

```sql
-- ATENÇÃO: Este comando irá EXCLUIR TODAS as tabelas!
-- Use apenas se quiser começar completamente do zero

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

## 🚀 Configuração Automática (Recomendada)

### Opção 1: Configuração Completa (Tudo de uma vez)

```bash
node scripts/setup-everything.js
```

Este comando irá:
- 🗑️ Limpar todas as tabelas existentes
- 🏗️ Criar toda a estrutura do banco do zero
- 👑 Criar usuário administrador
- 🔧 Criar usuário de gateway
- 🔐 Configurar autenticação completa
- ✅ Verificar se tudo está funcionando

### Opção 2: Configuração por Etapas

Se preferir fazer por etapas:

```bash
# 1. Configurar apenas o banco de dados
node scripts/setup-database.js

# 2. Configurar apenas a autenticação
node scripts/setup-complete-auth.js
```

## 📊 Estrutura Criada

### 🏢 Empresa Padrão
- **Nome**: Rapid Transporte
- **ID**: `0ec3137d-ee68-4aba-82de-143b3c61516a`
- **Configurações**: Webhooks e notificações ativados

### 💳 Gateway de Pagamento
- **Tipo**: Asset (Asaas)
- **ID**: `7e7e93d9-fc1a-4ae0-b7ab-775494d57cad`
- **Status**: Ativo e configurado
- **API**: Integração completa com Asaas

### 🎁 Oferta Padrão
- **Produto**: Melatonina Premium
- **Desconto**: 30% OFF
- **Status**: Ativa para campanhas

## 👥 Usuários Criados

### 👑 Administrador
- **Email**: `admin@rapidtransporte.com`
- **Senha**: `admin123456`
- **Acesso**: `/admin`
- **Permissões**: Acesso total ao sistema

### 🔧 Usuário Gateway
- **Email**: `gateway@rapidtransporte.com`
- **Senha**: `gateway123456`
- **Acesso**: `/gateway/dashboard`
- **Permissões**: Gerenciar pedidos do gateway Asset

## 🔐 Sistema de Autenticação

### Recursos Configurados:
- ✅ **Autenticação Supabase** integrada
- ✅ **Controle de acesso por roles** (admin, gateway_user)
- ✅ **Row Level Security (RLS)** ativado
- ✅ **Redirecionamento automático** baseado no papel
- ✅ **Sessões persistentes** e seguras

### Fluxo de Autenticação:
1. Usuário faz login com email/senha
2. Sistema verifica credenciais no Supabase Auth
3. Busca perfil e permissões na tabela `profiles`
4. Redireciona para dashboard apropriado
5. Aplica políticas de segurança baseadas no role

## 🗄️ Estrutura do Banco de Dados

### Tabelas Principais:
- **`clients`** - Clientes do sistema
- **`gateways`** - Configurações dos gateways de pagamento
- **`orders`** - Pedidos e transações
- **`leads`** - Leads para campanhas de email
- **`offers`** - Ofertas para leads
- **`profiles`** - Perfis de usuários com roles

### Tabelas de Log:
- **`log_offer_emails`** - Log de emails enviados
- **`log_lead_file_uploads`** - Log de uploads de arquivos
- **`log_external_lead_batches`** - Log de processamento de leads

### Tipos Personalizados:
- **`lead_status`**: 'ativo', 'inativo', 'processado'
- **`order_status`**: 'created', 'pending', 'paid', 'shipped', 'delivered', 'cancelled'
- **`app_role`**: 'admin', 'gateway_user', 'client'

## 🔧 Testando o Sistema

### 1. Iniciar o Sistema
```bash
npm run devall
```

### 2. Acessar a Interface
- **Frontend**: http://localhost:5173
- **Login**: http://localhost:5173/login
- **Webhook**: http://localhost:3001/webhook/asset

### 3. Testar Login
1. Acesse http://localhost:5173/login
2. Use as credenciais do administrador ou gateway user
3. Verifique se é redirecionado corretamente

### 4. Testar Webhook
```bash
curl -X POST http://localhost:3001/webhook/asset \
  -H "Content-Type: application/json" \
  -d '{"event": "PAYMENT_RECEIVED", "payment": {"id": "test123"}}'
```

## 🔍 Verificações de Funcionamento

### Verificar Tabelas Criadas:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

### Verificar Usuários:
```sql
SELECT p.role, p.full_name, u.email 
FROM profiles p 
JOIN auth.users u ON p.id = u.id;
```

### Verificar Gateway:
```sql
SELECT id, name, type, is_active 
FROM gateways 
WHERE type = 'asset';
```

## 🚨 Solução de Problemas

### Erro: "relation already exists"
✅ **Normal!** O script ignora esses erros automaticamente.

### Erro: "permission denied"
❌ Verifique se está usando a `SUPABASE_SERVICE_ROLE_KEY` correta no `.env`

### Erro: "invalid input syntax for type uuid"
❌ Verifique se os UUIDs estão no formato correto no script

### Login não funciona
1. Verifique se os usuários foram criados no Supabase Auth
2. Confirme se os perfis existem na tabela `profiles`
3. Verifique se o RLS está configurado corretamente

### Webhook não responde
1. Verifique se o servidor webhook está rodando na porta 3001
2. Confirme se o gateway está ativo no banco
3. Verifique os logs do console para erros

## 📞 Comandos Úteis

### Recriar apenas usuários:
```bash
node scripts/setup-complete-auth.js
```

### Recriar apenas banco:
```bash
node scripts/setup-database.js
```

### Verificar logs em tempo real:
```bash
npm run devall
```

### Testar fluxo de email:
```bash
npm run test:email-flow
```

## 🎉 Próximos Passos

Após a configuração:

1. **Personalize as configurações** da empresa em `/admin`
2. **Configure webhooks** no painel do Asaas
3. **Teste o fluxo completo** de pedidos
4. **Configure domínio personalizado** se necessário
5. **Monitore logs** para garantir funcionamento

---

## 📋 Resumo das Credenciais

### 🏢 Sistema
- **URL**: https://rastreio.logfastexpress.com
- **Ambiente Local**: http://localhost:5173

### 👑 Administrador
- **Email**: admin@rapidtransporte.com
- **Senha**: admin123456
- **Dashboard**: /admin

### 🔧 Gateway User
- **Email**: gateway@rapidtransporte.com
- **Senha**: gateway123456
- **Dashboard**: /gateway/dashboard

### 💳 Gateway Asset
- **Tipo**: Asset (Asaas)
- **Webhook**: /webhook/asset
- **Status**: Ativo

---

**✨ Sistema configurado e pronto para uso!**