# 🔧 RESOLVER WEBHOOK DEFINITIVAMENTE

## ❌ Problema Atual
O webhook está retornando "No Asset gateway found" porque:
1. O cliente padrão `0ec3137d-ee68-4aba-82de-143b3c61516a` não existe no banco
2. Não há gateway Asset configurado para esse cliente
3. As políticas RLS podem estar bloqueando operações do webhook

## ✅ Solução Definitiva

### 1. Execute o Script Final
No **Supabase SQL Editor**, execute o arquivo:
```sql
-- Copie e cole todo o conteúdo de: scripts/RESOLVER_WEBHOOK_FINAL.sql
```

### 2. O que o Script Faz
- ✅ Verifica usuários, perfis e gateways existentes
- ✅ Cria cliente padrão `0ec3137d-ee68-4aba-82de-143b3c61516a`
- ✅ Cria perfil `gateway_user` para o cliente
- ✅ Cria gateway Asset com ID `7e7e93d9-fc1a-4ae0-b7ab-775494d57cad`
- ✅ Configura políticas RLS para permitir webhooks
- ✅ Verifica se tudo foi criado corretamente

### 3. Teste o Webhook
Após executar o script, teste novamente:
```bash
# No terminal do projeto
npm run webhook
```

### 4. Verificação
O webhook deve agora:
- ✅ Encontrar o gateway Asset
- ✅ Processar pagamentos corretamente
- ✅ Criar/atualizar pedidos no banco
- ✅ Não mostrar mais "No Asset gateway found"

## 🔍 Logs Esperados
Após a correção, você deve ver:
```
[Webhook] Recebido para gateway: asset, cliente: default
[Webhook] Usando gateway padrão para asset
[Gateway] Gateway Asset encontrado para cliente 0ec3137d-ee68-4aba-82de-143b3c61516a
[Webhook] Gateway asset processed successfully
```

## 📋 Checklist Final
- [ ] Script executado no Supabase
- [ ] Cliente padrão criado
- [ ] Gateway Asset configurado
- [ ] Políticas RLS atualizadas
- [ ] Webhook testado e funcionando

## 🆘 Se Ainda Houver Erro
1. Verifique se o script foi executado completamente
2. Confirme se não houve erros no SQL Editor
3. Reinicie o servidor webhook
4. Teste novamente

---
**Nota**: Este script resolve definitivamente o problema do webhook Asset.