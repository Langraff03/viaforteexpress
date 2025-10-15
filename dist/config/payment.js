/**
 * Configurações padrão para gateways de pagamento
 *
 * NOTA: Estas configurações são apenas para fallback e desenvolvimento.
 * Em produção, as configurações devem ser carregadas da tabela 'gateways'
 * no banco de dados, específicas para cada cliente.
 */
// Configurações padrão para Asset
export const DEFAULT_ASSET_CONFIG = {
    apiUrl: process.env.ASSET_API_URL || 'https://api.asaas.com/v3',
    apiKey: process.env.ASSET_API_KEY || 'admin_live_0JqhhCVNXuTwzhfQHiiFbYpUT7YyDNI35rY',
    webhookSecret: process.env.ASSET_WEBHOOK_SECRET || 'dummy',
};
// Configurações padrão para Mercado Pago
export const DEFAULT_MERCADOPAGO_CONFIG = {
    accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '',
    publicKey: process.env.MERCADOPAGO_PUBLIC_KEY || '',
    webhookSecret: process.env.MERCADOPAGO_WEBHOOK_SECRET || '',
    sandboxMode: process.env.MERCADOPAGO_SANDBOX_MODE === 'true'
};
// Configurações padrão para Stripe
export const DEFAULT_STRIPE_CONFIG = {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    apiVersion: process.env.STRIPE_API_VERSION || '2023-10-16'
};
/**
 * Configurações de fallback para diferentes tipos de gateway
 */
export const GATEWAY_DEFAULTS = {
    asset: DEFAULT_ASSET_CONFIG,
    mercadopago: DEFAULT_MERCADOPAGO_CONFIG,
    stripe: DEFAULT_STRIPE_CONFIG,
};
/**
 * Configurações para gateways de pagamento
 * Suporta múltiplos tipos de gateway
 */
export const PAYMENT_CONFIG = {
    asset: DEFAULT_ASSET_CONFIG,
    mercadopago: DEFAULT_MERCADOPAGO_CONFIG,
    stripe: DEFAULT_STRIPE_CONFIG,
};
/**
 * Função para obter a configuração padrão de um gateway
 * @param type Tipo do gateway ('asset', 'mercadopago', 'stripe', etc.)
 * @returns Configuração padrão do gateway
 */
export function getDefaultGatewayConfig(type) {
    const normalizedType = type.toLowerCase();
    if (GATEWAY_DEFAULTS[normalizedType]) {
        return GATEWAY_DEFAULTS[normalizedType];
    }
    console.warn(`Configuração padrão não encontrada para gateway '${type}'. Tipos suportados: ${Object.keys(GATEWAY_DEFAULTS).join(', ')}`);
    // Retornar configuração genérica se não encontrar específica
    return {
        webhookSecret: process.env[`${normalizedType.toUpperCase()}_WEBHOOK_SECRET`] || '',
    };
}
/**
 * Verifica se um tipo de gateway tem configuração padrão
 * @param type Tipo do gateway
 * @returns true se tiver configuração padrão
 */
export function hasDefaultConfig(type) {
    return Object.keys(GATEWAY_DEFAULTS).includes(type.toLowerCase());
}
/**
 * Obtém todos os tipos de gateway com configuração padrão
 * @returns Array com os tipos de gateway suportados
 */
export function getSupportedGatewayTypes() {
    return Object.keys(GATEWAY_DEFAULTS);
}
