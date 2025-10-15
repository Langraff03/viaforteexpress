import { PaymentGateway } from './GatewayInterface';
/**
 * Seleciona um gateway de pagamento com base no clientId e tipo.
 * Busca as configurações do gateway no banco de dados.
 *
 * @param clientId - UUID do cliente
 * @param type - Tipo do gateway ('asset', 'mercadopago', 'stripe', etc.)
 * @returns Uma instância do gateway configurado
 * @throws Error se o gateway não for encontrado ou não estiver configurado
 */
export declare function selectGateway(clientId: string, type: string): Promise<PaymentGateway>;
/**
 * Busca todos os gateways ativos para um cliente.
 *
 * @param clientId - UUID do cliente
 * @returns Array de objetos com informações dos gateways
 */
export declare function getClientGateways(clientId: string): Promise<{
    id: any;
    type: any;
    is_active: any;
    created_at: any;
    updated_at: any;
}[]>;
/**
 * Função de compatibilidade para código legado.
 * Usa o primeiro gateway 'asset' ativo encontrado para o cliente.
 *
 * @deprecated Use selectGateway(clientId, type) instead
 * @param clientId - UUID do cliente
 * @returns Uma instância do gateway
 */
export declare function getGatewayForClient(clientId: string): Promise<PaymentGateway>;
