// src/workers/mass-email.worker.ts
// Worker enterprise para processar campanhas de email em massa (100+ leads)
// Suporta até 50K leads com rate limiting inteligente e progress tracking

import { Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import { Resend } from 'resend';
import { 
  MassEmailCampaignJobData, 
  MassEmailBatchJobData,
  queueMassEmailBatch,
  CampaignProgressUpdate 
} from '../lib/queue';
import { getEmailConfig, getEmailConfigByDomain } from '../lib/emailService';
import { supabaseAdmin } from '../lib/server/supabaseAdmin'; // ✅ Backend seguro

// Redis connection
const connection = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT) || 6379,
  maxRetriesPerRequest: null,
});

// Rate limiter global para controlar concorrência entre campanhas
class GlobalRateLimiter {
  private tokens: number;
  private maxTokens: number;
  private refillRate: number;
  private lastRefill: number;

  constructor(maxRatePerSecond: number = 90) {
    this.maxTokens = maxRatePerSecond;
    this.tokens = maxRatePerSecond;
    this.refillRate = maxRatePerSecond;
    this.lastRefill = Date.now();
  }

  async waitForToken(): Promise<void> {
    this.refillTokens();
    
    if (this.tokens <= 0) {
      const waitTime = 1000 / this.refillRate;
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return this.waitForToken();
    }
    
    this.tokens--;
  }

  private refillTokens(): void {
    const now = Date.now();
    const timePassed = (now - this.lastRefill) / 1000;
    const tokensToAdd = Math.floor(timePassed * this.refillRate);
    
    if (tokensToAdd > 0) {
      this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
      this.lastRefill = now;
    }
  }
}

// Instância global do rate limiter
const globalRateLimiter = new GlobalRateLimiter(90); // 90 req/s global

// WebSocket broadcaster para progress updates
const broadcastProgress = async (update: CampaignProgressUpdate) => {
  try {
    // Implementação será feita no WebSocket server
    // Por enquanto, apenas log para debug
    console.log(`[MassEmail] 📊 Progress Update:`, JSON.stringify(update, null, 2));
    
    // Broadcast via WebSocket para updates tempo real
    try {
      const { websocketServer } = await import('../webhook-server/index');
      if (websocketServer) {
        websocketServer.broadcastCampaignUpdate(update);
      }
    } catch (error: any) {
      console.log('⚠️  WebSocket server não disponível para broadcast:', error?.message || error);
    }
    
  } catch (error) {
    console.error('[MassEmail] ❌ Erro ao broadcast progress:', error);
  }
};

// Worker principal para processar campanhas de massa
const massEmailWorker = new Worker<MassEmailCampaignJobData | MassEmailBatchJobData>(
  'mass-email',
  async (job: Job<MassEmailCampaignJobData | MassEmailBatchJobData>) => {
    const jobType = job.name.startsWith('mass-campaign') ? 'campaign' : 'batch';
    
    if (jobType === 'campaign') {
      return processCampaign(job as Job<MassEmailCampaignJobData>);
    } else {
      return processBatch(job as Job<MassEmailBatchJobData>);
    }
  },
  {
    connection,
    concurrency: 4, // 4 workers paralelos para máxima eficiência
  }
);

// Processar campanha (dividir em batches)
async function processCampaign(job: Job<MassEmailCampaignJobData>) {
  const data = job.data;
  console.log(`[MassEmail] 🚀 Iniciando campanha ${data.campaign_id} com ${data.total_leads} leads`);

  try {
    // 1. Inicializar progresso no banco
    await supabaseAdmin.rpc('initialize_campaign_progress', {
      p_campaign_id: data.campaign_id,
      p_total_leads: data.total_leads,
      p_batch_size: data.batch_size,
      p_rate_limit: data.rate_limit_per_second
    });

    // 2. Atualizar status para "processing"
    await updateCampaignProgress(data.campaign_id, { 
      status: 'processing',
      started_at: new Date().toISOString()
    });

    // 3. Buscar informações da campanha e path do arquivo
    const { data: campaignInfo, error: campaignError } = await supabaseAdmin
      .from('lead_campaigns')
      .select('file_path')
      .eq('id', data.campaign_id)
      .single();

    if (campaignError || !campaignInfo?.file_path) {
      throw new Error(`Erro ao buscar informações da campanha: ${campaignError?.message}`);
    }

    // 4. Ler leads do arquivo JSON
    let leadsArray;
    try {
      const fs = await import('fs');
      const fileContent = fs.readFileSync(campaignInfo.file_path, 'utf8');
      leadsArray = JSON.parse(fileContent);
      console.log(`[MassEmail] 📂 Leads carregados do arquivo: ${leadsArray.length} leads`);
    } catch (fileError) {
      throw new Error(`Erro ao ler arquivo de leads: ${fileError instanceof Error ? fileError.message : 'Arquivo não encontrado'}`);
    }

    // 5. Dividir em batches e enfileirar
    const totalBatches = Math.ceil(data.total_leads / data.batch_size);
    
    for (let i = 0; i < totalBatches; i++) {
      const startIndex = i * data.batch_size;
      const endIndex = Math.min(startIndex + data.batch_size, leadsArray.length);
      const batchLeads = leadsArray.slice(startIndex, endIndex);
      
      const batchData: MassEmailBatchJobData = {
        campaign_id: data.campaign_id,
        batch_id: `${data.campaign_id}-batch-${i + 1}`,
        batch_number: i + 1,
        total_batches: totalBatches,
        leads: batchLeads,
        campaign_config: data.campaign_config,
        rate_limit_per_second: data.rate_limit_per_second,
        retry_count: 0,
        max_retries: 3
      };

      await queueMassEmailBatch(batchData);
      console.log(`[MassEmail] 📦 Batch ${i + 1}/${totalBatches} enfileirado (${batchLeads.length} leads)`);
    }

    console.log(`[MassEmail] ✅ Campanha ${data.campaign_id} dividida em ${totalBatches} batches`);
    return { success: true, totalBatches, campaignId: data.campaign_id };

  } catch (error) {
    console.error(`[MassEmail] ❌ Erro ao processar campanha ${data.campaign_id}:`, error);
    
    await updateCampaignProgress(data.campaign_id, {
      status: 'failed',
      error_message: error instanceof Error ? error.message : 'Erro desconhecido'
    });
    
    throw error;
  }
}

// Processar batch (enviar emails)
async function processBatch(job: Job<MassEmailBatchJobData>) {
  const data = job.data;
  console.log(`[MassEmail] 📧 Processando batch ${data.batch_number}/${data.total_batches} (${data.leads.length} emails)`);

  let sentCount = 0;
  let failedCount = 0;
  const results = [];

  try {
    // ✅ NOVO: Obter configuração do email com suporte a domínio personalizado
    const emailConfig = await getEmailConfigByDomain(data.campaign_config.domain_id);
    
    console.log(`📧 [MassEmail] Usando configuração: ${emailConfig.fromName} <${emailConfig.fromEmail}> ${data.campaign_config.domain_id ? `(domínio: ${data.campaign_config.domain_id})` : '(padrão)'}`);
    const resend = new Resend(emailConfig.resendApiKey);

    // Processar cada lead do batch
    for (const lead of data.leads) {
      try {
        // Rate limiting global
        await globalRateLimiter.waitForToken();

        // Personalizar template
        const subject = personalizeTemplate(data.campaign_config.subject_template, {
          nome: lead.nome || 'Cliente',
          oferta: data.campaign_config.oferta_nome,
          desconto: data.campaign_config.desconto || '',
          cpf: lead.cpf || '',
        });

        const htmlContent = personalizeTemplate(data.campaign_config.html_template, {
          nome: lead.nome || 'Cliente',
          oferta: data.campaign_config.oferta_nome,
          desconto: data.campaign_config.desconto || '',
          link: data.campaign_config.link_da_oferta,
          descricao: data.campaign_config.descricao_adicional || '',
          cpf: lead.cpf || '',
        });

        // Enviar email
        const { data: emailResult, error: emailError } = await resend.emails.send({
          from: `${emailConfig.fromName} <${emailConfig.fromEmail}>`,
          to: [lead.email],
          replyTo: emailConfig.replyToEmail,
          subject: subject,
          html: htmlContent,
        });

        if (emailError || !emailResult) {
          throw new Error(emailError?.message || 'Erro ao enviar email');
        }

        sentCount++;
        results.push({ 
          email: lead.email, 
          success: true, 
          messageId: emailResult.id 
        });

        console.log(`[MassEmail] ✅ Email enviado: ${lead.email} (${emailResult.id})`);

      } catch (emailError) {
        failedCount++;
        results.push({ 
          email: lead.email, 
          success: false, 
          error: emailError instanceof Error ? emailError.message : 'Erro desconhecido'
        });

        console.error(`[MassEmail] ❌ Falha ao enviar para ${lead.email}:`, emailError);
      }
    }

    // Atualizar progresso no banco
    await updateCampaignProgress(data.campaign_id, {
      sent_increment: sentCount,
      failed_increment: failedCount,
      current_batch: data.batch_number
    });

    console.log(`[MassEmail] ✅ Batch ${data.batch_number} concluído: ${sentCount} enviados, ${failedCount} falharam`);
    
    return {
      success: true,
      batchId: data.batch_id,
      sentCount,
      failedCount,
      results
    };

  } catch (error) {
    console.error(`[MassEmail] ❌ Erro no batch ${data.batch_id}:`, error);
    
    // Marcar todos os leads restantes como falha
    const remainingFailures = data.leads.length - sentCount - failedCount;
    if (remainingFailures > 0) {
      failedCount += remainingFailures;
      await updateCampaignProgress(data.campaign_id, {
        sent_increment: sentCount,
        failed_increment: failedCount,
        current_batch: data.batch_number
      });
    }
    
    throw error;
  }
}

// Função para personalizar templates
function personalizeTemplate(template: string, variables: Record<string, string>): string {
  let result = template;
  
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, value || '');
  }
  
  return result;
}

// Função para atualizar progresso e broadcast WebSocket
async function updateCampaignProgress(
  campaignId: string, 
  updates: {
    status?: string;
    sent_increment?: number;
    failed_increment?: number;
    current_batch?: number;
    error_message?: string;
    started_at?: string;
  }
) {
  try {
    // Atualizar banco
    await supabaseAdmin.rpc('update_campaign_progress', {
      p_campaign_id: campaignId,
      p_sent_increment: updates.sent_increment || 0,
      p_failed_increment: updates.failed_increment || 0,
      p_status: updates.status || null,
      p_current_batch: updates.current_batch || null,
      p_error_message: updates.error_message || null
    });

    // Buscar estado atual para broadcast
    const { data: progress } = await supabaseAdmin
      .from('campaign_progress')
      .select('*')
      .eq('campaign_id', campaignId)
      .single();

    if (progress) {
      await broadcastProgress({
        campaign_id: campaignId,
        status: progress.status,
        progress_percent: progress.progress_percent,
        sent_count: progress.sent_count,
        failed_count: progress.failed_count,
        total_leads: progress.total_leads,
        current_batch: progress.current_batch,
        total_batches: progress.total_batches,
        estimated_completion: progress.estimated_completion,
        started_at: progress.started_at,
        error_message: progress.error_message
      });
    }

  } catch (error) {
    console.error(`[MassEmail] ❌ Erro ao atualizar progresso:`, error);
  }
}

// Event handlers
massEmailWorker.on('completed', (job) => {
  const jobType = job.name.startsWith('mass-campaign') ? 'campanha' : 'batch';
  console.log(`✅ [MassEmail] ${jobType} concluído (job.id=${job?.id})`);
});

massEmailWorker.on('failed', (job, err) => {
  const jobType = job?.name.startsWith('mass-campaign') ? 'campanha' : 'batch';
  console.error(`❌ [MassEmail] ${jobType} falhou (job.id=${job?.id}):`, err);
});

massEmailWorker.on('progress', (job, progress) => {
  console.log(`🔄 [MassEmail] Progresso job.id=${job?.id}: ${progress}%`);
});

export { massEmailWorker };