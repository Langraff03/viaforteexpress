-- Migration: Criar tabela email_domains para sistema multi-domínio
-- Data: 2025-01-11
-- Descrição: Sistema de múltiplos domínios de email para campanhas de leads

-- Criar tabela principal
CREATE TABLE IF NOT EXISTS email_domains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    domain_name VARCHAR(255) UNIQUE NOT NULL,
    from_name VARCHAR(255) NOT NULL,
    from_email VARCHAR(255) NOT NULL,
    reply_to_email VARCHAR(255) NOT NULL,
    resend_api_key TEXT NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    -- Constraints para validação
    -- Constraints para validação
    CONSTRAINT check_email_format CHECK (from_email ~* '^[^@]+@[^@]+\.[^@]+$'),
    CONSTRAINT check_reply_to_format CHECK (reply_to_email ~* '^[^@]+@[^@]+\.[^@]+$'),
    CONSTRAINT check_domain_name_format CHECK (domain_name ~* '^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'),
    CONSTRAINT check_from_name_length CHECK (length(from_name) >= 2)
    -- Nota: Constraint de domínio único padrão é gerenciado pelo trigger ensure_single_default_domain()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_email_domains_active ON email_domains(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_email_domains_default ON email_domains(is_default) WHERE is_default = TRUE;
CREATE INDEX IF NOT EXISTS idx_email_domains_domain_name ON email_domains(domain_name);
CREATE INDEX IF NOT EXISTS idx_email_domains_created_by ON email_domains(created_by);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_email_domains_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_email_domains_updated_at
    BEFORE UPDATE ON email_domains
    FOR EACH ROW
    EXECUTE FUNCTION update_email_domains_updated_at();

-- Trigger para garantir apenas um domínio padrão
CREATE OR REPLACE FUNCTION ensure_single_default_domain()
RETURNS TRIGGER AS $$
BEGIN
    -- Se está marcando como padrão, desmarcar todos os outros
    IF NEW.is_default = TRUE THEN
        UPDATE email_domains 
        SET is_default = FALSE 
        WHERE id != NEW.id AND is_default = TRUE;
    END IF;
    
    -- Garantir que sempre existe um domínio padrão
    IF NEW.is_default = FALSE THEN
        -- Se não há nenhum padrão, marcar este como padrão
        IF NOT EXISTS (SELECT 1 FROM email_domains WHERE is_default = TRUE AND id != NEW.id) THEN
            NEW.is_default = TRUE;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ensure_single_default_domain
    BEFORE INSERT OR UPDATE ON email_domains
    FOR EACH ROW
    EXECUTE FUNCTION ensure_single_default_domain();

-- Tabela de auditoria para mudanças nos domínios
CREATE TABLE IF NOT EXISTS email_domains_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    domain_id UUID REFERENCES email_domains(id) ON DELETE CASCADE,
    action VARCHAR(20) NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
    old_values JSONB,
    new_values JSONB,
    changed_by UUID REFERENCES auth.users(id),
    changed_at TIMESTAMPTZ DEFAULT NOW(),
    user_agent TEXT,
    ip_address INET
);

-- Índices para auditoria
CREATE INDEX IF NOT EXISTS idx_email_domains_audit_domain_id ON email_domains_audit(domain_id);
CREATE INDEX IF NOT EXISTS idx_email_domains_audit_changed_by ON email_domains_audit(changed_by);
CREATE INDEX IF NOT EXISTS idx_email_domains_audit_changed_at ON email_domains_audit(changed_at);

-- Trigger para auditoria automática
CREATE OR REPLACE FUNCTION audit_email_domains()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        INSERT INTO email_domains_audit (
            domain_id, action, old_values, changed_by, changed_at
        ) VALUES (
            OLD.id, 
            TG_OP, 
            to_jsonb(OLD), 
            OLD.created_by, -- Usar created_by como fallback
            NOW()
        );
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO email_domains_audit (
            domain_id, action, old_values, new_values, changed_by, changed_at
        ) VALUES (
            NEW.id, 
            TG_OP, 
            to_jsonb(OLD), 
            to_jsonb(NEW), 
            NEW.created_by, -- Será atualizado pelo backend com usuário real
            NOW()
        );
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO email_domains_audit (
            domain_id, action, new_values, changed_by, changed_at
        ) VALUES (
            NEW.id, 
            TG_OP, 
            to_jsonb(NEW), 
            NEW.created_by, 
            NOW()
        );
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_audit_email_domains
    AFTER INSERT OR UPDATE OR DELETE ON email_domains
    FOR EACH ROW
    EXECUTE FUNCTION audit_email_domains();

-- RLS (Row Level Security) para multi-tenancy
ALTER TABLE email_domains ENABLE ROW LEVEL SECURITY;

-- Policy: Admins podem ver tudo
CREATE POLICY "Admins can view all email domains" ON email_domains
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Policy: Usuários podem ver apenas domínios ativos
CREATE POLICY "Users can view active email domains" ON email_domains
    FOR SELECT USING (is_active = TRUE);

-- Comentários para documentação
COMMENT ON TABLE email_domains IS 'Tabela para gerenciar múltiplos domínios de email para campanhas de leads';
COMMENT ON COLUMN email_domains.domain_name IS 'Nome do domínio (ex: farmacia-express.com)';
COMMENT ON COLUMN email_domains.from_name IS 'Nome do remetente (ex: Farmácia Express)';
COMMENT ON COLUMN email_domains.from_email IS 'Email remetente (ex: contato@farmacia-express.com)';
COMMENT ON COLUMN email_domains.reply_to_email IS 'Email para resposta (ex: suporte@farmacia-express.com)';
COMMENT ON COLUMN email_domains.resend_api_key IS 'Chave da API do Resend (pode ser compartilhada)';
COMMENT ON COLUMN email_domains.is_default IS 'Se é o domínio padrão (viaforteexpress.com) - apenas um permitido';
COMMENT ON COLUMN email_domains.is_active IS 'Se o domínio está ativo para uso';

-- Inserir domínio padrão (viaforteexpress.com)
-- Nota: Substitua 'YOUR_RESEND_API_KEY_HERE' pela sua API key real do Resend
INSERT INTO email_domains (
    domain_name,
    from_name,
    from_email,
    reply_to_email,
    resend_api_key,
    is_default,
    is_active
) VALUES (
    'frotaexpress.com',
    'FROTA EXPRESS',
    'contato@frotaexpress.com',
    'suporte@frotaexpress.com',
    COALESCE(
        current_setting('app.default_resend_api_key', true),
        'YOUR_RESEND_API_KEY_HERE'
    ),
    TRUE,
    TRUE
) ON CONFLICT (domain_name) DO NOTHING;

-- Configurar a API key padrão via variável de sessão (opcional)
-- Para usar: SET app.default_resend_api_key = 'sua_api_key_aqui';

-- Verificar se a inserção foi bem-sucedida
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM email_domains WHERE domain_name = 'frotaexpress.com') THEN
        RAISE NOTICE '✅ Domínio padrão frotaexpress.com criado com sucesso!';
    ELSE
        RAISE EXCEPTION '❌ Falha ao criar domínio padrão!';
    END IF;
END $$;

-- Mostrar resumo da criação
SELECT 
    'Tabela email_domains criada com sucesso!' as status,
    COUNT(*) as total_dominios,
    COUNT(*) FILTER (WHERE is_default = TRUE) as dominios_padrao,
    COUNT(*) FILTER (WHERE is_active = TRUE) as dominios_ativos
FROM email_domains;