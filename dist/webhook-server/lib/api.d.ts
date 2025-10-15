import type { Order, OfferEmailLog } from '../types';
/**
 * Busca os pedidos aos quais o usuário logado tem acesso.
 * A RLS (Row Level Security) filtra os resultados automaticamente.
 */
export declare function getOrders(): Promise<Order[]>;
/** Subscreve alterações na tabela de pedidos */
export declare function subscribeToOrders(callback: () => void): () => void;
/**
 * Busca os logs de e-mail aos quais o usuário logado tem acesso.
 * A RLS (Row Level Security) filtra os resultados automaticamente.
 */
export declare function getOfferEmailLogs(): Promise<OfferEmailLog[]>;
/** Subscreve alterações na tabela de logs de e-mail */
export declare function subscribeToOfferEmailLogs(callback: () => void): () => void;
/**
 * Cria um novo pedido no banco de dados.
 * A RLS garantirá que client_id e gateway_id sejam preenchidos corretamente.
 */
export declare function createOrder(params: Partial<Order>): Promise<Order>;
/** Gera um código de rastreio aleatório de 6 caracteres */
export declare function generateTrackingCode(): string;
/** Gera um código de rastreio único verificando no banco de dados */
export declare function generateUniqueTrackingCode(): Promise<string>;
/** Gera o link completo de rastreamento */
export declare function generateTrackingLink(code: string): string;
/** Stub: quick test de envio de email */
export declare function testEmailConfiguration(cfg: {
    from_name: string;
    from_email: string;
    reply_to: string;
}): Promise<void>;
/** Stub: quick test do gateway API key */
export declare function testGatewayConfiguration(apiKey: string): Promise<void>;
export declare const api: {
    getOrders: typeof getOrders;
    subscribeToOrders: typeof subscribeToOrders;
    getOfferEmailLogs: typeof getOfferEmailLogs;
    subscribeToOfferEmailLogs: typeof subscribeToOfferEmailLogs;
    createOrder: typeof createOrder;
    generateTrackingCode: typeof generateTrackingCode;
    generateUniqueTrackingCode: typeof generateUniqueTrackingCode;
    generateTrackingLink: typeof generateTrackingLink;
    testEmailConfiguration: typeof testEmailConfiguration;
    testGatewayConfiguration: typeof testGatewayConfiguration;
};
