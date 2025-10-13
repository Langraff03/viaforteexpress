-- Tabela para tracking de progresso de campanhas de email em massa
-- Suporta campanhas de até 50K leads com monitoramento tempo real

CREATE TABLE IF NOT EXISTS campaign_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES lead_campaigns(id) ON DELETE CASCADE,
    
    -- Status da campanha
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'paused', 'completed', 'failed', 'cancelled')),
    
    -- Métricas de progresso
    total_leads INTEGER NOT NULL CHECK (total_leads > 0),
    sent_count INTEGER NOT NULL DEFAULT 0 CHECK (sent_count >= 0),
    failed_count INTEGER NOT NULL DEFAULT 0 CHECK (failed_count >= 0),
    progress_percent DECIMAL(5,2) NOT NULL DEFAULT 0.00 CHECK (progress_percent >= 0 AND progress_percent <= 100),
    
    -- Timing
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    estimated_completion TIMESTAMP WITH TIME ZONE,
    
    -- Configuração de processamento
    batch_size INTEGER NOT NULL DEFAULT 50 CHECK (batch_size > 0),
    rate_limit_per_second INTEGER NOT NULL DEFAULT 90 CHECK (rate_limit_per_second > 0),
    
    -- Logs e debugging
    current_batch INTEGER DEFAULT 0,
    total_batches INTEGER DEFAULT 0,
    last_processed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_counts CHECK (sent_count + failed_count <= total_leads),
    CONSTRAINT valid_timing CHECK (started_at IS NULL OR completed_at IS NULL OR completed_at >= started_at)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_campaign_progress_campaign_id ON campaign_progress(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_progress_status ON campaign_progress(status);
CREATE INDEX IF NOT EXISTS idx_campaign_progress_created_at ON campaign_progress(created_at);
CREATE INDEX IF NOT EXISTS idx_campaign_progress_active ON campaign_progress(status) WHERE status IN ('pending', 'processing', 'paused');

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_campaign_progress_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    
    -- Calcular progress_percent automaticamente
    IF NEW.total_leads > 0 THEN
        NEW.progress_percent = ROUND(((NEW.sent_count + NEW.failed_count)::DECIMAL / NEW.total_leads::DECIMAL) * 100, 2);
    END IF;
    
    -- Calcular total_batches se não definido
    IF NEW.total_batches = 0 AND NEW.batch_size > 0 THEN
        NEW.total_batches = CEIL(NEW.total_leads::DECIMAL / NEW.batch_size::DECIMAL);
    END IF;
    
    -- Auto-completar campanha quando atingir 100%
    IF NEW.progress_percent = 100.00 AND NEW.status = 'processing' THEN
        NEW.status = 'completed';
        NEW.completed_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_campaign_progress_updated_at
    BEFORE UPDATE ON campaign_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_campaign_progress_updated_at();

-- RLS (Row Level Security) para garantir que usuários só vejam suas campanhas
ALTER TABLE campaign_progress ENABLE ROW LEVEL SECURITY;

-- Política para SELECT: usuários só veem progresso de suas campanhas
CREATE POLICY select_own_campaign_progress ON campaign_progress
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM lead_campaigns lc 
            WHERE lc.id = campaign_progress.campaign_id 
            AND lc.client_id = auth.uid()
        )
    );

-- Política para INSERT: usuários só podem criar progresso para suas campanhas
CREATE POLICY insert_own_campaign_progress ON campaign_progress
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM lead_campaigns lc 
            WHERE lc.id = campaign_progress.campaign_id 
            AND lc.client_id = auth.uid()
        )
    );

-- Política para UPDATE: usuários só podem atualizar progresso de suas campanhas
CREATE POLICY update_own_campaign_progress ON campaign_progress
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM lead_campaigns lc 
            WHERE lc.id = campaign_progress.campaign_id 
            AND lc.client_id = auth.uid()
        )
    );

-- Política para DELETE: usuários só podem deletar progresso de suas campanhas
CREATE POLICY delete_own_campaign_progress ON campaign_progress
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM lead_campaigns lc 
            WHERE lc.id = campaign_progress.campaign_id 
            AND lc.client_id = auth.uid()
        )
    );

-- Função para inicializar progresso de uma campanha
CREATE OR REPLACE FUNCTION initialize_campaign_progress(
    p_campaign_id UUID,
    p_total_leads INTEGER,
    p_batch_size INTEGER DEFAULT 50,
    p_rate_limit INTEGER DEFAULT 90
) RETURNS UUID AS $$
DECLARE
    progress_id UUID;
BEGIN
    -- Verificar se o usuário é dono da campanha
    IF NOT EXISTS (
        SELECT 1 FROM lead_campaigns 
        WHERE id = p_campaign_id AND client_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Acesso negado: campanha não pertence ao usuário';
    END IF;
    
    -- Verificar se já existe progresso para esta campanha
    SELECT id INTO progress_id FROM campaign_progress WHERE campaign_id = p_campaign_id;
    
    IF progress_id IS NOT NULL THEN
        RAISE EXCEPTION 'Progresso já existe para esta campanha';
    END IF;
    
    -- Criar novo progresso
    INSERT INTO campaign_progress (
        campaign_id,
        total_leads,
        batch_size,
        rate_limit_per_second,
        status
    ) VALUES (
        p_campaign_id,
        p_total_leads,
        p_batch_size,
        p_rate_limit,
        'pending'
    ) RETURNING id INTO progress_id;
    
    RETURN progress_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para atualizar progresso (será chamada pelos workers)
CREATE OR REPLACE FUNCTION update_campaign_progress(
    p_campaign_id UUID,
    p_sent_increment INTEGER DEFAULT 0,
    p_failed_increment INTEGER DEFAULT 0,
    p_status VARCHAR(20) DEFAULT NULL,
    p_current_batch INTEGER DEFAULT NULL,
    p_error_message TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
    UPDATE campaign_progress SET
        sent_count = sent_count + p_sent_increment,
        failed_count = failed_count + p_failed_increment,
        status = COALESCE(p_status, status),
        current_batch = COALESCE(p_current_batch, current_batch),
        error_message = COALESCE(p_error_message, error_message),
        last_processed_at = NOW()
    WHERE campaign_id = p_campaign_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Progresso não encontrado para a campanha %', p_campaign_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE campaign_progress IS 'Tabela para monitoramento de progresso de campanhas de email em massa com suporte a 50K+ leads';