import { AssetGateway } from './AssetGateway';
import { ShopifyGateway } from './ShopifyGateway';
/**
 * Registry central para todos os gateways de pagamento
 * Permite registro dinâmico e instanciação de gateways
 */
class GatewayRegistryClass {
    constructor() {
        this.gateways = new Map();
    }
    /**
     * Registra um novo gateway no sistema
     * @param type Tipo do gateway (ex: 'asset', 'mercadopago', 'stripe')
     * @param info Informações do gateway
     */
    register(type, info) {
        console.log(`[GatewayRegistry] Registrando gateway: ${type}`);
        this.gateways.set(type.toLowerCase(), info);
    }
    /**
     * Cria uma instância de gateway baseada no tipo e configuração
     * @param type Tipo do gateway
     * @param config Configuração do gateway
     * @returns Instância do gateway
     */
    createGateway(type, config) {
        const gatewayInfo = this.gateways.get(type.toLowerCase());
        if (!gatewayInfo) {
            throw new Error(`Gateway type '${type}' not registered. Available types: ${Array.from(this.gateways.keys()).join(', ')}`);
        }
        console.log(`[GatewayRegistry] Criando instância do gateway: ${type}`);
        return new gatewayInfo.constructor(config);
    }
    /**
     * Verifica se um tipo de gateway está registrado
     * @param type Tipo do gateway
     * @returns true se estiver registrado
     */
    isRegistered(type) {
        return this.gateways.has(type.toLowerCase());
    }
    /**
     * Obtém informações sobre um gateway registrado
     * @param type Tipo do gateway
     * @returns Informações do gateway ou undefined
     */
    getGatewayInfo(type) {
        return this.gateways.get(type.toLowerCase());
    }
    /**
     * Lista todos os gateways registrados
     * @returns Array com os tipos de gateway disponíveis
     */
    getAvailableGateways() {
        return Array.from(this.gateways.keys());
    }
    /**
     * Obtém informações detalhadas de todos os gateways
     * @returns Map com informações de todos os gateways
     */
    getAllGatewayInfo() {
        return new Map(this.gateways);
    }
    /**
     * Valida se uma configuração é válida para um tipo de gateway
     * @param type Tipo do gateway
     * @param config Configuração a ser validada
     * @returns true se válida, false caso contrário
     */
    validateConfig(type, config) {
        const gatewayInfo = this.gateways.get(type.toLowerCase());
        if (!gatewayInfo) {
            return false;
        }
        // Validação básica - pode ser expandida com schemas específicos
        return config && typeof config === 'object';
    }
}
// Instância singleton do registry
export const GatewayRegistry = new GatewayRegistryClass();
// Registrar o gateway Asset por padrão
GatewayRegistry.register('asset', {
    name: 'Asset (Asaas)',
    description: 'Gateway de pagamento Asset/Asaas',
    constructor: AssetGateway,
    configSchema: {
        required: ['apiKey', 'apiUrl', 'webhookSecret', 'clientId', 'gatewayId'],
        optional: []
    }
});
// Registrar o gateway Shopify
GatewayRegistry.register('shopify', {
    name: 'Shopify',
    description: 'Gateway de integração com lojas Shopify',
    constructor: ShopifyGateway,
    configSchema: {
        required: ['webhookSecret', 'clientId', 'gatewayId'],
        optional: ['apiKey', 'apiUrl', 'shopDomain']
    }
});
