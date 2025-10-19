/**
 * Módulo para interagir com a API Admin da Shopify
 * Permite criar fulfillments e buscar fulfillment orders
 * Documentação: https://shopify.dev/docs/api/admin-rest
 */

// ============================================
// INTERFACES
// ============================================

export interface ShopifyAdminConfig {
  shop_url: string;           // Ex: "minhaloja.myshopify.com"
  api_access_token: string;   // Token da API Admin
  api_version?: string;       // Default: "2024-01"
}

export interface FulfillmentOrder {
  id: number;
  order_id: number;
  status: string;
  line_items: Array<{
    id: number;
    quantity: number;
    line_item_id: number;
  }>;
}

export interface FulfillmentLineItem {
  id: number;
  quantity: number;
}

export interface CreateFulfillmentParams {
  fulfillment_order_id: number;
  line_items: FulfillmentLineItem[];
  tracking_number: string;
  tracking_url: string;
  tracking_company: string;
  notify_customer?: boolean;
}

export interface ShopifyAPIError {
  errors?: any;
  message?: string;
  status?: number;
}

// ============================================
// CLASSE PRINCIPAL
// ============================================

export class ShopifyAdminAPI {
  private config: ShopifyAdminConfig;
  private baseUrl: string;

  constructor(config: ShopifyAdminConfig) {
    this.config = {
      ...config,
      api_version: config.api_version || '2024-01'
    };
    
    // Construir URL base: https://minhaloja.myshopify.com/admin/api/2024-01
    this.baseUrl = `https://${this.config.shop_url}/admin/api/${this.config.api_version}`;
    
    console.log(`[ShopifyAdminAPI] Inicializado para loja: ${this.config.shop_url}`);
  }

  /**
   * Busca fulfillment orders de um pedido específico
   * GET /admin/api/2024-01/orders/{order_id}/fulfillment_orders.json
   * 
   * @param shopifyOrderId - ID do pedido na Shopify
   * @returns Lista de fulfillment orders
   */
  async getFulfillmentOrders(shopifyOrderId: number): Promise<FulfillmentOrder[]> {
    const url = `${this.baseUrl}/orders/${shopifyOrderId}/fulfillment_orders.json`;
    
    console.log(`[ShopifyAdminAPI] Buscando fulfillment orders para pedido: ${shopifyOrderId}`);
    console.log(`[ShopifyAdminAPI] URL: ${url}`);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'X-Shopify-Access-Token': this.config.api_access_token,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[ShopifyAdminAPI] ❌ Erro ao buscar fulfillment orders:`, {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        throw new Error(`Shopify API Error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const fulfillmentOrders = data.fulfillment_orders || [];
      
      console.log(`[ShopifyAdminAPI] ✅ ${fulfillmentOrders.length} fulfillment order(s) encontrado(s)`);
      
      return fulfillmentOrders;
    } catch (error: any) {
      console.error(`[ShopifyAdminAPI] ❌ Erro na requisição:`, error.message);
      throw error;
    }
  }

  /**
   * Cria um fulfillment com informações de rastreamento
   * POST /admin/api/2024-01/fulfillments.json
   * 
   * @param params - Parâmetros do fulfillment
   * @returns Dados do fulfillment criado
   */
  async createFulfillment(params: CreateFulfillmentParams): Promise<any> {
    const url = `${this.baseUrl}/fulfillments.json`;
    
    console.log(`[ShopifyAdminAPI] Criando fulfillment...`);
    console.log(`[ShopifyAdminAPI] - Fulfillment Order ID: ${params.fulfillment_order_id}`);
    console.log(`[ShopifyAdminAPI] - Tracking: ${params.tracking_company} ${params.tracking_number}`);
    console.log(`[ShopifyAdminAPI] - Line Items: ${params.line_items.length} item(s)`);

    const body = {
      fulfillment: {
        line_items_by_fulfillment_order: [
          {
            fulfillment_order_id: params.fulfillment_order_id,
            fulfillment_order_line_items: params.line_items.map(item => ({
              id: item.id,
              quantity: item.quantity
            }))
          }
        ],
        tracking_info: {
          number: params.tracking_number,
          url: params.tracking_url,
          company: params.tracking_company
        },
        notify_customer: params.notify_customer ?? true
      }
    };

    console.log(`[ShopifyAdminAPI] Payload:`, JSON.stringify(body, null, 2));

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'X-Shopify-Access-Token': this.config.api_access_token,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(body)
      });

      const responseData = await response.json();

      if (!response.ok) {
        console.error(`[ShopifyAdminAPI] ❌ Erro ao criar fulfillment:`, {
          status: response.status,
          statusText: response.statusText,
          errors: responseData
        });
        
        throw new Error(
          `Shopify API Error: ${response.status} - ${JSON.stringify(responseData)}`
        );
      }

      console.log(`[ShopifyAdminAPI] ✅ Fulfillment criado com sucesso!`);
      console.log(`[ShopifyAdminAPI] - Fulfillment ID: ${responseData.fulfillment?.id}`);
      console.log(`[ShopifyAdminAPI] - Status: ${responseData.fulfillment?.status}`);
      
      return responseData;
    } catch (error: any) {
      console.error(`[ShopifyAdminAPI] ❌ Erro na requisição:`, error.message);
      throw error;
    }
  }

  /**
   * Valida se a configuração da API está correta
   * Faz uma chamada simples para verificar conectividade
   */
  async validateConnection(): Promise<boolean> {
    try {
      const url = `${this.baseUrl}/shop.json`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'X-Shopify-Access-Token': this.config.api_access_token,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`[ShopifyAdminAPI] ✅ Conexão validada com loja: ${data.shop?.name}`);
        return true;
      }

      console.error(`[ShopifyAdminAPI] ❌ Falha na validação: ${response.status}`);
      return false;
    } catch (error: any) {
      console.error(`[ShopifyAdminAPI] ❌ Erro na validação:`, error.message);
      return false;
    }
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Extrai line items de um fulfillment order para usar no fulfillment
 */
export function extractLineItemsFromFulfillmentOrder(
  fulfillmentOrder: FulfillmentOrder
): FulfillmentLineItem[] {
  return fulfillmentOrder.line_items.map(item => ({
    id: item.id,
    quantity: item.quantity
  }));
}

/**
 * Verifica se um fulfillment order pode ser processado
 */
export function canFulfillOrder(fulfillmentOrder: FulfillmentOrder): boolean {
  // Apenas processar se o status permitir
  const allowedStatuses = ['open', 'in_progress'];
  return allowedStatuses.includes(fulfillmentOrder.status.toLowerCase());
}