// src/lib/queue.ts

import { Queue } from 'bullmq';
import Redis from 'ioredis';

// Conexão Redis com configuração mais robusta
const connection = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT) || 6379,
  maxRetriesPerRequest: 3, // Limitar retries para evitar travamentos
  enableReadyCheck: true,
  lazyConnect: true, // Conectar apenas quando necessário
  reconnectOnError: (err) => {
    console.warn('Redis reconnection attempt:', err.message);
    return err.message.includes('READONLY'); // Reconectar apenas em erros específicos
  },
});

// Tratamento de eventos Redis para debugging
connection.on('connect', () => console.log('✅ Redis conectado'));
connection.on('ready', () => console.log('✅ Redis pronto'));
connection.on('error', (err) => console.error('❌ Erro Redis:', err.message));
connection.on('close', () => console.log('⚠️ Conexão Redis fechada'));
connection.on('reconnecting', () => console.log('🔄 Reconectando Redis...'));

// Interfaces
// Interfaces
export interface TrackingJobData {
  clientId?: string;  // Opcional
  orderId: string;
}

export interface PaymentWebhookJobData { // Renomeado para ser específico
  gateway: string; // Identificador para o gateway que enviou o webhook (deve ser 'asset')
  event: string;   // Tipo de evento (ex: 'payment.confirmed', 'payment.failed')
  payload: any;    // O payload bruto do webhook
  clientId?: string; // Opcional: se o webhook puder ser vinculado a um cliente específico
}

// Nova interface para jobs de criação de pagamento
export interface PaymentCreationJobData {
  orderId: string;
  clientId: string;
  amount: number;
  dueDate: string; // String de data ISO
  customer: {
    name: string;
    email: string;
    phone?: string;
    // document?: string;
    // address?: object;
  };
  description: string;
}

export interface EmailJobData {
  to: string;
  subject: string;
  template: string;
  context: Record<string, any>;
  html?: string; // Template HTML personalizado (para campanhas de lead)
}

// Interface para jobs de processamento de leads internos
export interface InternalLeadJobData {
  batchId?: string; // Identificador opcional para agrupar leads processados em lote
  filters?: Record<string, any>; // Filtros para buscar leads no banco de dados
}

// Interface para jobs de processamento de leads externos (de arquivos)
export interface ExternalLeadJobData {
  clientId: string; // ID do cliente que enviou os leads
  fileId?: string; // ID do arquivo de leads (se aplicável)
  leads: Array<{
    email: string;
    nome?: string;
    oferta_interesse?: string;
    [key: string]: any; // Outros campos que possam vir no arquivo
  }>;
  ofertaConfig: {
    oferta_nome: string;
    desconto?: string;
    link_da_oferta: string;
    descricao_adicional?: string;
    email_template?: string; // Template HTML personalizado
    domain_id?: string; // ✅ NOVO: ID do domínio de email personalizado
  };
}
// Interface para jobs de envio de email para um lead específico
export interface LeadEmailJobData {
  leadId?: string; // ID do lead no banco de dados (se for interno)
  email: string;
  nome: string;
  oferta_nome: string;
  desconto?: string;
  link_da_oferta: string;
  descricao_adicional?: string;
  origem: 'interno' | 'externo';
  cliente_id?: string; // ID do cliente que enviou o lead (se for externo)
  email_template?: string; // Template HTML personalizado
  domain_id?: string; // ✅ NOVO: ID do domínio de email personalizado
  cpf?: string; // ✅ NOVO: CPF opcional do lead
}

// === INTERFACES PARA SISTEMA ENTERPRISE DE MASSA ===

// Interface para jobs de processamento de campanha em massa
export interface MassEmailCampaignJobData {
  campaign_id: string; // ID da campanha no banco
  user_id: string; // ID do usuário (para segurança)
  total_leads: number; // Total de leads na campanha
  batch_size: number; // Tamanho do lote (default: 50)
  rate_limit_per_second: number; // Rate limit (default: 90)
  
  // Configuração da campanha
  campaign_config: {
    name: string;
    subject_template: string; // Template do subject com variáveis
    html_template: string; // Template HTML personalizado
    oferta_nome: string;
    desconto?: string;
    link_da_oferta: string;
    descricao_adicional?: string;
    domain_id?: string; // ✅ NOVO: ID do domínio de email personalizado
  };
  
  // Metadados
  created_at: string; // ISO timestamp
  priority?: number; // Prioridade da campanha (default: 0)
}

// Interface para jobs de lote de emails (processado pelo worker)
export interface MassEmailBatchJobData {
  campaign_id: string;
  batch_id: string; // ID único do lote
  batch_number: number; // Número do lote (1, 2, 3...)
  total_batches: number; // Total de lotes na campanha
  
  // Leads deste lote (máximo 50)
  leads: Array<{
    email: string;
    nome?: string;
    [key: string]: any; // Campos extras para personalização
  }>;
  
  // Configuração da campanha (copiada para evitar queries)
  campaign_config: {
    name: string;
    subject_template: string;
    html_template: string;
    oferta_nome: string;
    desconto?: string;
    link_da_oferta: string;
    descricao_adicional?: string;
    domain_id?: string; // ✅ NOVO: ID do domínio de email personalizado
  };
  
  // Rate limiting
  rate_limit_per_second: number;
  
  // Retry configuration
  retry_count: number;
  max_retries: number;
}

// Interface para progresso da campanha (WebSocket updates)
export interface CampaignProgressUpdate {
  campaign_id: string;
  status: 'pending' | 'processing' | 'paused' | 'completed' | 'failed' | 'cancelled';
  progress_percent: number;
  sent_count: number;
  failed_count: number;
  total_leads: number;
  current_batch: number;
  total_batches: number;
  estimated_completion?: string; // ISO timestamp
  started_at?: string;
  error_message?: string;
}
// Filas
// Filas
export const trackingQueue = new Queue('tracking', { connection });
export const emailQueue     = new Queue('email',     { connection });
export const paymentWebhookQueue   = new Queue('payment-webhook',   { connection }); // Renomeado para clareza
export const paymentCreationQueue = new Queue('payment-creation', { connection }); // Nova fila
export const internalLeadQueue = new Queue('internal-lead', { connection }); // Fila para processamento de leads internos
export const externalLeadQueue = new Queue('external-lead', { connection }); // Fila para processamento de leads externos
export const leadEmailQueue = new Queue('lead-email', { connection }); // Fila para envio de emails para leads

// === SISTEMA ENTERPRISE DE MASSA (NOVO) ===
export const massEmailQueue = new Queue('mass-email', { connection }); // Fila para campanhas grandes (>100 leads)
/**
 * Gera um código de rastreio único.
 * Formato: 6 caracteres aleatórios (letras ou números)
 * clientId é ignorado para manter compatibilidade com o frontend antigo
 */
export const generateTrackingCode = (clientId: string = ''): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

/**
 * Enfileira um job de webhook de pagamento (e.g., confirmação, falha).
 */
export const queuePaymentWebhook = async (data: PaymentWebhookJobData) => {
  // O nome do job poderia ser mais dinâmico, ex: `${data.gateway}.${data.event}`
  return paymentWebhookQueue.add(
    `webhook.${data.gateway}.${data.event}`,
    data,
    {
      removeOnComplete: true,
      removeOnFail:    true,
      attempts:        3 // Configure as tentativas conforme necessário
    }
  );
};

/**
 * Enfileira um job para criar um pagamento via gateway.
 */
export const queuePaymentCreation = async (data: PaymentCreationJobData) => {
  return paymentCreationQueue.add(
    `create.${data.clientId}.${data.orderId}`, // Nome do job para melhor rastreabilidade
    data,
    {
      removeOnComplete: true, // Ou configure com base nas suas necessidades
      removeOnFail: true,    // Ou configure para fila de mensagens mortas (dead-letter queue)
      attempts: 3            // Número de tentativas
    }
  );
};

/**
 * Enfileira um job para gerar o código de rastreio.
 */
export const queueTrackingCodeGeneration = async (data: TrackingJobData) => {
  return trackingQueue.add(
    'tracking.generate',
    data,
    {
      removeOnComplete: true,
      removeOnFail:    true,
      attempts:        3
    }
  );
};

/**
 * Enfileira um job de envio de email.
 */
export const queueEmail = async (data: EmailJobData) => {
  return emailQueue.add(
    'email.send',
    data,
    {
     //delay: 25 * 60 * 1000, // 25 minutos de delay 
      removeOnComplete: true,
      removeOnFail:     true,
      attempts:         3
    }
  );
};

/**
 * Enfileira um job para processar leads internos do banco de dados.
 */
export const queueInternalLeadProcessing = async (data: InternalLeadJobData) => {
  return internalLeadQueue.add(
    'lead.process.internal',
    data,
    {
      removeOnComplete: true,
      removeOnFail:     true,
      attempts:         3
    }
  );
};

/**
 * Enfileira um job para processar leads externos de um arquivo.
 */
export const queueExternalLeadProcessing = async (data: ExternalLeadJobData) => {
  return externalLeadQueue.add(
    `lead.process.external.${data.clientId}`,
    data,
    {
      removeOnComplete: true,
      removeOnFail:     true,
      attempts:         3
    }
  );
};

/**
 * Enfileira um job para enviar email para um lead específico.
 */
export const queueLeadEmail = async (data: LeadEmailJobData) => {
  return leadEmailQueue.add(
    `lead.email.${data.origem}.${data.email.replace(/[@.]/g, '_')}`,
    data,
    {
      removeOnComplete: true,
      removeOnFail:     true,
      attempts:         3,
      // Sem delay para emails de oferta, queremos enviar imediatamente
    }
  );
};

// === FUNÇÕES PARA SISTEMA ENTERPRISE DE MASSA ===

/**
 * Enfileira uma campanha de email em massa (>100 leads).
 * Esta função cria o job principal que será processado pelo MassEmailWorker.
 */
export const queueMassEmailCampaign = async (data: MassEmailCampaignJobData) => {
  return massEmailQueue.add(
    `mass-campaign.${data.campaign_id}`,
    data,
    {
      removeOnComplete: false, // Manter para auditoria
      removeOnFail: false,     // Manter para debugging
      attempts: 1,             // Não retry campanha inteira, só batches individuais
      priority: data.priority || 0,
      delay: 1000, // 1 segundo de delay para dar tempo do banco atualizar
    }
  );
};

/**
 * Enfileira um lote (batch) de emails para processamento.
 * Esta função é chamada pelo MassEmailWorker para processar lotes de 50 emails.
 */
export const queueMassEmailBatch = async (data: MassEmailBatchJobData) => {
  return massEmailQueue.add(
    `mass-batch.${data.campaign_id}.${data.batch_id}`,
    data,
    {
      removeOnComplete: true, // Limpar após completar para economizar memória
      removeOnFail: false,    // Manter falhas para retry
      attempts: data.max_retries || 3,
      backoff: {
        type: 'exponential',
        delay: 2000, // 2s, 4s, 8s
      },
      // Rate limiting: espaçar jobs baseado no rate limit
      delay: Math.floor(1000 / data.rate_limit_per_second) * data.batch_number,
    }
  );
};

/**
 * Função utilitária para calcular ETA de uma campanha.
 */
export const calculateCampaignETA = (
  totalLeads: number,
  rateLimit: number = 90,
  batchSize: number = 50
): number => {
  const totalBatches = Math.ceil(totalLeads / batchSize);
  const emailsPerSecond = Math.min(rateLimit, batchSize * 4); // 4 workers paralelos
  const estimatedSeconds = Math.ceil(totalLeads / emailsPerSecond);
  return estimatedSeconds;
};

/**
 * Pausa uma campanha de email em massa.
 */
export const pauseCampaign = async (campaignId: string): Promise<boolean> => {
  try {
    // Encontrar e pausar jobs relacionados a esta campanha
    const jobs = await massEmailQueue.getJobs(['waiting', 'active', 'delayed']);
    const campaignJobs = jobs.filter(job =>
      job.name.includes(campaignId) || job.data.campaign_id === campaignId
    );

    for (const job of campaignJobs) {
      await job.remove();
    }

    console.log(`📊 Campanha ${campaignId} pausada - ${campaignJobs.length} jobs removidos`);
    return true;
  } catch (error) {
    console.error(`❌ Erro ao pausar campanha ${campaignId}:`, error);
    return false;
  }
};

/**
 * Resume uma campanha de email em massa.
 */
export const resumeCampaign = async (campaignId: string): Promise<boolean> => {
  try {
    // Esta função precisará ser chamada junto com a lógica de retomada do worker
    // O worker deve verificar o status na tabela campaign_progress
    console.log(`📊 Solicitação de retomada da campanha ${campaignId} registrada`);
    return true;
  } catch (error) {
    console.error(`❌ Erro ao retomar campanha ${campaignId}:`, error);
    return false;
  }
};

/**
 * Cancela uma campanha de email em massa.
 */
export const cancelCampaign = async (campaignId: string): Promise<boolean> => {
  try {
    // Encontrar e cancelar todos os jobs desta campanha
    const jobs = await massEmailQueue.getJobs(['waiting', 'active', 'delayed', 'completed', 'failed']);
    const campaignJobs = jobs.filter(job =>
      job.name.includes(campaignId) || job.data.campaign_id === campaignId
    );

    for (const job of campaignJobs) {
      await job.remove();
    }

    console.log(`📊 Campanha ${campaignId} cancelada - ${campaignJobs.length} jobs removidos`);
    return true;
  } catch (error) {
    console.error(`❌ Erro ao cancelar campanha ${campaignId}:`, error);
    return false;
  }
};

/**
 * Função para pausar uma campanha (marca jobs como delayed).
 */
export const pauseMassEmailCampaign = async (campaignId: string) => {
  const jobs = await massEmailQueue.getJobs(['waiting', 'delayed'], 0, -1);
  const campaignJobs = jobs.filter(job => 
    job.data.campaign_id === campaignId
  );
  
  for (const job of campaignJobs) {
    await job.moveToDelayed(Date.now() + 86400000); // 24h delay
  }
  
  return campaignJobs.length;
};

/**
 * Função para retomar uma campanha pausada.
 */
export const resumeMassEmailCampaign = async (campaignId: string) => {
  const jobs = await massEmailQueue.getJobs(['delayed'], 0, -1);
  const campaignJobs = jobs.filter(job => 
    job.data.campaign_id === campaignId
  );
  
  for (const job of campaignJobs) {
    await job.moveToWaiting();
  }
  
  return campaignJobs.length;
};

/**
 * Função para cancelar uma campanha (remove todos os jobs pendentes).
 */
export const cancelMassEmailCampaign = async (campaignId: string) => {
  const jobs = await massEmailQueue.getJobs(['waiting', 'delayed'], 0, -1);
  const campaignJobs = jobs.filter(job => 
    job.data.campaign_id === campaignId
  );
  
  for (const job of campaignJobs) {
    await job.remove();
  }
  
  return campaignJobs.length;
};
