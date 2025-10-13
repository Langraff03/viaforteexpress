# 🔍 DIAGNÓSTICO: CPF e Telefone não estão sendo salvos

## 📋 **SITUAÇÃO ATUAL**
- ✅ Sistema foi reiniciado
- ✅ Campos `customer_phone` e `customer_cpf` existem no banco
- ❌ **NENHUM** pedido tem CPF ou telefone preenchido

## 🎯 **POSSÍVEIS CAUSAS**

### **1. Webhooks não enviam dados de CPF/telefone**
- Os gateways (Asset, Shopify, etc.) podem não estar enviando esses dados nos payloads
- Verifique se o checkout/pagamento está coletando CPF/telefone do cliente

### **2. Estrutura do payload diferente**
- Os dados podem estar em campos diferentes do esperado
- Exemplo: `customer.document` ao invés de `customer.cpf`

### **3. Erro na lógica de extração**
- A função `GatewayUtils.extractCustomerInfo()` pode não estar encontrando os dados

## 🔧 **COMO DIAGNOSTICAR**

### **Passo 1: Verificar logs do sistema**
Quando um webhook chegar, procure por estes logs:
```
📦 🔍 DEBUG PAYLOAD - Payload completo: {...}
📦 🔍 DEBUG CUSTOMER DATA - Extraído: phone=..., cpf=...
📦 🔍 DEBUG SAVE - Dados sendo salvos: {...}
```

### **Passo 2: Compartilhar payload real**
Envie um exemplo do payload que está chegando no webhook para análise.

### **Passo 3: Testar manualmente**
Execute o script de diagnóstico:
```bash
node scripts/diagnostico-simples-cpf-telefone.js
```

## 📋 **VERIFICAÇÕES FEITAS**

✅ **Campos no banco:** `customer_phone TEXT NULL`, `customer_cpf TEXT NULL`  
✅ **Código implementado:** Extração e salvamento funcionando  
✅ **Logs adicionados:** Para debug detalhado  
✅ **Tipos TypeScript:** Interface `Order` atualizada  

## 🎯 **PRÓXIMOS PASSOS**

1. **Aguarde próximo webhook** e verifique os logs
2. **Compartilhe o payload** se os logs mostrarem que não há dados
3. **Verifique o checkout** - está coletando CPF/telefone do cliente?

## 💡 **HIPÓTESE MAIS PROVÁVEL**

Os webhooks provavelmente **não estão enviando dados de CPF/telefone** nos payloads. Isso é comum quando:
- O gateway não coleta esses dados
- O checkout não pede CPF/telefone
- A integração não está configurada para enviar esses campos

**SOLUÇÃO:** Verificar se o sistema de checkout está coletando e enviando CPF/telefone nos webhooks.