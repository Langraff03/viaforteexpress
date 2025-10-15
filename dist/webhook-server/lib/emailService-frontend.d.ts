import type { EmailDomain, ValidationResponse } from '../types';
/**
 * ✅ FRONTEND: Buscar domínios de email disponíveis via RLS
 * Usa supabase (ANON_KEY) + política RLS "admin_full_access_email_domains"
 */
export declare function getAvailableEmailDomains(): Promise<EmailDomain[]>;
/**
 * ✅ FRONTEND: Validar chave API do Resend (teste básico)
 * Não usa banco de dados - apenas validação de formato
 */
export declare function validateResendApiKey(apiKey: string): Promise<ValidationResponse>;
/**
 * ⚠️ FUNÇÃO PLACEHOLDER: sendTrackingEmail
 * Esta função requer backend para envio real de email
 * Frontend deve fazer chamada para API endpoint
 */
export declare function sendTrackingEmail(data: any): Promise<void>;
/**
 * ✅ FRONTEND: Placeholder para configuração de email
 * Usa apenas variáveis de ambiente públicas
 */
export declare function getEmailConfig(): Promise<{
    fromName: string;
    fromEmail: string;
    replyToEmail: string;
    resendApiKey: string;
}>;
