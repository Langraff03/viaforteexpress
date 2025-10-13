-- Script para adicionar campos de origem e controle de email único
-- Protege contra vazamento de leads Luna via Asset Gateway

-- Adicionar campo 'origem' para rastrear fonte do pedido
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'origem'
    ) THEN
        ALTER TABLE public.orders ADD COLUMN origem text DEFAULT 'asset';
        COMMENT ON COLUMN public.orders.origem IS 'Origem do pedido: luna, asset';
        
        -- Criar índice para otimizar consultas por origem
        CREATE INDEX IF NOT EXISTS idx_orders_origem ON public.orders(origem);
        
        RAISE NOTICE 'Campo "origem" adicionado à tabela orders';
    ELSE
        RAISE NOTICE 'Campo "origem" já existe na tabela orders';
    END IF;
END
$$;

-- Adicionar campo 'status_envio_email' para controle de email único
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'status_envio_email'
    ) THEN
        ALTER TABLE public.orders ADD COLUMN status_envio_email text DEFAULT 'pendente' CHECK (status_envio_email IN ('pendente', 'enviado', 'falhou'));
        COMMENT ON COLUMN public.orders.status_envio_email IS 'Status do email de rastreamento: pendente, enviado, falhou';
        
        -- Criar índice para otimizar consultas por status de email
        CREATE INDEX IF NOT EXISTS idx_orders_status_envio_email ON public.orders(status_envio_email);
        
        RAISE NOTICE 'Campo "status_envio_email" adicionado à tabela orders';
    ELSE
        RAISE NOTICE 'Campo "status_envio_email" já existe na tabela orders';
    END IF;
END
$$;

-- Criar índice composto para otimizar verificação de duplicação por payment_id e origem
CREATE INDEX IF NOT EXISTS idx_orders_payment_id_origem ON public.orders(payment_id, origem);

-- Atualizar pedidos existentes com origem 'asset' (se não tiver origem definida)
UPDATE public.orders 
SET origem = 'asset' 
WHERE origem IS NULL;

-- Atualizar status de email para 'enviado' em pedidos antigos (assumindo que já foram processados)
UPDATE public.orders 
SET status_envio_email = 'enviado' 
WHERE status_envio_email IS NULL;

RAISE NOTICE '✅ Campos de proteção anti-vazamento adicionados com sucesso!';
RAISE NOTICE '🔹 Campo "origem": rastreia se o pedido veio da Luna ou Asset Gateway';  
RAISE NOTICE '🔹 Campo "status_envio_email": garante que emails sejam enviados apenas uma vez';
RAISE NOTICE '🔹 Índices otimizados criados para performance de consultas';