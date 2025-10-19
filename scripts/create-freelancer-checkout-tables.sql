-- ============================================================================
-- SCRIPT: Criar estrutura de banco para integração de checkout Adorei
-- DESCRIÇÃO: Tabelas para configurações de checkout e solicitações de domínio
-- ============================================================================

-- 1. Modificar tabela email_domains existente para adicionar owner_id
ALTER TABLE email_domains 
ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id);

-- Índice para performance nas consultas por usuário
CREATE INDEX IF NOT EXISTS idx_email_domains_owner ON email_domains(owner_id, is_active);

-- 2. Criar tabela de configurações de checkout para freelancers
CREATE TABLE IF NOT EXISTS freelancer_checkout_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    checkout_type VARCHAR(20) DEFAULT 'adorei' NOT NULL,
    
    -- Configurações do checkout Adorei
    checkout_config JSONB NOT NULL DEFAULT '{}',
    webhook_secret VARCHAR(255),
    
    -- Email personalizado
    email_domain_id UUID REFERENCES email_domains(id),
    email_template_type VARCHAR(50) DEFAULT 'tracking', -- 'tracking' ou 'custom'
    custom_email_template TEXT,
    
    -- Configurações de remetente
    from_name VARCHAR(100),
    from_email VARCHAR(100),
    reply_to_email VARCHAR(100),
    
    -- Status e timestamps
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Garantir um config por usuário por tipo de checkout
    UNIQUE(user_id, checkout_type)
);

-- 3. Criar tabela de solicitações de domínio
CREATE TABLE IF NOT EXISTS domain_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    domain_name VARCHAR(255) NOT NULL,
    business_name VARCHAR(255),
    business_description TEXT,
    reason TEXT,
    
    -- Status da solicitação
    status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected
    admin_notes TEXT,
    approved_by UUID REFERENCES auth.users(id),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Garantir que cada usuário só pode solicitar um domínio específico uma vez
    UNIQUE(user_id, domain_name)
);

-- 4. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_freelancer_checkout_configs_user ON freelancer_checkout_configs(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_domain_requests_user ON domain_requests(user_id, status);
CREATE INDEX IF NOT EXISTS idx_domain_requests_status ON domain_requests(status, created_at);

-- 5. Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 6. Criar triggers para atualizar updated_at
CREATE TRIGGER update_freelancer_checkout_configs_updated_at 
    BEFORE UPDATE ON freelancer_checkout_configs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_domain_requests_updated_at 
    BEFORE UPDATE ON domain_requests 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 7. Habilitar RLS (Row Level Security) para as novas tabelas
ALTER TABLE freelancer_checkout_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE domain_requests ENABLE ROW LEVEL SECURITY;

-- 8. Criar políticas RLS para freelancer_checkout_configs
CREATE POLICY "Freelancers podem ver apenas suas configurações" ON freelancer_checkout_configs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Freelancers podem inserir suas configurações" ON freelancer_checkout_configs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Freelancers podem atualizar suas configurações" ON freelancer_checkout_configs
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Freelancers podem deletar suas configurações" ON freelancer_checkout_configs
    FOR DELETE USING (auth.uid() = user_id);

-- 9. Criar políticas RLS para domain_requests
CREATE POLICY "Usuários podem ver apenas suas solicitações" ON domain_requests
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir suas solicitações" ON domain_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas solicitações" ON domain_requests
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 10. Política especial para admins gerenciarem solicitações de domínio
CREATE POLICY "Admins podem gerenciar todas as solicitações" ON domain_requests
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- 11. Comentários nas tabelas
COMMENT ON TABLE freelancer_checkout_configs IS 'Configurações de checkout personalizadas para freelancers';
COMMENT ON TABLE domain_requests IS 'Solicitações de domínios personalizados pelos freelancers';

COMMENT ON COLUMN freelancer_checkout_configs.checkout_config IS 'Configurações específicas do checkout em JSON';
COMMENT ON COLUMN freelancer_checkout_configs.email_template_type IS 'Tipo de template: tracking (padrão) ou custom (personalizado)';
COMMENT ON COLUMN freelancer_checkout_configs.custom_email_template IS 'Template HTML personalizado se email_template_type = custom';

COMMENT ON COLUMN domain_requests.status IS 'Status da solicitação: pending, approved, rejected';

-- 12. Inserir dados iniciais (opcional)
-- Nenhum dado inicial necessário por enquanto

-- ============================================================================
-- SCRIPT CONCLUÍDO
-- ============================================================================

-- Para executar este script:
-- psql -h seu-host -U seu-usuario -d sua-database -f create-freelancer-checkout-tables.sql

-- Para reverter (CUIDADO!):
-- DROP TABLE IF EXISTS domain_requests CASCADE;
-- DROP TABLE IF EXISTS freelancer_checkout_configs CASCADE;
-- ALTER TABLE email_domains DROP COLUMN IF EXISTS owner_id;