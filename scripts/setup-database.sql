-- Script para configurar o banco de dados do zero
-- Execute este script no Supabase SQL Editor

-- 1. Criar tipos personalizados (ENUMs)
CREATE TYPE IF NOT EXISTS lead_status AS ENUM ('ativo', 'inativo', 'processado');
CREATE TYPE IF NOT EXISTS order_status AS ENUM ('created', 'pending', 'paid', 'shipped', 'delivered', 'cancelled');
CREATE TYPE IF NOT EXISTS app_role AS ENUM ('admin', 'gateway_user', 'client');

-- 2. Criar tabela de clientes
CREATE TABLE IF NOT EXISTS public.clients (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name text NOT NULL,
    settings jsonb,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT clients_pkey PRIMARY KEY (id)
);

-- 3. Criar tabela de gateways
CREATE TABLE IF NOT EXISTS public.gateways (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    client_id uuid NOT NULL,
    type text NOT NULL,
    name text NOT NULL,
    config jsonb,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT gateways_pkey PRIMARY KEY (id),
    CONSTRAINT gateways_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE
);

-- 4. Criar tabela de ofertas
CREATE TABLE IF NOT EXISTS public.offers (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    client_id uuid NOT NULL,
    name text NOT NULL,
    description text,
    discount text,
    link text,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT offers_pkey PRIMARY KEY (id),
    CONSTRAINT offers_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE
);

-- 5. Criar tabela de leads
CREATE TABLE IF NOT EXISTS public.leads (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    client_id uuid NOT NULL,
    offer_id uuid,
    email text NOT NULL,
    name text,
    tags jsonb,
    status lead_status NOT NULL DEFAULT 'ativo'::lead_status,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT leads_pkey PRIMARY KEY (id),
    CONSTRAINT leads_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE,
    CONSTRAINT leads_offer_id_fkey FOREIGN KEY (offer_id) REFERENCES public.offers(id) ON DELETE SET NULL
);

-- 6. Criar tabela de pedidos
CREATE TABLE IF NOT EXISTS public.orders (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    client_id uuid NOT NULL,
    gateway_id uuid NOT NULL,
    external_id text,
    amount integer NOT NULL,
    status order_status NOT NULL DEFAULT 'created'::order_status,
    customer_name text NOT NULL,
    customer_email text NOT NULL,
    city text,
    state text,
    tracking_code text,
    payment_id text,
    payment_status text,
    redelivery_count integer NOT NULL DEFAULT 0,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT orders_pkey PRIMARY KEY (id),
    CONSTRAINT orders_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE,
    CONSTRAINT orders_gateway_id_fkey FOREIGN KEY (gateway_id) REFERENCES public.gateways(id) ON DELETE CASCADE
);

-- 7. Criar tabela de perfis
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid NOT NULL,
    role app_role NOT NULL DEFAULT 'gateway_user'::app_role,
    client_id uuid,
    gateway_id uuid,
    full_name text,
    updated_at timestamp with time zone,
    CONSTRAINT profiles_pkey PRIMARY KEY (id),
    CONSTRAINT profiles_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE,
    CONSTRAINT profiles_gateway_id_fkey FOREIGN KEY (gateway_id) REFERENCES public.gateways(id) ON DELETE CASCADE
);

-- 8. Criar tabelas de log
CREATE TABLE IF NOT EXISTS public.log_lead_file_uploads (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    client_id uuid NOT NULL,
    file_name text NOT NULL,
    status text NOT NULL,
    total_leads integer,
    uploaded_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT log_lead_file_uploads_pkey PRIMARY KEY (id),
    CONSTRAINT log_lead_file_uploads_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.log_external_lead_batches (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    file_upload_id uuid NOT NULL,
    client_id uuid NOT NULL,
    offer_name text,
    success_count integer,
    fail_count integer,
    processed_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT log_external_lead_batches_pkey PRIMARY KEY (id),
    CONSTRAINT log_external_lead_batches_file_upload_id_fkey FOREIGN KEY (file_upload_id) REFERENCES public.log_lead_file_uploads(id) ON DELETE CASCADE,
    CONSTRAINT log_external_lead_batches_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.log_offer_emails (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    lead_id uuid,
    client_id uuid,
    email text NOT NULL,
    status text NOT NULL,
    origin text NOT NULL,
    error_message text,
    sent_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT log_offer_emails_pkey PRIMARY KEY (id),
    CONSTRAINT log_offer_emails_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE SET NULL,
    CONSTRAINT log_offer_emails_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE
);

-- 9. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_gateways_client_id ON public.gateways(client_id);
CREATE INDEX IF NOT EXISTS idx_gateways_type ON public.gateways(type);
CREATE INDEX IF NOT EXISTS idx_orders_client_id ON public.orders(client_id);
CREATE INDEX IF NOT EXISTS idx_orders_gateway_id ON public.orders(gateway_id);
CREATE INDEX IF NOT EXISTS idx_orders_payment_id ON public.orders(payment_id);
CREATE INDEX IF NOT EXISTS idx_orders_tracking_code ON public.orders(tracking_code);
CREATE INDEX IF NOT EXISTS idx_leads_client_id ON public.leads(client_id);
CREATE INDEX IF NOT EXISTS idx_leads_email ON public.leads(email);

-- 10. Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 11. Criar trigger para atualizar updated_at na tabela orders
DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 12. Inserir dados iniciais

-- Cliente padrão
INSERT INTO public.clients (id, name, settings) 
VALUES (
    '0ec3137d-ee68-4aba-82de-143b3c61516a',
    'Cliente Padrão',
    '{"webhook_enabled": true, "email_notifications": true}'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- Gateway Asset padrão
INSERT INTO public.gateways (id, client_id, type, name, config, is_active) 
VALUES (
    '7e7e93d9-fc1a-4ae0-b7ab-775494d57cad',
    '0ec3137d-ee68-4aba-82de-143b3c61516a',
    'asset',
    'Gateway Asset Padrão',
    '{
        "api_key": "admin_live_0JqhhCVNXuTwzhfQHiiFbYpUT7YyDNI35rY",
        "api_url": "https://api.asaas.com/v3",
        "webhook_secret": "12b81c3b01e40506bef7c583f757fe9e4a028920ca3cf178530c94fbfb4ceb43"
    }'::jsonb,
    true
) ON CONFLICT (id) DO NOTHING;

-- Perfil admin padrão (você pode ajustar o ID conforme necessário)
INSERT INTO public.profiles (id, role, client_id, full_name) 
VALUES (
    '0ec3137d-ee68-4aba-82de-143b3c61516a',
    'admin'::app_role,
    '0ec3137d-ee68-4aba-82de-143b3c61516a',
    'Administrador'
) ON CONFLICT (id) DO NOTHING;

-- Configurar RLS (Row Level Security) - Opcional
-- ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.gateways ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

COMMIT;

-- Verificar se tudo foi criado corretamente
SELECT 'Tabelas criadas:' as status;
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;

SELECT 'Cliente padrão criado:' as status;
SELECT id, name FROM public.clients WHERE id = '0ec3137d-ee68-4aba-82de-143b3c61516a';

SELECT 'Gateway padrão criado:' as status;
SELECT id, name, type FROM public.gateways WHERE client_id = '0ec3137d-ee68-4aba-82de-143b3c61516a';