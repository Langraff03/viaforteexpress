# 🔍 Diagnóstico Completo - Problema Nota Fiscal

## 📊 **Situação Atual**
- ✅ Tabela `order_items` existe e tem dados
- ✅ Registros mostram valores corretos (2740, 24840, 15461, etc.)
- ❌ Nota fiscal mostra apenas primeiro item com valor, outros com R$ 0,00

## 🕵️ **Possíveis Causas do Problema**

### **1. Problema de Conversão de Valores**
```typescript
// Em safeParseAmount() - linha 24-27 do invoiceRoutes.ts
if (value > 1000 && value % 1 === 0) {
  console.log(`🔧 Valor ${value} parece estar em centavos, convertendo para reais: ${value / 100}`);
  return value / 100;
}
```
**Suspeita**: Valores como 2740, 24840 estão sendo convertidos de centavos para reais automaticamente.

### **2. Problema na Query de Busca**
```typescript
// Em invoiceRoutes.ts - linha 143-146
const { data, error } = await supabaseAdmin
  .from('order_items')
  .select('product_name, quantity, unit_price')
  .eq('order_id', orderId);
```
**Suspeita**: Query pode estar falhando silenciosamente ou retornando dados incorretos.

### **3. Problema de RLS (Row Level Security)**
```sql
-- Políticas podem estar bloqueando acesso
CREATE POLICY "allow_public_read_order_items" ON order_items
  FOR SELECT TO public USING (true);
```
**Suspeita**: API pode não ter permissão para ler todos os itens.

### **4. Problema no Processamento dos Itens**
```typescript
// Em invoiceRoutes.ts - linha 168-176
const invoiceItems = (items && items.length > 0)
  ? items.map((item) => {
      const convertedPrice = safeParseAmount(item.unit_price);
      return {
        nome_item: item.product_name,
        quantidade: item.quantity,
        preco_item: convertedPrice
      };
    })
```
**Suspeita**: Conversão está zerando valores incorretamente.

## 🎯 **Plano de Investigação**

### **Etapa 1: Verificar Logs da API**
- Ativar logs detalhados na API `/api/invoice/:orderId`
- Verificar se a query está retornando dados
- Verificar valores antes e depois da conversão

### **Etapa 2: Testar Query Diretamente**
```sql
-- Testar no Supabase SQL Editor
SELECT 
  oi.order_id,
  oi.product_name,
  oi.quantity,
  oi.unit_price,
  o.customer_name,
  o.amount as order_total
FROM order_items oi
JOIN orders o ON oi.order_id = o.id
WHERE o.customer_name = 'GABRIEL FERREIRA RIBEIRO GOMES'
ORDER BY oi.created_at;
```

### **Etapa 3: Verificar Políticas RLS**
```sql
-- Verificar se as políticas estão corretas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'order_items';
```

### **Etapa 4: Testar Conversão de Valores**
```javascript
// Testar função safeParseAmount com valores reais
console.log('2740 ->', safeParseAmount(2740));  // Deve ser 27.40?
console.log('24840 ->', safeParseAmount(24840)); // Deve ser 248.40?
console.log('15461 ->', safeParseAmount(15461)); // Deve ser 154.61?
```

## 🔧 **Soluções Propostas**

### **Solução 1: Corrigir Conversão de Valores**
```typescript
function safeParseAmount(value: any): number {
  if (value === null || value === undefined) return 0;
  
  if (typeof value === 'number' && !isNaN(value)) {
    // REMOVER conversão automática de centavos
    // Os valores na tabela já estão em centavos, não precisam ser convertidos
    return value / 100; // Sempre dividir por 100 se estão em centavos
  }
  
  // ... resto da função
}
```

### **Solução 2: Adicionar Logs Detalhados**
```typescript
// Em invoiceRoutes.ts após buscar itens
console.log(`[DEBUG] Itens encontrados:`, items);
items?.forEach((item, index) => {
  console.log(`[DEBUG] Item ${index}:`, {
    name: item.product_name,
    quantity: item.quantity,
    unit_price_raw: item.unit_price,
    unit_price_converted: safeParseAmount(item.unit_price)
  });
});
```

### **Solução 3: Verificar RLS**
```sql
-- Garantir que a policy permite leitura
DROP POLICY IF EXISTS "allow_public_read_order_items" ON order_items;
CREATE POLICY "allow_public_read_order_items" ON order_items
  FOR SELECT TO public USING (true);
```

## 🚨 **Hipótese Principal**

**O problema mais provável é a conversão de valores:**

1. **Valores na tabela**: 2740, 24840, 15461 (em centavos)
2. **Função safeParseAmount**: Converte automaticamente para reais
3. **Resultado**: 27.40, 248.40, 154.61
4. **Problema**: Apenas o primeiro item está sendo processado corretamente

## 📋 **Próximos Passos**

1. **Testar query diretamente** no Supabase
2. **Verificar logs** da API de nota fiscal
3. **Corrigir conversão** de valores se necessário
4. **Testar** com pedido real

---

**Status**: 🔍 Diagnóstico criado - Pronto para investigação