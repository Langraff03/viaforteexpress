import { PaymentGateway } from './GatewayInterface';
/**
 * Configuração base para qualquer gateway
 */
export interface BaseGatewayConfig {
    clientId: string;
    gatewayId: string;
    webhookSecret?: string;
    [key: string]: any;
}
/**
 * Resultado padrão de processamento de webhook
 */
export interface WebhookProcessingResult {
    processed: boolean;
    eventType: string;
    paymentId?: string;
    orderId?: string;
    newStatus?: string;
    clientId: string;
    gatewayId: string;
    error?: string;
    [extraProps: string]: any;
}
/**
 * Classe base abstrata para implementação de gateways
 * Fornece funcionalidades comuns e implementações padrão
 */
export declare abstract class BaseGateway implements PaymentGateway {
    config: BaseGatewayConfig;
    constructor(config: BaseGatewayConfig);
    /**
     * Valida a configuração básica do gateway
     * Subclasses podem sobrescrever para validações específicas
     */
    protected validateConfig(): void;
    /**
     * Método abstrato para criar cliente - deve ser implementado pelas subclasses
     */
    abstract createCustomer(data: {
        name: string;
        email: string;
        phone?: string;
    }): Promise<{
        id: string;
    }>;
    /**
     * Método abstrato para criar pagamento - deve ser implementado pelas subclasses
     */
    abstract createPayment(data: {
        customer: string;
        value: number;
        dueDate: string;
        description: string;
        status: string;
    }): Promise<{
        id: string;
        status: string;
        clientId: string;
        gatewayId: string;
        [extraProps: string]: any;
    }>;
    /**
     * Método abstrato para processar webhook - deve ser implementado pelas subclasses
     */
    abstract processWebhook(payload: any, headers: Record<string, string | string[] | undefined>): Promise<WebhookProcessingResult>;
    /**
     * Implementação padrão para obter pagamento
     * Subclasses podem sobrescrever se necessário
     */
    getPayment?(paymentId: string): Promise<{
        status: string;
        clientId: string;
        gatewayId: string;
        [extraProps: string]: any;
    } | null>;
    /**
     * Implementação padrão para cancelar pagamento
     * Subclasses podem sobrescrever se necessário
     */
    cancelPayment?(paymentId: string): Promise<{
        status: string;
        clientId: string;
        gatewayId: string;
        [extraProps: string]: any;
    } | null>;
    /**
     * Implementação padrão de validação de webhook
     * Subclasses devem sobrescrever para validações específicas
     */
    validateWebhookSignature?(rawPayload: string | Buffer, signature: string | undefined, secret?: string): boolean;
    /**
     * Utilitário para normalizar status de pagamento
     * Mapeia status específicos do gateway para status padrão
     */
    protected normalizePaymentStatus(gatewayStatus: string): string;
    /**
     * Utilitário para gerar resultado de webhook com valores padrão
     */
    protected createWebhookResult(processed: boolean, eventType: string, additionalData?: Partial<WebhookProcessingResult>): WebhookProcessingResult;
    /**
     * Utilitário para log padronizado
     */
    protected log(message: string, level?: 'info' | 'warn' | 'error'): void;
    /**
     * Utilitário para tratar erros de forma padronizada
     */
    protected handleError(error: any, context: string): never;
}
