import type { EmailDomain, ValidationResponse } from '../types';
export type EmailConfig = {
    fromName: string;
    fromEmail: string;
    replyToEmail: string;
    resendApiKey: string;
};
export declare function getEmailConfig(): Promise<EmailConfig>;
/**
 * Obtém configuração de email por domínio específico
 * @param domainId UUID do domínio na tabela email_domains
 * @returns Promise<EmailConfig> Configuração do email (com fallback automático)
 */
export declare function getEmailConfigByDomain(domainId?: string): Promise<EmailConfig>;
/**
 * Lista todos os domínios ativos disponíveis para seleção
 * @returns Promise<EmailDomain[]> Lista de domínios ativos
 */
export declare function getAvailableEmailDomains(): Promise<EmailDomain[]>;
/**
 * Obtém o domínio padrão (viaforteexpress.com)
 * @returns Promise<EmailDomain | null> Domínio padrão ou null se não encontrado
 */
export declare function getDefaultEmailDomain(): Promise<EmailDomain | null>;
/**
 * Valida uma API key do Resend
 * @param apiKey Chave da API para validar
 * @returns Promise<ValidationResponse> Resultado da validação
 */
export declare function validateResendApiKey(apiKey: string): Promise<ValidationResponse>;
export declare function testEmailConfiguration(config: {
    fromName: string;
    fromEmail: string;
    resendApiKey: string;
}): Promise<void>;
export declare function sendTrackingEmail(order: {
    id: string;
    tracking_code: string;
    customer_name: string;
    customer_email: string;
    status: string;
}, invoicePdfPath?: string): Promise<{
    success: boolean;
    id: string;
}>;
/**
 * Envia um email de oferta para um lead
 * ✅ ATUALIZADO: Agora aceita domainId opcional para usar domínios personalizados
 */
export declare function sendOfferEmail(lead: {
    id?: string;
    nome: string;
    email: string;
    oferta_interesse?: string;
    oferta_nome: string;
    desconto?: string;
    link_da_oferta: string;
    descricao_adicional?: string;
    origem?: string;
    cliente_id?: string;
}, domainId?: string): Promise<{
    success: boolean;
    id: string;
}>;
