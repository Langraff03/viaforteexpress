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
// Filas
// Filas
export const trackingQueue = new Queue('tracking', { connection });
export const emailQueue = new Queue('email', { connection });
export const paymentWebhookQueue = new Queue('payment-webhook', { connection }); // Renomeado para clareza
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
export const generateTrackingCode = (clientId = '') => {
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
export const queuePaymentWebhook = async (data) => {
    // O nome do job poderia ser mais dinâmico, ex: `${data.gateway}.${data.event}`
    return paymentWebhookQueue.add(`webhook.${data.gateway}.${data.event}`, data, {
        removeOnComplete: true,
        removeOnFail: true,
        attempts: 3 // Configure as tentativas conforme necessário
    });
};
/**
 * Enfileira um job para criar um pagamento via gateway.
 */
export const queuePaymentCreation = async (data) => {
    return paymentCreationQueue.add(`create.${data.clientId}.${data.orderId}`, // Nome do job para melhor rastreabilidade
    data, {
        removeOnComplete: true, // Ou configure com base nas suas necessidades
        removeOnFail: true, // Ou configure para fila de mensagens mortas (dead-letter queue)
        attempts: 3 // Número de tentativas
    });
};
/**
 * Enfileira um job para gerar o código de rastreio.
 */
export const queueTrackingCodeGeneration = async (data) => {
    return trackingQueue.add('tracking.generate', data, {
        removeOnComplete: true,
        removeOnFail: true,
        attempts: 3
    });
};
/**
 * Enfileira um job de envio de email.
 */
export const queueEmail = async (data) => {
    return emailQueue.add('email.send', data, {
        //delay: 25 * 60 * 1000, // 25 minutos de delay 
        removeOnComplete: true,
        removeOnFail: true,
        attempts: 3
    });
};
/**
 * Enfileira um job para processar leads internos do banco de dados.
 */
export const queueInternalLeadProcessing = async (data) => {
    return internalLeadQueue.add('lead.process.internal', data, {
        removeOnComplete: true,
        removeOnFail: true,
        attempts: 3
    });
};
/**
 * Enfileira um job para processar leads externos de um arquivo.
 */
export const queueExternalLeadProcessing = async (data) => {
    return externalLeadQueue.add(`lead.process.external.${data.clientId}`, data, {
        removeOnComplete: true,
        removeOnFail: true,
        attempts: 3
    });
};
/**
 * Enfileira um job para enviar email para um lead específico.
 */
export const queueLeadEmail = async (data) => {
    return leadEmailQueue.add(`lead.email.${data.origem}.${data.email.replace(/[@.]/g, '_')}`, data, {
        removeOnComplete: true,
        removeOnFail: true,
        attempts: 3,
        // Sem delay para emails de oferta, queremos enviar imediatamente
    });
};
// === FUNÇÕES PARA SISTEMA ENTERPRISE DE MASSA ===
/**
 * Enfileira uma campanha de email em massa (>100 leads).
 * Esta função cria o job principal que será processado pelo MassEmailWorker.
 */
export const queueMassEmailCampaign = async (data) => {
    return massEmailQueue.add(`mass-campaign.${data.campaign_id}`, data, {
        removeOnComplete: false, // Manter para auditoria
        removeOnFail: false, // Manter para debugging
        attempts: 1, // Não retry campanha inteira, só batches individuais
        priority: data.priority || 0,
        delay: 1000, // 1 segundo de delay para dar tempo do banco atualizar
    });
};
/**
 * Enfileira um lote (batch) de emails para processamento.
 * Esta função é chamada pelo MassEmailWorker para processar lotes de 50 emails.
 */
export const queueMassEmailBatch = async (data) => {
    return massEmailQueue.add(`mass-batch.${data.campaign_id}.${data.batch_id}`, data, {
        removeOnComplete: true, // Limpar após completar para economizar memória
        removeOnFail: false, // Manter falhas para retry
        attempts: data.max_retries || 3,
        backoff: {
            type: 'exponential',
            delay: 2000, // 2s, 4s, 8s
        },
        // Rate limiting: espaçar jobs baseado no rate limit
        delay: Math.floor(1000 / data.rate_limit_per_second) * data.batch_number,
    });
};
/**
 * Função utilitária para calcular ETA de uma campanha.
 */
export const calculateCampaignETA = (totalLeads, rateLimit = 90, batchSize = 50) => {
    const totalBatches = Math.ceil(totalLeads / batchSize);
    const emailsPerSecond = Math.min(rateLimit, batchSize * 4); // 4 workers paralelos
    const estimatedSeconds = Math.ceil(totalLeads / emailsPerSecond);
    return estimatedSeconds;
};
/**
 * Pausa uma campanha de email em massa.
 */
export const pauseCampaign = async (campaignId) => {
    try {
        // Encontrar e pausar jobs relacionados a esta campanha
        const jobs = await massEmailQueue.getJobs(['waiting', 'active', 'delayed']);
        const campaignJobs = jobs.filter(job => job.name.includes(campaignId) || job.data.campaign_id === campaignId);
        for (const job of campaignJobs) {
            await job.remove();
        }
        console.log(`📊 Campanha ${campaignId} pausada - ${campaignJobs.length} jobs removidos`);
        return true;
    }
    catch (error) {
        console.error(`❌ Erro ao pausar campanha ${campaignId}:`, error);
        return false;
    }
};
/**
 * Resume uma campanha de email em massa.
 */
export const resumeCampaign = async (campaignId) => {
    try {
        // Esta função precisará ser chamada junto com a lógica de retomada do worker
        // O worker deve verificar o status na tabela campaign_progress
        console.log(`📊 Solicitação de retomada da campanha ${campaignId} registrada`);
        return true;
    }
    catch (error) {
        console.error(`❌ Erro ao retomar campanha ${campaignId}:`, error);
        return false;
    }
};
/**
 * Cancela uma campanha de email em massa.
 */
export const cancelCampaign = async (campaignId) => {
    try {
        // Encontrar e cancelar todos os jobs desta campanha
        const jobs = await massEmailQueue.getJobs(['waiting', 'active', 'delayed', 'completed', 'failed']);
        const campaignJobs = jobs.filter(job => job.name.includes(campaignId) || job.data.campaign_id === campaignId);
        for (const job of campaignJobs) {
            await job.remove();
        }
        console.log(`📊 Campanha ${campaignId} cancelada - ${campaignJobs.length} jobs removidos`);
        return true;
    }
    catch (error) {
        console.error(`❌ Erro ao cancelar campanha ${campaignId}:`, error);
        return false;
    }
};
/**
 * Função para pausar uma campanha (marca jobs como delayed).
 */
export const pauseMassEmailCampaign = async (campaignId) => {
    const jobs = await massEmailQueue.getJobs(['waiting', 'delayed'], 0, -1);
    const campaignJobs = jobs.filter(job => job.data.campaign_id === campaignId);
    for (const job of campaignJobs) {
        await job.moveToDelayed(Date.now() + 86400000); // 24h delay
    }
    return campaignJobs.length;
};
/**
 * Função para retomar uma campanha pausada.
 */
export const resumeMassEmailCampaign = async (campaignId) => {
    const jobs = await massEmailQueue.getJobs(['delayed'], 0, -1);
    const campaignJobs = jobs.filter(job => job.data.campaign_id === campaignId);
    for (const job of campaignJobs) {
        await job.moveToWaiting();
    }
    return campaignJobs.length;
};
/**
 * Função para cancelar uma campanha (remove todos os jobs pendentes).
 */
export const cancelMassEmailCampaign = async (campaignId) => {
    const jobs = await massEmailQueue.getJobs(['waiting', 'delayed'], 0, -1);
    const campaignJobs = jobs.filter(job => job.data.campaign_id === campaignId);
    for (const job of campaignJobs) {
        await job.remove();
    }
    return campaignJobs.length;
};
//# sourceMappingURL=queue.js.map