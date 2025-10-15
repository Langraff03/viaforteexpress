import { AssetGateway } from './AssetGateway';
import { GatewayRegistry } from './GatewayRegistry';
import { supabaseAdmin } from '../server/supabaseAdmin';
/**
 * Seleciona um gateway de pagamento com base no clientId e tipo.
 * Busca as configurações do gateway no banco de dados.
 *
 * @param clientId - UUID do cliente
 * @param type - Tipo do gateway ('asset', 'mercadopago', 'stripe', etc.)
 * @returns Uma instância do gateway configurado
 * @throws Error se o gateway não for encontrado ou não estiver configurado
 */
export async function selectGateway(clientId, type) {
    console.log(`[GatewaySelector] Selecionando gateway do tipo ${type} para cliente ${clientId}`);
    // Verificar se o tipo de gateway está registrado
    if (!GatewayRegistry.isRegistered(type)) {
        const availableTypes = GatewayRegistry.getAvailableGateways();
        throw new Error(`Gateway tipo '${type}' não está registrado. Tipos disponíveis: ${availableTypes.join(', ')}`);
    }
    // Buscar configuração do gateway no banco de dados
    const { data: gatewayData, error } = await supabaseAdmin
        .from('gateways')
        .select('id, client_id, type, config, is_active')
        .eq('client_id', clientId)
        .eq('type', type)
        .eq('is_active', true)
        .single();
    if (error || !gatewayData) {
        console.error(`[GatewaySelector] Erro ao buscar configuração do gateway para cliente ${clientId}, tipo ${type}:`, error);
        throw new Error(`Configuração do gateway não encontrada para cliente ${clientId} e tipo ${type}`);
    }
    // Preparar configuração baseada no tipo do gateway
    const config = prepareGatewayConfig(type, gatewayData);
    // Criar instância usando o registry
    try {
        const gateway = GatewayRegistry.createGateway(type, config);
        console.log(`[GatewaySelector] Gateway ${type} criado com sucesso para cliente ${clientId}`);
        return gateway;
    }
    catch (error) {
        console.error(`[GatewaySelector] Erro ao criar gateway ${type}:`, error);
        throw error;
    }
}
/**
 * Prepara a configuração específica para cada tipo de gateway
 * @param type Tipo do gateway
 * @param gatewayData Dados do gateway do banco de dados
 * @returns Configuração formatada para o gateway
 */
function prepareGatewayConfig(type, gatewayData) {
    const baseConfig = {
        clientId: gatewayData.client_id,
        gatewayId: gatewayData.id,
        type: type
    };
    const dbConfig = gatewayData.config || {};
    switch (type.toLowerCase()) {
        case 'asset':
            const assetConfig = {
                ...baseConfig,
                apiKey: dbConfig.api_key || dbConfig.apiKey,
                apiUrl: dbConfig.api_url || dbConfig.apiUrl || 'https://api.asaas.com/v3',
                webhookSecret: dbConfig.webhook_secret || dbConfig.webhookSecret
            };
            if (!assetConfig.apiKey) {
                throw new Error(`api_key não encontrada na configuração do gateway ${gatewayData.id}`);
            }
            if (!assetConfig.webhookSecret) {
                console.warn(`[GatewaySelector] webhook_secret não encontrado para gateway ${gatewayData.id}. A validação pode falhar.`);
            }
            return assetConfig;
        case 'mercadopago':
            return {
                ...baseConfig,
                accessToken: dbConfig.access_token || dbConfig.accessToken,
                publicKey: dbConfig.public_key || dbConfig.publicKey,
                webhookSecret: dbConfig.webhook_secret || dbConfig.webhookSecret,
                sandboxMode: dbConfig.sandbox_mode || dbConfig.sandboxMode || false
            };
        case 'stripe':
            return {
                ...baseConfig,
                secretKey: dbConfig.secret_key || dbConfig.secretKey,
                publishableKey: dbConfig.publishable_key || dbConfig.publishableKey,
                webhookSecret: dbConfig.webhook_secret || dbConfig.webhookSecret,
                apiVersion: dbConfig.api_version || dbConfig.apiVersion
            };
        default:
            // Para gateways customizados, passar toda a configuração
            return {
                ...baseConfig,
                ...dbConfig
            };
    }
}
/**
 * Busca todos os gateways ativos para um cliente.
 *
 * @param clientId - UUID do cliente
 * @returns Array de objetos com informações dos gateways
 */
export async function getClientGateways(clientId) {
    const { data, error } = await supabaseAdmin
        .from('gateways')
        .select('id, type, is_active, created_at, updated_at')
        .eq('client_id', clientId)
        .eq('is_active', true);
    if (error) {
        console.error(`Error fetching gateways for client ${clientId}:`, error);
        throw new Error(`Failed to fetch gateways for client ${clientId}`);
    }
    return data || [];
}
/**
 * Função de compatibilidade para código legado.
 * Usa o primeiro gateway 'asset' ativo encontrado para o cliente.
 *
 * @deprecated Use selectGateway(clientId, type) instead
 * @param clientId - UUID do cliente
 * @returns Uma instância do gateway
 */
export async function getGatewayForClient(clientId) {
    try {
        // Tenta encontrar um gateway 'asset' para o cliente
        return await selectGateway(clientId, 'asset');
    }
    catch (error) {
        console.warn(`No Asset gateway found for client ${clientId}, using default fallback`);
        // Fallback para configuração padrão usando variáveis de ambiente
        const assetConfig = {
            apiKey: process.env.ASSET_API_KEY || 'admin_live_0JqhhCVNXuTwzhfQHiiFbYpUT7YyDNI35rY',
            apiUrl: process.env.ASSET_API_URL || 'https://api.asaas.com/v3',
            webhookSecret: process.env.ASSET_WEBHOOK_SECRET || '12b81c3b01e40506bef7c583f757fe9e4a028920ca3cf178530c94fbfb4ceb43',
            clientId: clientId, // Usa o ID do cliente da requisição
            gatewayId: '7e7e93d9-fc1a-4ae0-b7ab-775494d57cad' // ID do gateway Asset padrão
        };
        console.log(`[Gateway] Usando configuração de fallback para cliente ${clientId} com API key: ${assetConfig.apiKey?.substring(0, 10)}...`);
        return new AssetGateway(assetConfig);
    }
}
