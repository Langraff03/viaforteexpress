# 🧪 **Guia de Teste Shopify com Postman**

Este arquivo contém tudo que você precisa para testar a integração Shopify usando Postman ou cURL.

## **🚀 Pré-requisitos**

1. Execute o comando: `npm run devall` (para iniciar todos os workers)
2. Execute em outro terminal: `npm run dev:ngrok` (para expor porta 3001)

### **3. ⚠️ IMPORTANTE - Criar tabela primeiro:**
**Acesse Supabase Dashboard → SQL Editor e execute:**
```sql
-- Criar tabela shopify_configs (EXECUTE PRIMEIRO!)
CREATE TABLE IF NOT EXISTS shopify_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  webhook_secret TEXT NOT NULL,
  shop_domain TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Inserir configuração de teste
INSERT INTO shopify_configs (user_id, webhook_secret, shop_domain)
VALUES (
  'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  'meu_secret_shopify_teste_123',
  'loja-teste.myshopify.com'
) ON CONFLICT (user_id) DO UPDATE SET
  webhook_secret = EXCLUDED.webhook_secret,
  shop_domain = EXCLUDED.shop_domain;
```

### **4. Verificar se funcionou:**
```sql
SELECT * FROM shopify_configs WHERE user_id = 'a1b2c3d4-e5f6-7890-1234-567890abcdef';
```

---

## **📋 Teste 1: Webhook Válido (com endereço)**

### **Requisição POST**
```
POST https://fastlogexpress.ngrok.app/webhook/shopify?client_id=a1b2c3d4-e5f6-7890-1234-567890abcdef
```

### **Headers (IMPORTANTE - Adicione no Postman):**
```
Content-Type: application/json
X-Shopify-Hmac-Sha256: J7sCBwZs7DXpbOKkfz68VRYNvNa2eTe1qw3Qv7HRMDI=
```

**⚠️ Como adicionar no Postman:**
1. Na aba **Headers**
2. **Key**: `X-Shopify-Hmac-Sha256`
3. **Value**: `J7sCBwZs7DXpbOKkfz68VRYNvNa2eTe1qw3Qv7HRMDI=`

### **Payload (Body JSON)**
```json
{
  "id": 450789469,
  "name": "#1001",
  "email": "cliente.teste@exemplo.com",
  "total_price": "149.99",
  "subtotal_price": "149.99",
  "total_tax": "0.00",
  "currency": "BRL",
  "financial_status": "paid",
  "fulfillment_status": null,
  "created_at": "2024-01-15T10:30:00-03:00",
  "updated_at": "2024-01-15T10:35:00-03:00",
  "order_number": 1001,
  "customer": {
    "id": 12345,
    "email": "cliente.teste@exemplo.com",
    "first_name": "João",
    "last_name": "Silva",
    "phone": "+5511999887766"
  },
  "shipping_address": {
    "address1": "Rua das Flores, 123",
    "address2": "Apt 45",
    "city": "São Paulo",
    "province": "SP",
    "zip": "01234-567",
    "country": "Brazil",
    "phone": "+5511999887766"
  },
  "billing_address": {
    "address1": "Rua das Flores, 123",
    "address2": "Apt 45",
    "city": "São Paulo",
    "province": "SP",
    "zip": "01234-567",
    "country": "Brazil",
    "phone": "+5511999887766"
  },
  "line_items": [
    {
      "id": 101,
      "title": "Camiseta Premium",
      "quantity": 2,
      "price": "49.99",
      "sku": "CAM-PREM-001",
      "variant_title": "Tamanho M / Cor Azul",
      "vendor": "Loja Exemplo",
      "product_id": 201,
      "variant_id": 301,
      "grams": 250
    },
    {
      "id": 102,
      "title": "Calça Jeans",
      "quantity": 1,
      "price": "50.01",
      "sku": "CAL-JEANS-002",
      "variant_title": "Tamanho 40",
      "vendor": "Loja Exemplo",
      "product_id": 202,
      "variant_id": 302,
      "grams": 800
    }
  ]
}
```

### **Resultado Esperado**
```json
{
  "received": true,
  "processed": true,
  "details": {
    "eventType": "orders/paid",
    "paymentId": "450789469",
    "orderId": "450789469",
    "newStatus": "paid"
  }
}
```

---

## **📋 Teste 2: Webhook SEM Endereço (deve ser rejeitado)**

### **Requisição POST**
```
POST https://fastlogexpress.ngrok.app/webhook/shopify?client_id=a1b2c3d4-e5f6-7890-1234-567890abcdef
Content-Type: application/json
X-Shopify-Hmac-Sha256: (qualquer valor, pois será rejeitado antes)
```

### **Payload (Body JSON)**
```json
{
  "id": 450789470,
  "name": "#1002",
  "email": "cliente.digital@exemplo.com",
  "total_price": "29.99",
  "currency": "BRL",
  "financial_status": "paid",
  "customer": {
    "id": 12346,
    "email": "cliente.digital@exemplo.com",
    "first_name": "Maria",
    "last_name": "Santos"
  },
  "shipping_address": null,
  "line_items": [
    {
      "id": 103,
      "title": "Produto Digital",
      "quantity": 1,
      "price": "29.99"
    }
  ]
}
```

### **Resultado Esperado**
```json
{
  "received": true,
  "processed": false,
  "error": "Pedido sem endereço de entrega válido"
}
```

---

## **📋 Teste 3: HMAC Inválido (segurança)**

### **Requisição POST**
```
POST https://fastlogexpress.ngrok.app/webhook/shopify?client_id=a1b2c3d4-e5f6-7890-1234-567890abcdef
Content-Type: application/json
X-Shopify-Hmac-Sha256: ASSINATURA_FALSA_123
```

### **Payload**
(Use o mesmo payload do Teste 1)

### **Resultado Esperado**
O webhook deve ser rejeitado por falha na validação HMAC.

---

## **🔐 Como Gerar HMAC Correto (Opcional)**

Se quiser testar com HMAC real, use este script Node.js:

```javascript
const crypto = require('crypto');

const payload = `SEU_PAYLOAD_JSON_AQUI`;
const secret = 'meu_secret_shopify_teste_123';

const hmac = crypto
  .createHmac('sha256', secret)
  .update(payload, 'utf8')
  .digest('base64');

console.log('X-Shopify-Hmac-Sha256:', hmac);
```

---

## **📊 Monitoramento dos Testes**

### **O que observar nos logs:**

1. **Terminal do webhook-server:**
```
[Webhook] Recebido para gateway: shopify, cliente: test-client-123
[ShopifyGateway] ✅ Pedido pago identificado: #1001
[ShopifyGateway] 📊 Dados normalizados: João Silva (cliente.teste@exemplo.com)
[Webhook] ✅ Email enfileirado para pedido: 450789469
```

2. **Terminal dos workers:**
```
[PaymentWebhook] Processando webhook shopify.payment.confirmed
[Email] Enviando email de rastreamento para: cliente.teste@exemplo.com
[Tracking] Código gerado: AB123C para pedido 450789469
```

### **Verificar no banco de dados:**
```sql
-- Ver pedido criado
SELECT * FROM orders WHERE payment_id = '450789469';

-- Ver itens do pedido  
SELECT * FROM order_items WHERE order_id = '450789469';

-- Ver configuração Shopify salva
SELECT * FROM gateway_configs WHERE gateway_type = 'shopify';
```

---

## **🎯 Sequência de Testes Recomendada**

1. **Primeiro:** Teste payload válido (deve criar pedido + enviar email)
2. **Segundo:** Teste sem endereço (deve rejeitar)  
3. **Terceiro:** Teste com HMAC inválido (deve rejeitar)
4. **Quarto:** Verificar no banco se pedido foi criado corretamente

---

## **🔧 Troubleshooting**

### **Se der erro 500:**
- Verifique se `npm run devall` está rodando
- Verifique se Redis está funcionando
- Verifique se banco Supabase está conectado

### **Se não processar:**
- Verifique logs do terminal webhook-server
- Confirme que `financial_status: "paid"` está no payload
- Confirme que `shipping_address` tem dados completos

### **Se não enviar email:**
- Verifique terminal dos workers
- Confirme que worker `payment-webhook` está ativo
- Verifique configuração de email no `.env`

---

## **✅ Teste de Sucesso Completo**

Um teste bem-sucedido deve:
1. ✅ Retornar `200 OK` com `"processed": true`
2. ✅ Mostrar logs de processamento no terminal
3. ✅ Criar entrada na tabela `orders`
4. ✅ Criar entradas na tabela `order_items`
5. ✅ Enfileirar email na fila `payment-webhook`
6. ✅ Processar email e gerar código de rastreamento

**Pronto para testar! 🚀**