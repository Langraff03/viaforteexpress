# 🛍️ **Guia da Integração Shopify**

## **📖 Conceitos Importantes**

### **🔄 Diferença Entre Gateways e Integrações**

| Tipo | Exemplo | Função | Tabela no Banco |
|------|---------|---------|-----------------|
| **Gateway de Pagamento** | Asset, MercadoPago | Processa pagamentos, cria cobranças | `gateways` |
| **Integração E-commerce** | Shopify, WooCommerce | Notifica sobre vendas já processadas | `shopify_configs` |

### **🎯 Por que Shopify é Diferente**

- **Asset**: Nosso sistema **cria** cobranças no Asset
- **Shopify**: Shopify **notifica** sobre vendas já processadas

**Shopify não é um gateway de pagamento!** É uma plataforma que usa seus próprios gateways (Shopify Payments, PayPal, etc.) e nos avisa quando há vendas.

---

## **🏗️ Arquitetura da Solução**

### **Estrutura Simplificada:**

```
📊 Freelancer (Tabela: profiles)
├── 💳 Gateways de Pagamento (Tabela: gateways)
│   ├── Asset
│   ├── MercadoPago  
│   └── Stripe
└── 🛍️ Integrações E-commerce (Tabela: shopify_configs)
    └── Shopify (webhook_secret + shop_domain)
```

### **Fluxo do Webhook:**

```
Shopify → webhook/shopify → ShopifyWebhookProcessor → orders → email
```

**Não passa pelo sistema de gateways!**

---

## **🛠️ Implementação Técnica**

### **📋 Arquivos Criados:**

1. **[`src/lib/shopifyConfig.ts`](src/lib/shopifyConfig.ts)**
   - Funções para gerenciar configurações Shopify
   - `getShopifyConfig()`, `saveShopifyConfig()`

2. **[`src/lib/shopifyWebhookProcessor.ts`](src/lib/shopifyWebhookProcessor.ts)**
   - Processamento específico de webhooks Shopify
   - Validação HMAC, normalização de dados

3. **[`src/scripts/create-shopify-configs-table.sql`](src/scripts/create-shopify-configs-table.sql)**
   - Cria tabela `shopify_configs`
   - Estrutura simples: `user_id + webhook_secret + shop_domain`

### **🔧 Modificações:**

1. **[`src/webhook-server/handlers/genericWebhookHandler.ts`](src/webhook-server/handlers/genericWebhookHandler.ts)**
   - Tratamento especial para `gatewayType === 'shopify'`
   - Não usa `gatewaySelector` para Shopify

2. **[`src/pages/FreelancerDashboard.tsx`](src/pages/FreelancerDashboard.tsx)**
   - Interface para configurar webhook secret
   - Salva na tabela `shopify_configs`

---

## **🚀 Como Usar**

### **1. Setup Inicial:**
```sql
-- Execute no Supabase Dashboard > SQL Editor
-- Arquivo: src/scripts/create-shopify-configs-table.sql
```

### **2. Para Freelancers:**
1. **FreelancerDashboard** → Seção "Integração Shopify"
2. Copiar URL: `fastlogexpress.ngrok.app/webhook/shopify?client_id=SEU_ID`
3. Configurar na Shopify: Evento "orders/paid"
4. Colar webhook secret no dashboard
5. Salvar ✅

### **3. Funcionamento Automático:**
- Cliente compra na Shopify
- Shopify processa pagamento
- Shopify envia webhook `orders/paid`
- Sistema cria pedido + código de rastreamento
- Email enviado automaticamente

---

## **🧪 Como Testar**

### **Pré-requisitos:**
```bash
npm run devall  # Todos os workers
```

### **Setup de Teste:**
```sql
-- Execute no Supabase Dashboard
-- Arquivo: src/scripts/create-shopify-configs-table.sql
```

### **Teste no Postman:**
```
POST https://fastlogexpress.ngrok.app/webhook/shopify?client_id=a1b2c3d4-e5f6-7890-1234-567890abcdef
Content-Type: application/json
X-Shopify-Hmac-Sha256: qualquer_valor_teste

Body: {
  "id": 450789469,
  "financial_status": "paid",
  "email": "cliente@teste.com",
  "total_price": "149.99",
  "shipping_address": {
    "address1": "Rua das Flores, 123",
    "city": "São Paulo",
    "province": "SP"
  },
  "customer": {
    "first_name": "João",
    "last_name": "Silva"
  },
  "line_items": [
    {
      "title": "Produto Teste",
      "quantity": 1,
      "price": "149.99"
    }
  ]
}
```

**Resultado Esperado:**
- ✅ Status 200 OK
- ✅ Pedido criado na tabela `orders`
- ✅ Email enviado
- ✅ Código de rastreamento gerado

---

## **🎯 Vantagens desta Abordagem**

### **✅ Simplicidade:**
- Não contamina tabela `gateways` com "fake gateways"
- Configuração específica para cada tipo de integração
- Código mais limpo e focado

### **✅ Escalabilidade:**
- Fácil adicionar WooCommerce, Magento, etc.
- Cada plataforma tem sua própria tabela de config
- Não interfere com gateways de pagamento reais

### **✅ Manutenibilidade:**
- Separação clara de responsabilidades
- Código específico para cada tipo de integração
- Facilita debugging e melhorias

---

## **🔮 Próximos Passos**

Para adicionar outras plataformas de e-commerce:

1. **WooCommerce**: Tabela `woocommerce_configs`
2. **Magento**: Tabela `magento_configs`
3. **Nuvemshop**: Tabela `nuvemshop_configs`

Cada uma com seu próprio processador de webhook, sem misturar com gateways de pagamento.

---

**🎉 A integração Shopify está funcionando perfeitamente!** 🛍️