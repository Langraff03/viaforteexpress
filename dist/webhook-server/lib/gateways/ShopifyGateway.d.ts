import { PaymentGateway } from './GatewayInterface';
/**
 * Interface para configuração do gateway Shopify
 */
export interface ShopifyGatewayConfig {
    apiKey?: string;
    apiUrl?: string;
    webhookSecret: string;
    clientId: string;
    gatewayId: string;
    shopDomain?: string;
}
/**
 * Interface para dados do cliente Shopify
 */
export interface ShopifyCustomer {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    phone?: string;
    default_address?: ShopifyAddress;
}
/**
 * Interface para endereço Shopify
 */
export interface ShopifyAddress {
    address1: string;
    address2?: string;
    city: string;
    province: string;
    zip: string;
    country: string;
    phone?: string;
}
/**
 * Interface para item de pedido Shopify
 */
export interface ShopifyLineItem {
    id: number;
    title: string;
    quantity: number;
    price: string;
    sku?: string;
    variant_title?: string;
    vendor?: string;
    product_id: number;
    variant_id: number;
    grams: number;
}
/**
 * Interface para pedido pago da Shopify (orders/paid webhook)
 */
export interface ShopifyPaidOrder {
    id: number;
    email: string;
    name: string;
    total_price: string;
    subtotal_price: string;
    total_tax: string;
    currency: string;
    financial_status: string;
    fulfillment_status: string | null;
    created_at: string;
    updated_at: string;
    customer: ShopifyCustomer;
    shipping_address: ShopifyAddress;
    billing_address: ShopifyAddress;
    line_items: ShopifyLineItem[];
    order_number: number;
}
/**
 * Gateway para integração com Shopify
 */
export declare class ShopifyGateway implements PaymentGateway {
    config: ShopifyGatewayConfig;
    constructor(config: ShopifyGatewayConfig);
    /**
     * Criar cliente - Não aplicável para Shopify (clientes são gerenciados pela própria Shopify)
     */
    createCustomer(data: {
        name: string;
        email: string;
        phone?: string;
    }): Promise<{
        id: string;
    }>;
    /**
     * Criar pagamento - Não aplicável para Shopify (pagamentos são processados pela Shopify)
     */
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
    /**
     * Buscar pagamento - Implementação futura usando Shopify Admin API
     */
    getPayment?(paymentId: string): Promise<{
        status: string;
        clientId: string;
        gatewayId: string;
        [extraProps: string]: any;
    } | null>;
    /**
     * Cancelar pagamento - Implementação futura usando Shopify Admin API
     */
    cancelPayment?(paymentId: string): Promise<{
        status: string;
        clientId: string;
        gatewayId: string;
        [extraProps: string]: any;
    } | null>;
    /**
     * Processa webhook da Shopify (foco principal desta integração)
     * Baseado na documentação oficial: https://shopify.dev/docs/api/admin-rest/2024-01/resources/webhook#event-topics
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
     * Valida assinatura HMAC do webhook da Shopify
     */
    validateWebhookSignature(rawPayload: string | Buffer, signatureHeader: string | undefined, configuredSecret?: string): boolean;
    /**
     * Verifica se o webhook é do tipo orders/paid
     */
    private isOrderPaidWebhook;
}
