import { PaymentGateway } from './GatewayInterface';
export interface AssetPaymentResponse {
    id: string;
    customer: string;
    value: number;
    status: string;
    dueDate: string;
    description?: string;
    invoiceUrl?: string;
    pixQrCode?: string;
    [extraProps: string]: any;
}
export interface AssetCustomerResponse {
    id: string;
    name: string;
    email: string;
    phone?: string;
    mobilePhone?: string;
    [extraProps: string]: any;
}
export interface AssetGatewayConfig {
    apiKey: string;
    apiUrl: string;
    webhookSecret: string;
    clientId: string;
    gatewayId: string;
}
export declare class AssetGateway implements PaymentGateway {
    private assetClient;
    config: AssetGatewayConfig;
    constructor(config: AssetGatewayConfig);
    createCustomer(data: {
        name: string;
        email: string;
        phone?: string;
    }): Promise<{
        id: string;
    }>;
    getCustomer(id: string): Promise<AssetCustomerResponse | null>;
    createPayment(data: {
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
    getPayment(paymentId: string): Promise<{
        status: string;
        clientId: string;
        gatewayId: string;
        [extraProps: string]: any;
    } | null>;
    cancelPayment(paymentId: string): Promise<{
        status: string;
        clientId: string;
        gatewayId: string;
        [extraProps: string]: any;
    } | null>;
    listPayments(params?: {
        customer?: string;
        status?: string;
        offset?: number;
        limit?: number;
    }): Promise<{
        data: AssetPaymentResponse[];
        totalCount: number;
        hasMore: boolean;
        clientId: string;
        gatewayId: string;
    }>;
    processWebhook(payload: any, headers: Record<string, string | string[] | undefined>): Promise<{
        processed: boolean;
        eventType: string;
        paymentId?: string;
        orderId?: string;
        newStatus?: string;
        clientId: string;
        gatewayId: string;
        error?: string;
        [extraProps: string]: any;
    }>;
    /**
     * Validates Asaas webhook signature.
     * O Asaas normalmente usa um token estático ('asaas_webhook_token') enviado nos cabeçalhos para validação,
     * ou nenhuma assinatura complexa, confiando no sigilo da URL do webhook e na lista de permissões de IP.
     * Este é um placeholder; verifique a documentação do Asaas para o método de validação específico deles.
     * Se eles usarem uma assinatura HMAC, você precisará de crypto.
     */
    validateWebhookSignature(rawPayload: string | Buffer, // O Asaas pode não precisar do rawPayload se for uma verificação de token simples
    signatureHeader: string | undefined, // ex: req.headers['asaas-webhook-token']
    configuredSecret?: string): boolean;
}
