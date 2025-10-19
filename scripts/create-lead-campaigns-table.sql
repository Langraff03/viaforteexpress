-- Tabela para armazenar campanhas de leads
CREATE TABLE IF NOT EXISTS lead_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  client_id UUID REFERENCES auth.users(id),
  file_name VARCHAR(255),
  file_path VARCHAR(500),
  total_leads INTEGER DEFAULT 0,
  valid_leads INTEGER DEFAULT 0,
  processed_leads INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  fail_count INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'pending', -- pending, processing, completed, failed
  oferta_config JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_lead_campaigns_client_id ON lead_campaigns(client_id);
CREATE INDEX IF NOT EXISTS idx_lead_campaigns_status ON lead_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_lead_campaigns_created_at ON lead_campaigns(created_at);

-- RLS (Row Level Security) 
ALTER TABLE lead_campaigns ENABLE ROW LEVEL SECURITY;

-- Policy para que usuários só vejam suas próprias campanhas
CREATE POLICY "Users can view their own campaigns" ON lead_campaigns
  FOR SELECT USING (auth.uid() = client_id);

CREATE POLICY "Users can insert their own campaigns" ON lead_campaigns
  FOR INSERT WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Users can update their own campaigns" ON lead_campaigns
  FOR UPDATE USING (auth.uid() = client_id);

-- Admins podem ver e gerenciar todas as campanhas
CREATE POLICY "Admins can manage all campaigns" ON lead_campaigns
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Comentários para documentação
COMMENT ON TABLE lead_campaigns IS 'Tabela para armazenar campanhas de disparo de email para leads';
COMMENT ON COLUMN lead_campaigns.status IS 'Status da campanha: pending, processing, completed, failed';
COMMENT ON COLUMN lead_campaigns.oferta_config IS 'Configurações da oferta em JSON: nome, desconto, link, etc';