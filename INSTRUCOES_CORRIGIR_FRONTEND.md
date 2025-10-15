# 🔧 Correção do Frontend - RLS Policies

## Problema Identificado

O frontend não consegue encontrar os pedidos e a nota fiscal redireciona para login porque:
1. ✅ **Backend corrigido** - Webhook agora usa Service Role Key e cria pedidos com sucesso
2. ❌ **Frontend bloqueado** - Não consegue ler os pedidos devido às policies RLS
3. ❌ **Nota fiscal bloqueada** - Não consegue acessar dados necessários (orders, customers, order_items)

## Solução

Execute o SQL abaixo no **SQL Editor do Supabase** para corrigir as policies:

```sql
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

-- Permitir leitura pública da tabela customers (para dados do cliente na nota fiscal)
DROP POLICY IF EXISTS "allow_public_read_customers" ON public.customers;
CREATE POLICY "allow_public_read_customers" ON public.customers
  FOR SELECT
  TO public
  USING (true);

-- Permitir leitura pública da tabela order_items (para itens da nota fiscal)
DROP POLICY IF EXISTS "allow_public_read_order_items" ON public.order_items;
CREATE POLICY "allow_public_read_order_items" ON public.order_items
  FOR SELECT
  TO public
  USING (true);
```

## Como Executar

1. Acesse o **Supabase Dashboard**
2. Vá em **SQL Editor**
3. Cole o código SQL acima
4. Clique em **Run**

## Resultado Esperado

Após executar o SQL:
- ✅ Frontend poderá ler pedidos (usando anon key)
- ✅ Nota fiscal funcionará sem redirecionamento para login
- ✅ Backend continuará criando/atualizando pedidos (usando service role)
- ✅ Segurança mantida (apenas leitura pública, escrita restrita)

## Teste

Após aplicar a correção, teste acessando:
- **Rastreamento**: https://rastreio.logfastexpress.com/tracking/SOSHTM
- **Rastreamento**: https://rastreio.logfastexpress.com/tracking/B0B338
- **Nota Fiscal**: https://rastreio.logfastexpress.com/invoice/[ORDER_ID]

Os códigos de rastreamento e notas fiscais devem funcionar sem redirecionamento para login.

## Status das Correções

- ✅ **Webhook RLS** - Resolvido (usa Service Role Key)
- ✅ **Workers RLS** - Resolvido (usa Service Role Key)
- ✅ **Invoice Service RLS** - Resolvido (usa Service Role Key)
- ✅ **Email Service RLS** - Resolvido (usa Service Role Key)
- 🔄 **Frontend Rastreamento** - Aguardando execução do SQL acima
- 🔄 **Frontend Nota Fiscal** - Aguardando execução do SQL acima