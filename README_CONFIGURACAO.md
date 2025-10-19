# 🚀 Sistema de Rastreamento Multi-Gateways - Configuração Rápida

## ⚡ Configuração em 1 Comando

Para configurar **TUDO** do zero (banco + usuários + autenticação):

```bash
npm run setup:everything
```

## 🎯 Comandos SQL para Limpar Banco

Se precisar começar do zero, execute no **Supabase SQL Editor**:

```sql
-- LIMPAR TODAS AS TABELAS
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

## 📋 Scripts Disponíveis

### Configuração Completa
```bash
npm run setup:everything    # Configura TUDO (recomendado)
```

### Configuração por Partes
```bash
npm run setup:database     # Apenas banco de dados
npm run setup:auth         # Apenas autenticação
npm run setup:gateway      # Apenas gateway padrão
npm run setup:admin        # Apenas usuário admin
```

### Desenvolvimento
```bash
npm run devall             # Inicia todos os serviços
npm run dev                # Apenas frontend
npm run dev:webhook        # Apenas webhook server
```

### Testes
```bash
npm run test:email-flow    # Testa fluxo de emails
npm run test:lead-email    # Testa email de leads
```

## 👥 Credenciais Criadas

### 👑 Administrador
- **Email**: `admin@rapidtransporte.com`
- **Senha**: `admin123456`
- **Acesso**: `/admin`

### 🔧 Usuário Gateway
- **Email**: `gateway@rapidtransporte.com`
- **Senha**: `gateway123456`
- **Acesso**: `/gateway/dashboard`

## 🔗 URLs Importantes

- **Frontend**: http://localhost:5173
- **Login**: http://localhost:5173/login
- **Webhook Asset**: http://localhost:3001/webhook/asset
- **Admin**: http://localhost:5173/admin
- **Gateway Dashboard**: http://localhost:5173/gateway/dashboard

## ✅ Verificação Rápida

Após executar `npm run setup:everything`:

1. ✅ Execute `npm run devall`
2. ✅ Acesse http://localhost:5173/login
3. ✅ Faça login com admin@rapidtransporte.com / admin123456
4. ✅ Verifique se é redirecionado para /admin
5. ✅ Teste o webhook: `curl -X POST http://localhost:3001/webhook/asset`

## 🚨 Problemas Comuns

### "permission denied"
- Verifique `SUPABASE_SERVICE_ROLE_KEY` no `.env`

### "relation already exists"
- Normal! O script ignora esses erros

### Login não funciona
- Execute `npm run setup:auth` novamente

### Webhook não responde
- Verifique se `npm run devall` está rodando
- Confirme porta 3001 livre

## 📞 Suporte

Para problemas, verifique:
1. Arquivo `.env` com credenciais corretas
2. Supabase project ativo
3. Node.js versão 16+
4. Portas 5173 e 3001 livres

---

**🎉 Sistema pronto em menos de 5 minutos!**