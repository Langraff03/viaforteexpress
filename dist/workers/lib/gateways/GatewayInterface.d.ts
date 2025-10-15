export interface PaymentGateway {
    config: any;
    createCustomer(data: {
        name: string;
        email: string;
        phone?: string;
    }): Promise<{
        id: string;
    }>;
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
    getPayment?(paymentId: string): Promise<{
        status: string;
        clientId: string;
        gatewayId: string;
        [extraProps: string]: any;
    } | null>;
    cancelPayment?(paymentId: string): Promise<{
        status: string;
        clientId: string;
        gatewayId: string;
        [extraProps: string]: any;
    } | null>;
    /**
     * Processes an incoming webhook payload from the payment gateway.
     * @param payload O corpo bruto da requisição do webhook.
     * @param headers Os cabeçalhos da requisição, que podem conter assinaturas ou tipos de evento.
     * @returns Uma promessa resolvida para um objeto detalhando o resultado do processamento do webhook.
     */
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
     * Validates the signature of an incoming webhook.
     * @param rawPayload O corpo bruto da requisição (necessário para alguns gateways para verificação de assinatura).
     * @param signature A assinatura do cabeçalho da requisição (ex: 'X-Signature').
     * @param secret O segredo do webhook configurado para este gateway/cliente (opcional, pode usar o configurado no gateway).
     * @returns Verdadeiro se a assinatura for válida, falso caso contrário.
     */
    validateWebhookSignature?(rawPayload: string | Buffer, signature: string | undefined, secret?: string): boolean;
}
