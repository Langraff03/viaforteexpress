import { PaymentGateway } from './GatewayInterface';
/**
 * Tipo para construtores de gateway
 */
type GatewayConstructor = new (config: any) => PaymentGateway;
/**
 * Informações sobre um gateway registrado
 */
interface GatewayInfo {
    name: string;
    description: string;
    constructor: GatewayConstructor;
    configSchema: any;
}
/**
 * Registry central para todos os gateways de pagamento
 * Permite registro dinâmico e instanciação de gateways
 */
declare class GatewayRegistryClass {
    private gateways;
    /**
     * Registra um novo gateway no sistema
     * @param type Tipo do gateway (ex: 'asset', 'mercadopago', 'stripe')
     * @param info Informações do gateway
     */
    register(type: string, info: GatewayInfo): void;
    /**
     * Cria uma instância de gateway baseada no tipo e configuração
     * @param type Tipo do gateway
     * @param config Configuração do gateway
     * @returns Instância do gateway
     */
    createGateway(type: string, config: any): PaymentGateway;
    /**
     * Verifica se um tipo de gateway está registrado
     * @param type Tipo do gateway
     * @returns true se estiver registrado
     */
    isRegistered(type: string): boolean;
    /**
     * Obtém informações sobre um gateway registrado
     * @param type Tipo do gateway
     * @returns Informações do gateway ou undefined
     */
    getGatewayInfo(type: string): GatewayInfo | undefined;
    /**
     * Lista todos os gateways registrados
     * @returns Array com os tipos de gateway disponíveis
     */
    getAvailableGateways(): string[];
    /**
     * Obtém informações detalhadas de todos os gateways
     * @returns Map com informações de todos os gateways
     */
    getAllGatewayInfo(): Map<string, GatewayInfo>;
    /**
     * Valida se uma configuração é válida para um tipo de gateway
     * @param type Tipo do gateway
     * @param config Configuração a ser validada
     * @returns true se válida, false caso contrário
     */
    validateConfig(type: string, config: any): boolean;
}
export declare const GatewayRegistry: GatewayRegistryClass;
export type { GatewayConstructor, GatewayInfo };
