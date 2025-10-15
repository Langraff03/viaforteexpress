-- ============================================================================
-- SCRIPT COMPLETO DE CONFIGURAÇÃO DO SISTEMA DE RASTREAMENTO MULTI-GATEWAYS
-- ============================================================================
-- Este script configura o banco de dados completo do zero
-- Execute este script no Supabase SQL Editor

-- 1. LIMPAR BANCO DE DADOS (se necessário)
-- ============================================================================

-- Desabilitar verificações de chave estrangeira temporariamente
SET session_replication_role = replica;

-- Excluir todas as tabelas existentes
DROP TABLE IF EXISTS public.log_offer_emails CASCADE;
DROP TABLE IF EXISTS public.log_external_lead_batches CASCADE;
DROP TABLE IF EXISTS public.log_lead_file_uploads CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.leads CASCADE;
DROP TABLE IF EXISTS public.offers CASCADE;
DROP TABLE IF EXISTS public.gateways CASCADE;
DROP TABLE IF EXISTS public.clients CASCADE;

-- Excluir tipos personalizados
DROP TYPE IF EXISTS public.lead_status CASCADE;
DROP TYPE IF EXISTS public.order_status CASCADE;
DROP TYPE IF EXISTS public.app_role CASCADE;

-- Excluir funções
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

-- Reabilitar verificações de chave estrangeira
SET session_replication_role = DEFAULT;

-- 2. CRIAR TIPOS PERSONALIZADOS (ENUMs)
-- ============================================================================

CREATE TYPE public.lead_status AS ENUM ('ativo', 'inativo', 'processado');
CREATE TYPE public.order_status AS ENUM ('created', 'pending', 'paid', 'shipped', 'delivered', 'cancelled');
CREATE TYPE public.app_role AS ENUM ('admin', 'gateway_user', 'client');

-- 3. CRIAR TABELAS PRINCIPAIS
-- ============================================================================

-- Tabela de clientes
CREATE TABLE public.clients (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name text NOT NULL,
    settings jsonb DEFAULT '{"webhook_enabled": true, "email_notifications": true}'::jsonb,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT clients_pkey PRIMARY KEY (id)
);

-- Tabela de gateways de pagamento
CREATE TABLE public.gateways (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    client_id uuid NOT NULL,
    type text NOT NULL,
    name text NOT NULL,
    config jsonb NOT NULL DEFAULT '{}'::jsonb,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT gateways_pkey PRIMARY KEY (id),
    CONSTRAINT gateways_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE
);

-- Tabela de ofertas
CREATE TABLE public.offers (
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

-- Tabela de leads
CREATE TABLE public.leads (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    client_id uuid NOT NULL,
    offer_id uuid,
    email text NOT NULL,
    name text,
    tags jsonb DEFAULT '{}'::jsonb,
    status public.lead_status NOT NULL DEFAULT 'ativo'::public.lead_status,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT leads_pkey PRIMARY KEY (id),
    CONSTRAINT leads_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE,
    CONSTRAINT leads_offer_id_fkey FOREIGN KEY (offer_id) REFERENCES public.offers(id) ON DELETE SET NULL
);

-- Tabela de pedidos
CREATE TABLE public.orders (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    client_id uuid NOT NULL,
    gateway_id uuid NOT NULL,
    external_id text,
    amount integer NOT NULL,
    status public.order_status NOT NULL DEFAULT 'created'::public.order_status,
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

-- Tabela de perfis de usuários
CREATE TABLE public.profiles (
    id uuid NOT NULL,
    role public.app_role NOT NULL DEFAULT 'gateway_user'::public.app_role,
    client_id uuid,
    gateway_id uuid,
    full_name text,
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT profiles_pkey PRIMARY KEY (id),
    CONSTRAINT profiles_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE,
    CONSTRAINT profiles_gateway_id_fkey FOREIGN KEY (gateway_id) REFERENCES public.gateways(id) ON DELETE CASCADE,
    CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 4. CRIAR TABELAS DE LOG
-- ============================================================================

-- Log de uploads de arquivos de leads
CREATE TABLE public.log_lead_file_uploads (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    client_id uuid NOT NULL,
    file_name text NOT NULL,
    status text NOT NULL,
    total_leads integer,
    uploaded_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT log_lead_file_uploads_pkey PRIMARY KEY (id),
    CONSTRAINT log_lead_file_uploads_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE
);

-- Log de processamento de lotes de leads externos
CREATE TABLE public.log_external_lead_batches (
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

-- Log de emails de ofertas enviados
CREATE TABLE public.log_offer_emails (
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

-- 5. CRIAR ÍNDICES PARA PERFORMANCE
-- ============================================================================

CREATE INDEX idx_gateways_client_id ON public.gateways(client_id);
CREATE INDEX idx_gateways_type ON public.gateways(type);
CREATE INDEX idx_gateways_active ON public.gateways(is_active);

CREATE INDEX idx_orders_client_id ON public.orders(client_id);
CREATE INDEX idx_orders_gateway_id ON public.orders(gateway_id);
CREATE INDEX idx_orders_payment_id ON public.orders(payment_id);
CREATE INDEX idx_orders_tracking_code ON public.orders(tracking_code);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_created_at ON public.orders(created_at);

CREATE INDEX idx_leads_client_id ON public.leads(client_id);
CREATE INDEX idx_leads_email ON public.leads(email);
CREATE INDEX idx_leads_status ON public.leads(status);

CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_client_id ON public.profiles(client_id);
CREATE INDEX idx_profiles_gateway_id ON public.profiles(gateway_id);

-- 6. CRIAR FUNÇÕES E TRIGGERS
-- ============================================================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updated_at na tabela orders
CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para atualizar updated_at na tabela profiles
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- 7. INSERIR DADOS INICIAIS
-- ============================================================================

-- Cliente padrão
INSERT INTO public.clients (id, name, settings) 
VALUES (
    '0ec3137d-ee68-4aba-82de-143b3c61516a',
    'Rapid Transporte',
    '{
        "webhook_enabled": true, 
        "email_notifications": true,
        "company_name": "Rapid Transporte",
        "support_email": "suporte@rapidtransporte.com",
        "website": "https://rapidtransporte.com"
    }'::jsonb
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    settings = EXCLUDED.settings;

-- Gateway Asset padrão
INSERT INTO public.gateways (id, client_id, type, name, config, is_active) 
VALUES (
    '7e7e93d9-fc1a-4ae0-b7ab-775494d57cad',
    '0ec3137d-ee68-4aba-82de-143b3c61516a',
    'asset',
    'Gateway Asset Principal',
    '{
        "api_key": "admin_live_0JqhhCVNXuTwzhfQHiiFbYpUT7YyDNI35rY",
        "api_url": "https://api.asaas.com/v3",
        "webhook_secret": "12b81c3b01e40506bef7c583f757fe9e4a028920ca3cf178530c94fbfb4ceb43",
        "webhook_url": "https://rastreio.logfastexpress.com/webhook/asset",
        "environment": "production"
    }'::jsonb,
    true
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    config = EXCLUDED.config,
    is_active = EXCLUDED.is_active;

-- Oferta padrão de melatonina
INSERT INTO public.offers (id, client_id, name, description, discount, link, is_active)
VALUES (
    'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    '0ec3137d-ee68-4aba-82de-143b3c61516a',
    'Oferta Especial Melatonina',
    'Melatonina premium para melhor qualidade do sono',
    '30% OFF',
    'https://rapidtransporte.com/melatonina-oferta',
    true
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    discount = EXCLUDED.discount,
    link = EXCLUDED.link,
    is_active = EXCLUDED.is_active;

-- 8. CONFIGURAR POLÍTICAS RLS (Row Level Security)
-- ============================================================================

-- Habilitar RLS nas tabelas principais
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gateways ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Política para admins (acesso total)
CREATE POLICY "Admins têm acesso total" ON public.clients
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins têm acesso total" ON public.gateways
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins têm acesso total" ON public.orders
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins têm acesso total" ON public.leads
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins têm acesso total" ON public.offers
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Política para usuários de gateway (acesso limitado ao seu cliente/gateway)
CREATE POLICY "Gateway users veem apenas seus dados" ON public.orders
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'gateway_user'
            AND profiles.client_id = orders.client_id
        )
    );

CREATE POLICY "Gateway users veem apenas seus dados" ON public.gateways
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'gateway_user'
            AND profiles.gateway_id = gateways.id
        )
    );

-- Política para perfis (usuários podem ver e atualizar apenas seu próprio perfil)
CREATE POLICY "Usuários veem apenas seu próprio perfil" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Usuários podem atualizar apenas seu próprio perfil" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- 9. VERIFICAÇÕES FINAIS
-- ============================================================================

-- Verificar se todas as tabelas foram criadas
SELECT 'Tabelas criadas:' as status;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Verificar dados iniciais
SELECT 'Cliente padrão:' as status;
SELECT id, name FROM public.clients 
WHERE id = '0ec3137d-ee68-4aba-82de-143b3c61516a';

SELECT 'Gateway padrão:' as status;
SELECT id, name, type, is_active FROM public.gateways 
WHERE client_id = '0ec3137d-ee68-4aba-82de-143b3c61516a';

SELECT 'Oferta padrão:' as status;
SELECT id, name, discount FROM public.offers 
WHERE client_id = '0ec3137d-ee68-4aba-82de-143b3c61516a';

-- Verificar tipos criados
SELECT 'Tipos personalizados:' as status;
SELECT typname FROM pg_type 
WHERE typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
AND typtype = 'e'
ORDER BY typname;

COMMIT;

-- ============================================================================
-- CONFIGURAÇÃO CONCLUÍDA COM SUCESSO!
-- ============================================================================