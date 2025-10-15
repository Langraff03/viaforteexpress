import { PaymentStatus, WebhookEventType } from '../../types/gateway';
/**
 * Utilitários para normalização de dados entre diferentes gateways
 */
export declare class GatewayUtils {
    /**
     * Mapeia status de pagamento específicos do gateway para status padronizados
     */
    static normalizePaymentStatus(gatewayType: string, gatewayStatus: string): PaymentStatus;
    /**
     * Normaliza status do gateway Asset/Asaas
     */
    private static normalizeAssetStatus;
    /**
     * Normaliza status do Mercado Pago
     */
    private static normalizeMercadoPagoStatus;
    /**
     * Normaliza status do Stripe
     */
    private static normalizeStripeStatus;
    /**
     * Normaliza status genérico (fallback)
     */
    private static normalizeGenericStatus;
    /**
     * Normaliza tipos de evento de webhook
     */
    static normalizeWebhookEventType(gatewayType: string, eventType: string): WebhookEventType;
    /**
     * Normaliza eventos do Asset/Asaas
     */
    private static normalizeAssetEventType;
    /**
     * Normaliza eventos do Mercado Pago
     */
    private static normalizeMercadoPagoEventType;
    /**
     * Normaliza eventos do Stripe
     */
    private static normalizeStripeEventType;
    /**
     * Normaliza eventos genéricos
     */
    private static normalizeGenericEventType;
    /**
     * Extrai ID do pedido de diferentes formatos de payload
     */
    static extractOrderId(payload: any): string | null;
    /**
     * Extrai informações do cliente de diferentes formatos de payload
     */
    static extractCustomerInfo(payload: any): {
        name?: string;
        email?: string;
        phone?: string;
        document?: string;
    } | null;
    /**
     * Extrai valor do pagamento de diferentes formatos
     */
    static extractPaymentAmount(payload: any): number;
    /**
     * Converte valor entre diferentes formatos (centavos/reais)
     */
    static convertAmount(amount: number, fromFormat: 'cents' | 'reals', toFormat: 'cents' | 'reals'): number;
    /**
     * Valida se um payload de webhook é válido
     */
    static validateWebhookPayload(payload: any): {
        isValid: boolean;
        errors: string[];
    };
    /**
     * Gera um hash único para um payload de webhook
     */
    static generateWebhookHash(payload: any): string;
    /**
     * Normaliza dados de endereço de diferentes formatos
     */
    static normalizeAddress(address: any): {
        street?: string;
        number?: string;
        complement?: string;
        neighborhood?: string;
        city?: string;
        state?: string;
        zipCode?: string;
        country?: string;
    } | null;
    /**
     * Formata um valor monetário para exibição
     */
    static formatCurrency(amount: number, currency?: string): string;
}
