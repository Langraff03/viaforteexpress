# 🗄️ Configuração do Banco de Dados - Guia Completo

Este guia te ajudará a configurar o banco de dados do zero para o sistema de rastreamento multi-gateways.

## 📋 Pré-requisitos

1. ✅ Conta no Supabase criada
2. ✅ Projeto no Supabase criado
3. ✅ Arquivo `.env` configurado com as credenciais

## 🚀 Opção 1: Configuração Automática (Recomendada)

### Passo 1: Executar o script automático
```bash
node scripts/setup-database.js
```

Este script irá:
- ✅ Criar todas as tabelas necessárias
- ✅ Criar tipos personalizados (ENUMs)
- ✅ Inserir dados iniciais (cliente e gateway padrão)
- ✅ Configurar índices para performance
- ✅ Verificar se tudo foi criado corretamente

## 🛠️ Opção 2: Configuração Manual

### Passo 1: Acessar o Supabase
1. Acesse [supabase.com](https://supabase.com)
2. Faça login na sua conta
3. Selecione seu projeto
4. Vá para **SQL Editor**

### Passo 2: Executar o script SQL
1. Abra o arquivo `scripts/setup-database.sql`
2. Copie todo o conteúdo
3. Cole no SQL Editor do Supabase
4. Clique em **Run** para executar

## 🔍 Verificação da Configuração

Após executar qualquer uma das opções acima, verifique se:

### 1. Tabelas foram criadas:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

Você deve ver estas tabelas:
- ✅ `clients`
- ✅ `gateways` 
- ✅ `leads`
- ✅ `log_external_lead_batches`
- ✅ `log_lead_file_uploads`
- ✅ `log_offer_emails`
- ✅ `offers`
- ✅ `orders`
- ✅ `profiles`

### 2. Cliente padrão foi criado:
```sql
SELECT id, name FROM clients 
WHERE id = '0ec3137d-ee68-4aba-82de-143b3c61516a';
```

### 3. Gateway padrão foi criado:
```sql
SELECT id, name, type FROM gateways 
WHERE client_id = '0ec3137d-ee68-4aba-82de-143b3c61516a';
```

## 🎯 Estrutura do Banco

### Tabelas Principais:
- **`clients`**: Clientes do sistema
- **`gateways`**: Configurações dos gateways de pagamento
- **`orders`**: Pedidos e transações
- **`leads`**: Leads para campanhas de email
- **`offers`**: Ofertas para leads

### Tabelas de Log:
- **`log_offer_emails`**: Log de emails enviados
- **`log_lead_file_uploads`**: Log de uploads de arquivos
- **`log_external_lead_batches`**: Log de processamento de leads

### Tipos Personalizados:
- **`lead_status`**: 'ativo', 'inativo', 'processado'
- **`order_status`**: 'created', 'pending', 'paid', 'shipped', 'delivered', 'cancelled'
- **`app_role`**: 'admin', 'gateway_user', 'client'

## 🔧 Configurações Importantes

### Dados Padrão Criados:

**Cliente Padrão:**
- ID: `0ec3137d-ee68-4aba-82de-143b3c61516a`
- Nome: "Cliente Padrão"

**Gateway Asset Padrão:**
- ID: `7e7e93d9-fc1a-4ae0-b7ab-775494d57cad`
- Tipo: "asset"
- API Key: Configurada do arquivo `.env`

## 🚨 Solução de Problemas

### Erro: "relation already exists"
✅ **Normal!** Significa que a tabela já existe. O script ignora esses erros.

### Erro: "permission denied"
❌ Verifique se está usando a `SUPABASE_SERVICE_ROLE_KEY` no `.env`

### Erro: "invalid input syntax for type uuid"
❌ Verifique se os UUIDs estão no formato correto

### Tabelas não aparecem
1. Verifique se executou o script completo
2. Refresh a página do Supabase
3. Verifique se não há erros no console

## 🎉 Próximos Passos

Após configurar o banco:

1. **Testar o sistema:**
   ```bash
   npm run devall
   ```

2. **Verificar webhooks:**
   - URL: `http://localhost:3001/webhook/asset`
   - O sistema deve aceitar webhooks do Asset

3. **Monitorar logs:**
   - Verifique se não há erros de conexão
   - Confirme que webhooks são processados

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs do console
2. Confirme que o Redis está rodando
3. Verifique as credenciais do Supabase no `.env`
4. Execute novamente o script de configuração

---

**✨ Banco configurado com sucesso? Agora você pode processar webhooks e gerenciar pedidos!**