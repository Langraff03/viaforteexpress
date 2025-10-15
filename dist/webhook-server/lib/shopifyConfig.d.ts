/**
 * Funções para gerenciar configurações Shopify dos freelancers
 * Shopify é uma integração de e-commerce, não um gateway de pagamento
 */
export interface ShopifyConfig {
    user_id: string;
    webhook_secret: string;
    shop_domain?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}
/**
 * Busca configuração Shopify de um freelancer
 */
export declare function getShopifyConfig(userId: string): Promise<ShopifyConfig | null>;
/**
 * Salva ou atualiza configuração Shopify de um freelancer
 */
export declare function saveShopifyConfig(userId: string, webhookSecret: string, shopDomain?: string): Promise<boolean>;
/**
 * Desativa configuração Shopify de um freelancer
 */
export declare function deactivateShopifyConfig(userId: string): Promise<boolean>;
/**
 * Lista todas as configurações Shopify ativas (para admin)
 */
export declare function getAllActiveShopifyConfigs(): Promise<ShopifyConfig[]>;
