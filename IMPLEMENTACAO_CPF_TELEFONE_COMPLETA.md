# 📋 Implementação CPF e Telefone na Tabela Orders - COMPLETA

## ✅ **Resumo da Implementação**

Sistema agora **captura e salva CPF e telefone** dos clientes automaticamente nos webhooks de pagamento!

---

## 🗄️ **1. Migração do Banco de Dados**

**EXECUTE no Supabase SQL Editor:**
```sql
ALTER TABLE public.orders ADD COLUMN customer_phone TEXT NULL;
ALTER TABLE public.orders ADD COLUMN customer_cpf TEXT NULL;
```

📁 **Arquivos:** 
- [`scripts/add-customer-phone-cpf-fields-clean.sql`](scripts/add-customer-phone-cpf-fields-clean.sql)

---

## 🔧 **2. Arquivos Modificados**

### **2.1 Tipos TypeScript**
- [`src/types/index.ts`](src/types/index.ts) - Adicionados campos na interface `Order`

### **2.2 Workers de Webhook** 
- [`src/workers/payment-webhook.worker.ts`](src/workers/payment-webhook.worker.ts) - Extrai CPF/telefone dos webhooks
- [`src/webhook-server/handlers/genericWebhookHandler.ts`](src/webhook-server/handlers/genericWebhookHandler.ts) - Extrai dados Shopify

### **2.3 Nota Fiscal**
- [`src/routes/invoiceRoutes.ts`](src/routes/invoiceRoutes.ts) - Usa CPF da tabela `orders` primeiro

### **2.4 Documentação**
- [`DB_SCHEMA.md`](DB_SCHEMA.md) - Atualizado com novos campos

---

## 🎯 **3. Como Funciona**

### **3.1 Extração Automática**
O sistema usa [`GatewayUtils.extractCustomerInfo()`](src/lib/gateways/GatewayUtils.ts:246) para extrair:

```typescript
// Busca em diferentes formatos de payload:
phone: customer.phone || customer.phone_number || customer.mobile_phone || customer.telefone
document: customer.document || customer.cpf || customer.cnpj || customer.tax_id
```

### **3.2 Salvamento Automático**
```typescript
// Salvo automaticamente na tabela orders
customer_phone: customerData?.phone || null,
customer_cpf: customerData?.document || null,
```

### **3.3 Uso na Nota Fiscal**
```typescript
// Prioridade: orders.customer_cpf → customerProfile.cpf → 'N/A'
cpf_cliente: order.customer_cpf || customerProfile?.cpf || 'N/A'
```

---

## 🧪 **4. Como Testar**

### **4.1 Teste Estrutura do Banco**
```bash
node scripts/test-cpf-phone-implementation.js
```

### **4.2 Teste com Webhook Real**
1. Configure um webhook de teste
2. Envie payload com CPF/telefone:
```json
{
  "customer": {
    "name": "João Silva",
    "email": "joao@teste.com",
    "phone": "11999999999",
    "cpf": "123.456.789-00"
  }
}
```
3. Verifique se os dados foram salvos

---

## 🎉 **5. Benefícios da Implementação**

✅ **Zero downtime** - Campos opcionais, não quebra dados existentes  
✅ **Compatível** - Funciona com diferentes formatos de webhook  
✅ **Automático** - Captura sem intervenção manual  
✅ **Nota Fiscal** - CPF automaticamente incluído nas notas  
✅ **Flexível** - Aceita CPF com ou sem formatação  

---

## 🔍 **6. Debug e Logs**

Procure por estes logs nos webhooks:
```
📦 🔍 DEBUG CUSTOMER DATA - Extraído: phone=11999999999, cpf=12345678900
```

---

## 📊 **7. Validação Final**

Para confirmar que está funcionando:

1. **Execute o SQL no Supabase** ✅
2. **Reinicie o sistema** para carregar novas mudanças ✅  
3. **Teste com webhook real** ⏳
4. **Verifique no banco se CPF/telefone foram salvos** ⏳

---

**🚀 IMPLEMENTAÇÃO COMPLETA E PRONTA PARA USO!**