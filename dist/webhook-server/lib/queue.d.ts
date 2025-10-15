import { Queue } from 'bullmq';
export interface TrackingJobData {
    clientId?: string;
    orderId: string;
}
export interface PaymentWebhookJobData {
    gateway: string;
    event: string;
    payload: any;
    clientId?: string;
}
export interface PaymentCreationJobData {
    orderId: string;
    clientId: string;
    amount: number;
    dueDate: string;
    customer: {
        name: string;
        email: string;
        phone?: string;
    };
    description: string;
}
export interface EmailJobData {
    to: string;
    subject: string;
    template: string;
    context: Record<string, any>;
    html?: string;
}
export interface InternalLeadJobData {
    batchId?: string;
    filters?: Record<string, any>;
}
export interface ExternalLeadJobData {
    clientId: string;
    fileId?: string;
    leads: Array<{
        email: string;
        nome?: string;
        oferta_interesse?: string;
        [key: string]: any;
    }>;
    ofertaConfig: {
        oferta_nome: string;
        desconto?: string;
        link_da_oferta: string;
        descricao_adicional?: string;
        email_template?: string;
        domain_id?: string;
    };
}
export interface LeadEmailJobData {
    leadId?: string;
    email: string;
    nome: string;
    oferta_nome: string;
    desconto?: string;
    link_da_oferta: string;
    descricao_adicional?: string;
    origem: 'interno' | 'externo';
    cliente_id?: string;
    email_template?: string;
    domain_id?: string;
    cpf?: string;
}
export interface MassEmailCampaignJobData {
    campaign_id: string;
    user_id: string;
    total_leads: number;
    batch_size: number;
    rate_limit_per_second: number;
    campaign_config: {
        name: string;
        subject_template: string;
        html_template: string;
        oferta_nome: string;
        desconto?: string;
        link_da_oferta: string;
        descricao_adicional?: string;
        domain_id?: string;
    };
    created_at: string;
    priority?: number;
}
export interface MassEmailBatchJobData {
    campaign_id: string;
    batch_id: string;
    batch_number: number;
    total_batches: number;
    leads: Array<{
        email: string;
        nome?: string;
        [key: string]: any;
    }>;
    campaign_config: {
        name: string;
        subject_template: string;
        html_template: string;
        oferta_nome: string;
        desconto?: string;
        link_da_oferta: string;
        descricao_adicional?: string;
        domain_id?: string;
    };
    rate_limit_per_second: number;
    retry_count: number;
    max_retries: number;
}
export interface CampaignProgressUpdate {
    campaign_id: string;
    status: 'pending' | 'processing' | 'paused' | 'completed' | 'failed' | 'cancelled';
    progress_percent: number;
    sent_count: number;
    failed_count: number;
    total_leads: number;
    current_batch: number;
    total_batches: number;
    estimated_completion?: string;
    started_at?: string;
    error_message?: string;
}
export declare const trackingQueue: Queue<any, any, string, any, any, string>;
export declare const emailQueue: Queue<any, any, string, any, any, string>;
export declare const paymentWebhookQueue: Queue<any, any, string, any, any, string>;
export declare const paymentCreationQueue: Queue<any, any, string, any, any, string>;
export declare const internalLeadQueue: Queue<any, any, string, any, any, string>;
export declare const externalLeadQueue: Queue<any, any, string, any, any, string>;
export declare const leadEmailQueue: Queue<any, any, string, any, any, string>;
export declare const massEmailQueue: Queue<any, any, string, any, any, string>;
/**
 * Gera um código de rastreio único.
 * Formato: 6 caracteres aleatórios (letras ou números)
 * clientId é ignorado para manter compatibilidade com o frontend antigo
 */
export declare const generateTrackingCode: (clientId?: string) => string;
/**
 * Enfileira um job de webhook de pagamento (e.g., confirmação, falha).
 */
export declare const queuePaymentWebhook: (data: PaymentWebhookJobData) => Promise<import("bullmq").Job<any, any, string>>;
/**
 * Enfileira um job para criar um pagamento via gateway.
 */
export declare const queuePaymentCreation: (data: PaymentCreationJobData) => Promise<import("bullmq").Job<any, any, string>>;
/**
 * Enfileira um job para gerar o código de rastreio.
 */
export declare const queueTrackingCodeGeneration: (data: TrackingJobData) => Promise<import("bullmq").Job<any, any, string>>;
/**
 * Enfileira um job de envio de email.
 */
export declare const queueEmail: (data: EmailJobData) => Promise<import("bullmq").Job<any, any, string>>;
/**
 * Enfileira um job para processar leads internos do banco de dados.
 */
export declare const queueInternalLeadProcessing: (data: InternalLeadJobData) => Promise<import("bullmq").Job<any, any, string>>;
/**
 * Enfileira um job para processar leads externos de um arquivo.
 */
export declare const queueExternalLeadProcessing: (data: ExternalLeadJobData) => Promise<import("bullmq").Job<any, any, string>>;
/**
 * Enfileira um job para enviar email para um lead específico.
 */
export declare const queueLeadEmail: (data: LeadEmailJobData) => Promise<import("bullmq").Job<any, any, string>>;
/**
 * Enfileira uma campanha de email em massa (>100 leads).
 * Esta função cria o job principal que será processado pelo MassEmailWorker.
 */
export declare const queueMassEmailCampaign: (data: MassEmailCampaignJobData) => Promise<import("bullmq").Job<any, any, string>>;
/**
 * Enfileira um lote (batch) de emails para processamento.
 * Esta função é chamada pelo MassEmailWorker para processar lotes de 50 emails.
 */
export declare const queueMassEmailBatch: (data: MassEmailBatchJobData) => Promise<import("bullmq").Job<any, any, string>>;
/**
 * Função utilitária para calcular ETA de uma campanha.
 */
export declare const calculateCampaignETA: (totalLeads: number, rateLimit?: number, batchSize?: number) => number;
/**
 * Pausa uma campanha de email em massa.
 */
export declare const pauseCampaign: (campaignId: string) => Promise<boolean>;
/**
 * Resume uma campanha de email em massa.
 */
export declare const resumeCampaign: (campaignId: string) => Promise<boolean>;
/**
 * Cancela uma campanha de email em massa.
 */
export declare const cancelCampaign: (campaignId: string) => Promise<boolean>;
/**
 * Função para pausar uma campanha (marca jobs como delayed).
 */
export declare const pauseMassEmailCampaign: (campaignId: string) => Promise<number>;
/**
 * Função para retomar uma campanha pausada.
 */
export declare const resumeMassEmailCampaign: (campaignId: string) => Promise<number>;
/**
 * Função para cancelar uma campanha (remove todos os jobs pendentes).
 */
export declare const cancelMassEmailCampaign: (campaignId: string) => Promise<number>;
