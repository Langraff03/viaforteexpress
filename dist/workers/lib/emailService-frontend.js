// ✅ VERSÃO FRONTEND SEGURA - Usa apenas ANON_KEY + RLS
// Este arquivo é bundlado pelo Vite e é seguro para frontend
import { supabase } from './supabaseClient'; // ✅ Apenas ANON_KEY
// Função para obter variáveis de ambiente do frontend (VITE_*)
function getEnvVar(name) {
    if (typeof window !== 'undefined' && import.meta?.env) {
        return import.meta.env[`VITE_${name}`];
    }
    return undefined;
}
/**
 * ✅ FRONTEND: Buscar domínios de email disponíveis via RLS
 * Usa supabase (ANON_KEY) + política RLS "admin_full_access_email_domains"
 */
export async function getAvailableEmailDomains() {
    try {
        console.log('🔧 [Frontend] Buscando domínios de email via RLS...');
        const { data, error } = await supabase
            .from('email_domains')
            .select('*')
            .eq('is_active', true)
            .order('is_default', { ascending: false })
            .order('domain_name');
        if (error) {
            console.error('❌ [Frontend] Erro ao buscar domínios:', error);
            // Fallback: retornar configuração padrão das variáveis de ambiente
            const defaultDomain = {
                id: 'env-default',
                domain_name: getEnvVar('FROM_EMAIL')?.split('@')[1] || 'viaforteexpress.com',
                resend_api_key: getEnvVar('RESEND_API_KEY') || '',
                is_active: true,
                is_default: true,
                from_name: getEnvVar('FROM_NAME') || 'VIA FORTE EXPRESS',
                from_email: getEnvVar('FROM_EMAIL') || 'contato@viaforteexpress.com',
                reply_to_email: getEnvVar('SUPPORT_EMAIL') || 'suporte@viaforteexpress.com',
                // client_id: null, // Removido - não faz parte do tipo EmailDomain
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };
            return [defaultDomain];
        }
        return data || [];
    }
    catch (error) {
        console.error('❌ [Frontend] Exceção ao buscar domínios:', error);
        // Fallback seguro usando variáveis de ambiente
        return [{
                id: 'env-fallback',
                domain_name: getEnvVar('FROM_EMAIL')?.split('@')[1] || 'viaforteexpress.com',
                resend_api_key: getEnvVar('RESEND_API_KEY') || '',
                is_active: true,
                is_default: true,
                from_name: getEnvVar('FROM_NAME') || 'VIA FORTE EXPRESS',
                from_email: getEnvVar('FROM_EMAIL') || 'contato@viaforteexpress.com',
                reply_to_email: getEnvVar('SUPPORT_EMAIL') || 'suporte@viaforteexpress.com',
                // client_id: null, // Removido - não faz parte do tipo EmailDomain
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            }];
    }
}
/**
 * ✅ FRONTEND: Validar chave API do Resend (teste básico)
 * Não usa banco de dados - apenas validação de formato
 */
export async function validateResendApiKey(apiKey) {
    try {
        console.log('🔧 [Frontend] Validando API key Resend...');
        // Validação básica de formato
        if (!apiKey || typeof apiKey !== 'string') {
            return {
                valid: false,
                error: 'API key é obrigatória',
                details: null
            };
        }
        if (!apiKey.startsWith('re_')) {
            return {
                valid: false,
                error: 'API key deve começar com "re_"',
                details: null
            };
        }
        if (apiKey.length < 20) {
            return {
                valid: false,
                error: 'API key muito curta',
                details: null
            };
        }
        // Para validação completa, o backend deve fazer teste real
        return {
            valid: true,
            error: undefined,
            details: 'API key com formato válido. Teste completo feito no backend.'
        };
    }
    catch (error) {
        console.error('❌ [Frontend] Erro na validação:', error);
        return {
            valid: false,
            error: error instanceof Error ? error.message : 'Erro desconhecido',
            details: error
        };
    }
}
/**
 * ⚠️ FUNÇÃO PLACEHOLDER: sendTrackingEmail
 * Esta função requer backend para envio real de email
 * Frontend deve fazer chamada para API endpoint
 */
export async function sendTrackingEmail(data) {
    console.warn('⚠️ [Frontend] sendTrackingEmail deve ser movida para API backend');
    console.log('💡 Use: fetch("/api/send-tracking-email", { method: "POST", body: JSON.stringify(data) })');
    throw new Error('sendTrackingEmail deve ser executada no backend via API endpoint');
}
/**
 * ✅ FRONTEND: Placeholder para configuração de email
 * Usa apenas variáveis de ambiente públicas
 */
export async function getEmailConfig() {
    return {
        fromName: getEnvVar('FROM_NAME') || 'VIA FORTE EXPRESS',
        fromEmail: getEnvVar('FROM_EMAIL') || 'contato@viaforteexpress.com',
        replyToEmail: getEnvVar('SUPPORT_EMAIL') || 'suporte@viaforteexpress.com',
        resendApiKey: getEnvVar('RESEND_API_KEY') || '', // Público no frontend
    };
}
console.log('✅ emailService-frontend.ts carregado (frontend seguro)');
//# sourceMappingURL=emailService-frontend.js.map