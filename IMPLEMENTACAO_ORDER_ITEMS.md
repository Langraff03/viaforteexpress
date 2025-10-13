# Implementação da Tabela order_items

## 📋 Objetivo
Criar uma tabela flexível para armazenar detalhes de produtos físicos vindos de webhooks, permitindo que a nota fiscal exiba informações reais dos produtos em vez de "Produto Principal".

## 🗄️ Script SQL Completo

### 1. Criação da Tabela

```sql
-- =====================================================
-- CRIAR TABELA ORDER_ITEMS
-- =====================================================

CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  
  -- Informações básicas do produto
  product_name TEXT NOT NULL,
  product_description TEXT,
  product_code TEXT, -- SKU, código de barras, etc.
  product_brand TEXT, -- Marca do produto
  
  -- Informações comerciais
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price INTEGER NOT NULL, -- Em centavos (ex: 8999 = R$ 89,99)
  total_price INTEGER GENERATED ALWAYS AS (quantity * unit_price) STORED,
  
  -- Informações físicas (importantes para logística)
  weight_grams INTEGER, -- Peso em gramas
  dimensions_cm TEXT, -- Formato: "10x20x5" (LarguraxAlturaxProfundidade)
  
  -- Categorização e fiscal
  product_category TEXT, -- eletrônicos, roupas, livros, etc.
  ncm_code TEXT, -- Código NCM para nota fiscal brasileira
  
  -- Dados extras do webhook (flexível para qualquer formato)
  webhook_data JSONB, -- Armazena dados originais do webhook
  
  -- Controle
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2. Índices para Performance

```sql
-- =====================================================
-- ÍNDICES
-- =====================================================

-- Índice principal para buscar itens por pedido
CREATE INDEX idx_order_items_order_id ON order_items(order_id);

-- Índice para busca por código do produto
CREATE INDEX idx_order_items_product_code ON order_items(product_code);

-- Índice para busca por categoria
CREATE INDEX idx_order_items_category ON order_items(product_category);

-- Índice para busca por NCM (importante para fiscal)
CREATE INDEX idx_order_items_ncm ON order_items(ncm_code);

-- Índice composto para relatórios
CREATE INDEX idx_order_items_order_created ON order_items(order_id, created_at);
```

### 3. Trigger para Updated_at

```sql
-- =====================================================
-- TRIGGER PARA UPDATED_AT
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_order_items_updated_at 
    BEFORE UPDATE ON order_items 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
```

### 4. Políticas RLS (Row Level Security)

```sql
-- =====================================================
-- POLÍTICAS RLS
-- =====================================================

-- Habilitar RLS na tabela
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Política para leitura pública (necessária para notas fiscais públicas)
CREATE POLICY "order_items_public_read" ON order_items
  FOR SELECT USING (true);

-- Política para inserção por usuários autenticados
CREATE POLICY "order_items_insert" ON order_items
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Política para atualização por usuários autenticados
CREATE POLICY "order_items_update" ON order_items
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Política para exclusão por usuários autenticados
CREATE POLICY "order_items_delete" ON order_items
  FOR DELETE USING (auth.role() = 'authenticated');
```

### 5. Migração de Dados Existentes

```sql
-- =====================================================
-- MIGRAÇÃO DE DADOS EXISTENTES
-- =====================================================

-- Criar produtos padrão para pedidos existentes que não têm itens
INSERT INTO order_items (
  order_id, 
  product_name, 
  product_description, 
  quantity, 
  unit_price, 
  product_category,
  webhook_data
)
SELECT 
  o.id as order_id,
  'Serviço de Transporte' as product_name,
  CONCAT('Serviço de logística e transporte - Pedido #', COALESCE(o.payment_id, o.id::text)) as product_description,
  1 as quantity,
  o.amount as unit_price,
  'logistica' as product_category,
  jsonb_build_object(
    'migrated', true,
    'original_amount', o.amount,
    'migration_date', NOW()
  ) as webhook_data
FROM orders o 
WHERE o.id NOT IN (
  SELECT DISTINCT order_id 
  FROM order_items 
  WHERE order_id IS NOT NULL
);
```

## 🔍 Verificações Pós-Instalação

### Verificar se a tabela foi criada corretamente:

```sql
-- Verificar estrutura da tabela
\d order_items

-- Verificar políticas RLS
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'order_items';

-- Verificar índices
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'order_items';

-- Contar registros migrados
SELECT COUNT(*) as total_items, COUNT(DISTINCT order_id) as orders_with_items
FROM order_items;
```

## 📊 Exemplos de Uso

### Inserir produto via webhook:

```sql
INSERT INTO order_items (
  order_id,
  product_name,
  product_description,
  product_code,
  product_brand,
  quantity,
  unit_price,
  weight_grams,
  dimensions_cm,
  product_category,
  ncm_code,
  webhook_data
) VALUES (
  'uuid-do-pedido',
  'iPhone 15 Pro 256GB',
  'Smartphone Apple iPhone 15 Pro com 256GB de armazenamento',
  'IPHONE15PRO256',
  'Apple',
  1,
  899900, -- R$ 8.999,00 em centavos
  187, -- gramas
  '14.7x7.1x0.8', -- cm
  'eletrônicos',
  '8517.12.00',
  '{"webhook_source": "shopify", "variant_id": 12345}'::jsonb
);
```

### Buscar itens de um pedido (usado pela API de invoice):

```sql
SELECT 
  product_name,
  product_description,
  quantity,
  unit_price,
  total_price,
  product_brand,
  product_category
FROM order_items 
WHERE order_id = 'uuid-do-pedido'
ORDER BY created_at;
```

## 🚀 Próximos Passos

1. **Executar este script** no banco de dados Supabase
2. **Atualizar webhook handler** para processar produtos automaticamente
3. **Testar API de invoice** para verificar se busca os dados corretos
4. **Ajustar template da nota fiscal** se necessário

## 📝 Notas Importantes

- **Valores em centavos**: Todos os preços são armazenados em centavos para evitar problemas de precisão decimal
- **JSONB flexível**: O campo `webhook_data` permite armazenar qualquer estrutura de dados do webhook original
- **RLS público**: A leitura é pública para permitir acesso às notas fiscais sem autenticação
- **Cascata**: Quando um pedido é excluído, seus itens são automaticamente removidos
- **Campos opcionais**: Muitos campos são opcionais para aceitar diferentes formatos de webhook

## 🔧 Comandos para Execução

Para executar este script:

1. Acesse o painel do Supabase
2. Vá em "SQL Editor"
3. Cole e execute cada seção separadamente
4. Ou execute tudo de uma vez (recomendado para produção)

```bash
# Ou via CLI do Supabase (se configurado)
supabase db reset
# Depois aplicar as migrações