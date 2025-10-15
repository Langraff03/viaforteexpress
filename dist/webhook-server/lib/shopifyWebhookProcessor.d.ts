/**
 * Processador de webhooks da Shopify
 * Shopify não é um gateway de pagamento, é uma integração de e-commerce
 */
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
 * Resultado do processamento do webhook Shopify
 */
export interface ShopifyProcessingResult {
    processed: boolean;
    error?: string;
    order?: {
        id: string;
        customer_name: string;
        customer_email: string;
        amount: number;
        shipping: {
            street: string;
            street2?: string;
            city: string;
            state: string;
            zip: string;
            country: string;
            phone?: string;
        };
        items: Array<{
            name: string;
            quantity: number;
            price: number;
            sku?: string;
            variant?: string;
            vendor?: string;
        }>;
        shopify_order_number: number;
        shopify_financial_status: string;
        shopify_fulfillment_status: string | null;
        currency: string;
        created_at: string;
    };
}
/**
 * Classe para processar webhooks da Shopify
 */
export declare class ShopifyWebhookProcessor {
    /**
     * Valida assinatura HMAC do webhook da Shopify
     */
    static validateWebhookSignature(rawPayload: string | Buffer, signatureHeader: string | undefined, webhookSecret: string): boolean;
    /**
     * Processa webhook da Shopify do evento orders/paid
     */
    static processOrderPaidWebhook(payload: any): Promise<ShopifyProcessingResult>;
    /**
     * Verifica se o webhook é do tipo orders/paid
     */
    private static isOrderPaidWebhook;
}
