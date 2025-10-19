/**
 * Módulo auxiliar para processar fulfillments na Shopify
 * Orquestra a chamada à API Admin para criar fulfillments
 */

import { 
  ShopifyAdminAPI, 
  ShopifyAdminConfig,
  extractLineItemsFromFulfillmentOrder,
  canFulfillOrder
} from './shopifyAdminAPI';

// ============================================
// INTERFACES
// ============================================

export interface ProcessFulfillmentParams {
  shopifyOrderId: number;
  trackingCode: string;
  trackingUrl: string;
  config: ShopifyAdminConfig;
  trackingCompany: string;
  lineItems?: any[];  // Itens do pedido (opcional, será buscado se não fornecido)
}

export interface FulfillmentResult {
  success: boolean;
  fulfillmentId?: number;
  error?: string;
}

// ============================================
// FUNÇÃO PRINCIPAL
// ============================================

/**
 * Processa fulfillment automático na Shopify
 * 
 * 1. Busca fulfillment orders do pedido
 * 2. Valida se pode ser processado
 * 3. Cria fulfillment com tracking info
 * 4. Shopify envia email ao cliente automaticamente
 * 
 * @param params - Parâmetros do fulfillment
 * @returns Resultado do processamento
 */
export async function processShopifyFulfillment(
  params: ProcessFulfillmentParams
): Promise<FulfillmentResult> {
  console.log(`\n[ShopifyFulfillment] 📦 Iniciando processamento automático...`);
  console.log(`[ShopifyFulfillment] - Pedido Shopify ID: ${params.shopifyOrderId}`);
  console.log(`[ShopifyFulfillment] - Código Rastreamento: ${params.trackingCode}`);
  console.log(`[ShopifyFulfillment] - Transportadora: ${params.trackingCompany}`);

  try {
    // Passo 1: Criar instância da API
    const api = new ShopifyAdminAPI(params.config);
    
    // Passo 2: Buscar fulfillment orders
    console.log(`[ShopifyFulfillment] 🔍 Buscando fulfillment orders...`);
    const fulfillmentOrders = await api.getFulfillmentOrders(params.shopifyOrderId);
    
    if (!fulfillmentOrders || fulfillmentOrders.length === 0) {
      const errorMsg = 'Nenhuma ordem de envio encontrada para este pedido';
      console.error(`[ShopifyFulfillment] ❌ ${errorMsg}`);
      return {
        success: false,
        error: errorMsg
      };
    }

    console.log(`[ShopifyFulfillment] ✅ ${fulfillmentOrders.length} fulfillment order(s) encontrado(s)`);

    // Passo 3: Processar o primeiro fulfillment order disponível
    const fulfillmentOrder = fulfillmentOrders[0];
    
    // Validar se pode ser processado
    if (!canFulfillOrder(fulfillmentOrder)) {
      const errorMsg = `Fulfillment order com status '${fulfillmentOrder.status}' não pode ser processado`;
      console.warn(`[ShopifyFulfillment] ⚠️ ${errorMsg}`);
      return {
        success: false,
        error: errorMsg
      };
    }

    console.log(`[ShopifyFulfillment] ✅ Fulfillment order ID: ${fulfillmentOrder.id} (status: ${fulfillmentOrder.status})`);

    // Passo 4: Extrair line items
    const lineItems = extractLineItemsFromFulfillmentOrder(fulfillmentOrder);
    console.log(`[ShopifyFulfillment] 📦 ${lineItems.length} item(s) para processar`);

    // Passo 5: Criar fulfillment
    console.log(`[ShopifyFulfillment] 🚀 Criando fulfillment na Shopify...`);
    
    const fulfillmentResponse = await api.createFulfillment({
      fulfillment_order_id: fulfillmentOrder.id,
      line_items: lineItems,
      tracking_number: params.trackingCode,
      tracking_url: params.trackingUrl,
      tracking_company: params.trackingCompany,
      notify_customer: true  // ⭐ Shopify enviará email ao cliente
    });

    const fulfillmentId = fulfillmentResponse.fulfillment?.id;
    
    console.log(`[ShopifyFulfillment] ✅ Fulfillment criado com sucesso!`);
    console.log(`[ShopifyFulfillment] - Fulfillment ID: ${fulfillmentId}`);
    console.log(`[ShopifyFulfillment] - Status: ${fulfillmentResponse.fulfillment?.status}`);
    console.log(`[ShopifyFulfillment] 📧 Shopify enviará email de confirmação ao cliente\n`);

    return {
      success: true,
      fulfillmentId: fulfillmentId
    };

  } catch (error: any) {
    console.error(`[ShopifyFulfillment] ❌ Erro ao processar fulfillment:`, error.message);
    console.error(`[ShopifyFulfillment] Stack:`, error.stack);
    
    return {
      success: false,
      error: error.message || 'Erro desconhecido ao processar fulfillment'
    };
  }
}

/**
 * Valida se a configuração está completa para processar fulfillment
 */
export function validateFulfillmentConfig(config: any): boolean {
  if (!config) {
    console.warn(`[ShopifyFulfillment] ⚠️ Configuração não fornecida`);
    return false;
  }

  if (!config.shop_url) {
    console.warn(`[ShopifyFulfillment] ⚠️ shop_url não configurado`);
    return false;
  }

  if (!config.api_access_token) {
    console.warn(`[ShopifyFulfillment] ⚠️ api_access_token não configurado`);
    return false;
  }

  if (config.auto_fulfill === false) {
    console.log(`[ShopifyFulfillment] ℹ️ Auto-fulfill desativado pelo usuário`);
    return false;
  }

  return true;
}