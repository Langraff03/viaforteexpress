-- Script SQL para corrigir a validação de endereço em pedidos existentes
-- Execute este script diretamente no SQL Editor do Supabase

-- 1. Primeiro, vamos ver quantos pedidos têm endereços mas não estão marcados como tal
SELECT
    COUNT(*) as total_pedidos,
    SUM(CASE WHEN has_shipping_address IS NULL THEN 1 ELSE 0 END) as nao_validados,
    SUM(CASE WHEN has_shipping_address = false THEN 1 ELSE 0 END) as marcados_sem_endereco,
    SUM(CASE WHEN has_shipping_address = true THEN 1 ELSE 0 END) as marcados_com_endereco
FROM orders;

-- 2. Ver pedidos que têm cidade/estado mas não estão marcados como tendo endereço
SELECT
    id,
    customer_name,
    city,
    state,
    has_shipping_address,
    created_at
FROM orders
WHERE (city IS NOT NULL OR state IS NOT NULL)
  AND (has_shipping_address IS NULL OR has_shipping_address = false)
ORDER BY created_at DESC
LIMIT 10;

-- 3. Corrigir pedidos que têm informações de endereço mas não estão marcados corretamente
UPDATE orders
SET
    has_shipping_address = true,
    updated_at = NOW()
WHERE (city IS NOT NULL OR state IS NOT NULL)
  AND (has_shipping_address IS NULL OR has_shipping_address = false);

-- 4. Verificar quantos pedidos foram corrigidos
SELECT
    COUNT(*) as pedidos_corrigidos
FROM orders
WHERE has_shipping_address = true
  AND updated_at >= NOW() - INTERVAL '1 minute';

-- 5. Ver distribuição final após correção
SELECT
    COUNT(*) as total_pedidos,
    SUM(CASE WHEN has_shipping_address IS NULL THEN 1 ELSE 0 END) as nao_validados,
    SUM(CASE WHEN has_shipping_address = false THEN 1 ELSE 0 END) as marcados_sem_endereco,
    SUM(CASE WHEN has_shipping_address = true THEN 1 ELSE 0 END) as marcados_com_endereco
FROM orders;

-- 6. Mostrar alguns exemplos de pedidos corrigidos
SELECT
    id,
    customer_name,
    city,
    state,
    has_shipping_address,
    updated_at
FROM orders
WHERE has_shipping_address = true
  AND updated_at >= NOW() - INTERVAL '5 minutes'
ORDER BY updated_at DESC
LIMIT 5;