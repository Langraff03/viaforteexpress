# 🛠️ Instruções de Implementação - Correção Nota Fiscal

## 📋 Checklist de Implementação

### ✅ Etapa 1: Documentação Criada
- [x] `CORRECAO_NOTA_FISCAL_COMPLETA.md` - Documentação completa criada

### 🔄 Etapa 2: Correções de Código (Pendente)
- [ ] **Correção 1:** Configurar proxy no `vite.config.ts`
- [ ] **Correção 2:** Melhorar tratamento de erro no `InvoiceView.tsx`
- [ ] **Correção 3:** Criar script SQL para RLS

### 🔄 Etapa 3: Execução Manual (Você deve fazer)
- [ ] **Executar SQL no Supabase Dashboard**
- [ ] **Reiniciar serviços**
- [ ] **Testar funcionamento**

---

## 🔧 Correção 1: Configurar Proxy no Vite

**Arquivo:** `vite.config.ts`

**Localizar a seção `server:`** (linha ~23):
```typescript
server: {
  // Desabilita os avisos de source map
  hmr: {
    overlay: false
  }
},
```

**Substituir por:**
```typescript
server: {
  // Desabilita os avisos de source map
  hmr: {
    overlay: false
  },
  // Configuração de proxy para APIs
  proxy: {
    '/api': {
      target: 'http://localhost:3001',
      changeOrigin: true,
      secure: false,
      rewrite: (path) => path
    }
  }
},
```

**Resultado:** Frontend conseguirá acessar APIs do backend na porta 3001.

---

## 🔧 Correção 2: Melhorar Tratamento de Erro

**Arquivo:** `src/pages/InvoiceView.tsx`

**Localizar a função `fetchInvoiceData`** (linha ~42):
```typescript
// Buscar dados da nota fiscal via API pública
const response = await fetch(`/api/invoice/${orderId}`);

if (!response.ok) {
  const errorData = await response.json();
  throw new Error(errorData.error || 'Erro ao buscar dados da nota fiscal');
}
```

**Substituir por:**
```typescript
// Buscar dados da nota fiscal via API pública
const response = await fetch(`/api/invoice/${orderId}`);

if (!response.ok) {
  // Verificar se a resposta é HTML (erro de proxy/roteamento)
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('text/html')) {
    throw new Error('Erro de configuração: API não encontrada. Verifique se o backend está rodando na porta 3001.');
  }
  
  try {
    const errorData = await response.json();
    throw new Error(errorData.error || `Erro HTTP ${response.status}: ${response.statusText}`);
  } catch (parseError) {
    throw new Error(`Erro ao buscar nota fiscal (${response.status}): ${response.statusText}`);
  }
}
```

**Resultado:** Mensagens de erro mais claras e específicas.

---

## 🔧 Correção 3: Script SQL para RLS

**Criar arquivo:** `scripts/fix-invoice-rls-final.sql`

**Conteúdo:**
```sql
-- Script SQL para corrigir RLS da Nota Fiscal
-- Execute no Supabase Dashboard > SQL Editor

-- Verificar tabelas existentes
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('customers', 'order_items', 'orders')
ORDER BY table_name;

-- Remover policies existentes que podem estar bloqueando
DROP POLICY IF EXISTS "allow_read_orders" ON public.orders;
DROP POLICY IF EXISTS "allow_insert_orders" ON public.orders;
DROP POLICY IF EXISTS "allow_update_orders" ON public.orders;
DROP POLICY IF EXISTS "allow_webhook_insert" ON public.orders;

-- Permitir leitura pública dos pedidos (frontend)
CREATE POLICY "allow_public_read_orders" ON public.orders
  FOR SELECT
  TO public
  USING (true);

-- Permitir apenas service_role inserir pedidos (backend)
CREATE POLICY "allow_service_role_insert_orders" ON public.orders
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Permitir apenas service_role atualizar pedidos (backend)
CREATE POLICY "allow_service_role_update_orders" ON public.orders
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Criar policies para tabelas auxiliares (se existirem)
DO $$
BEGIN
  -- Tabela customers
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'customers') THEN
    DROP POLICY IF EXISTS "allow_public_read_customers" ON public.customers;
    CREATE POLICY "allow_public_read_customers" ON public.customers
      FOR SELECT
      TO public
      USING (true);
    RAISE NOTICE 'Policy criada para tabela customers';
  ELSE
    RAISE NOTICE 'Tabela customers não existe - pulando';
  END IF;

  -- Tabela order_items
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'order_items') THEN
    DROP POLICY IF EXISTS "allow_public_read_order_items" ON public.order_items;
    CREATE POLICY "allow_public_read_order_items" ON public.order_items
      FOR SELECT
      TO public
      USING (true);
    RAISE NOTICE 'Policy criada para tabela order_items';
  ELSE
    RAISE NOTICE 'Tabela order_items não existe - pulando';
  END IF;
END $$;

-- Verificar policies criadas
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename IN ('customers', 'order_items', 'orders')
  AND policyname LIKE '%public_read%'
ORDER BY tablename, policyname;

-- Mensagem final
SELECT 'Políticas RLS configuradas com sucesso para nota fiscal!' as status;
```

---

## 📋 Próximos Passos

### Para o Desenvolvedor (Você):

1. **Implementar Correções de Código:**
   - Modificar `vite.config.ts` conforme instruções acima
   - Modificar `src/pages/InvoiceView.tsx` conforme instruções acima
   - Criar arquivo `scripts/fix-invoice-rls-final.sql`

2. **Executar SQL no Supabase:**
   - Acessar Supabase Dashboard
   - Ir em SQL Editor
   - Executar o SQL do arquivo criado

3. **Reiniciar Serviços:**
   ```bash
   # Parar serviços atuais (Ctrl+C)
   npm run devall
   ```

4. **Testar:**
   - Enviar email de teste
   - Clicar no botão "Ver Nota Fiscal"
   - Verificar se carrega sem erro

### Para o Assistente:

Após você implementar as correções de código, posso:
- Mudar para modo Code para fazer ajustes finais
- Criar testes automatizados
- Documentar troubleshooting adicional

---

## 🎯 Resultado Esperado

Após implementar todas as correções:

✅ **Proxy configurado** - `/api/*` redirecionado para `localhost:3001`  
✅ **RLS corrigido** - Acesso público permitido para leitura  
✅ **Erros claros** - Mensagens específicas para debugging  
✅ **Nota fiscal funcionando** - Cliente consegue visualizar sem erro  

---

**Status:** 📝 Instruções criadas - Aguardando implementação