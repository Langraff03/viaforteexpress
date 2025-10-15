import crypto from 'crypto';
/**
 * Gateway para integração com Shopify
 */
export class ShopifyGateway {
    constructor(config) {
        this.config = config;
    }
    /**
     * Criar cliente - Não aplicável para Shopify (clientes são gerenciados pela própria Shopify)
     */
    async createCustomer(data) {
        throw new Error('ShopifyGateway: createCustomer não é suportado. Clientes são gerenciados pela Shopify.');
    }
    /**
     * Criar pagamento - Não aplicável para Shopify (pagamentos são processados pela Shopify)
     */
    async createPayment(data) {
        throw new Error('ShopifyGateway: createPayment não é suportado. Pagamentos são processados pela Shopify.');
    }
    /**
     * Buscar pagamento - Implementação futura usando Shopify Admin API
     */
    async getPayment(paymentId) {
        console.warn(`[ShopifyGateway] getPayment não implementado ainda para paymentId: ${paymentId}`);
        return null;
    }
    /**
     * Cancelar pagamento - Implementação futura usando Shopify Admin API
     */
    async cancelPayment(paymentId) {
        console.warn(`[ShopifyGateway] cancelPayment não implementado ainda para paymentId: ${paymentId}`);
        return null;
    }
    /**
     * Processa webhook da Shopify (foco principal desta integração)
     * Baseado na documentação oficial: https://shopify.dev/docs/api/admin-rest/2024-01/resources/webhook#event-topics
     */
    async processWebhook(payload, headers) {
        console.log('[ShopifyGateway] 🛍️ Processando webhook da Shopify');
        console.log('[ShopifyGateway] 📦 Payload recebido:', JSON.stringify(payload, null, 2));
        try {
            // Verificar se é um webhook de pedido pago
            if (!this.isOrderPaidWebhook(payload)) {
                console.log('[ShopifyGateway] ⚠️ Webhook não é do tipo orders/paid, ignorando');
                return {
                    processed: false,
                    eventType: 'orders/ignored',
                    error: 'Webhook não é do tipo orders/paid',
                    clientId: this.config.clientId,
                    gatewayId: this.config.gatewayId
                };
            }
            const order = payload;
            console.log(`[ShopifyGateway] ✅ Pedido pago identificado: ${order.name} (ID: ${order.id})`);
            console.log(`[ShopifyGateway] 💰 Valor total: ${order.total_price} ${order.currency}`);
            console.log(`[ShopifyGateway] 👤 Cliente: ${order.customer?.first_name} ${order.customer?.last_name} (${order.email})`);
            // ✅ VALIDAÇÃO CRÍTICA: Só processar pedidos com endereço de entrega
            if (!order.shipping_address || !order.shipping_address.address1 || !order.shipping_address.city) {
                console.warn('[ShopifyGateway] ⚠️ Pedido sem endereço de entrega completo, ignorando');
                console.log('[ShopifyGateway] 📍 Endereço recebido:', order.shipping_address);
                return {
                    processed: false,
                    eventType: 'orders/no_address',
                    error: 'Pedido sem endereço de entrega válido - sistema de rastreamento não aplicável',
                    clientId: this.config.clientId,
                    gatewayId: this.config.gatewayId
                };
            }
            // Extrair informações essenciais
            const paymentId = String(order.id);
            const orderId = String(order.id); // Usar o ID do pedido Shopify como orderId
            const newStatus = 'paid'; // Status normalizado para nosso sistema
            // Normalizar dados do cliente
            const customer = {
                name: order.customer
                    ? `${order.customer.first_name} ${order.customer.last_name}`.trim()
                    : 'Cliente Shopify',
                email: order.email,
                phone: order.customer?.phone || order.shipping_address?.phone,
                address: {
                    street: order.shipping_address.address1,
                    street2: order.shipping_address.address2,
                    city: order.shipping_address.city,
                    state: order.shipping_address.province,
                    zip: order.shipping_address.zip,
                    country: order.shipping_address.country
                }
            };
            // Normalizar endereço de entrega (garantido que existe pela validação acima)
            const shipping = {
                street: order.shipping_address.address1,
                street2: order.shipping_address.address2,
                city: order.shipping_address.city,
                state: order.shipping_address.province,
                zip: order.shipping_address.zip,
                country: order.shipping_address.country,
                phone: order.shipping_address.phone
            };
            // Normalizar itens do pedido
            const items = order.line_items?.map(item => ({
                name: item.title,
                quantity: item.quantity,
                price: parseFloat(item.price) * 100, // Converter para centavos
                sku: item.sku,
                variant: item.variant_title,
                vendor: item.vendor,
                weight: item.grams,
                product_id: item.product_id,
                variant_id: item.variant_id
            })) || [];
            // Calcular valor total em centavos
            const totalAmount = Math.round(parseFloat(order.total_price) * 100);
            console.log(`[ShopifyGateway] 📊 Dados normalizados:`);
            console.log(`[ShopifyGateway] - Cliente: ${customer.name} (${customer.email})`);
            console.log(`[ShopifyGateway] - Endereço: ${shipping.city}, ${shipping.state} ✅`);
            console.log(`[ShopifyGateway] - Total: R$ ${(totalAmount / 100).toFixed(2)}`);
            console.log(`[ShopifyGateway] - Itens: ${items.length} produto(s)`);
            return {
                processed: true,
                eventType: 'orders/paid',
                paymentId: paymentId,
                orderId: orderId,
                newStatus: newStatus,
                clientId: this.config.clientId,
                gatewayId: this.config.gatewayId,
                originalPayload: {
                    ...order,
                    amount: totalAmount // Adicionar valor em centavos para compatibilidade
                },
                customer: customer,
                shipping: shipping,
                items: items,
                // Dados específicos da Shopify
                shopifyOrderNumber: order.order_number,
                shopifyFinancialStatus: order.financial_status,
                shopifyFulfillmentStatus: order.fulfillment_status,
                currency: order.currency,
                createdAt: order.created_at
            };
        }
        catch (error) {
            console.error('[ShopifyGateway] ❌ Erro ao processar webhook:', error);
            return {
                processed: false,
                eventType: 'error',
                error: `Erro ao processar webhook da Shopify: ${error.message}`,
                clientId: this.config.clientId,
                gatewayId: this.config.gatewayId
            };
        }
    }
    /**
     * Valida assinatura HMAC do webhook da Shopify
     */
    validateWebhookSignature(rawPayload, signatureHeader, configuredSecret) {
        const webhookSecret = configuredSecret || this.config.webhookSecret;
        if (!webhookSecret) {
            console.warn('[ShopifyGateway] ⚠️ Webhook secret não configurado');
            return false;
        }
        if (!signatureHeader) {
            console.warn('[ShopifyGateway] ⚠️ Header X-Shopify-Hmac-Sha256 não encontrado');
            return false;
        }
        try {
            // Shopify envia a assinatura no formato base64
            const receivedSignature = signatureHeader;
            // Calcular HMAC SHA256 do payload
            const body = typeof rawPayload === 'string' ? rawPayload : rawPayload.toString('utf8');
            const calculatedSignature = crypto
                .createHmac('sha256', webhookSecret)
                .update(body, 'utf8')
                .digest('base64');
            console.log(`[ShopifyGateway] 🔐 Validando assinatura HMAC`);
            console.log(`[ShopifyGateway] - Recebida: ${receivedSignature.substring(0, 20)}...`);
            console.log(`[ShopifyGateway] - Calculada: ${calculatedSignature.substring(0, 20)}...`);
            // Comparação segura usando timingSafeEqual
            const receivedBuffer = Buffer.from(receivedSignature, 'base64');
            const calculatedBuffer = Buffer.from(calculatedSignature, 'base64');
            if (receivedBuffer.length !== calculatedBuffer.length) {
                console.warn('[ShopifyGateway] ❌ Tamanhos de assinatura diferentes');
                return false;
            }
            const isValid = crypto.timingSafeEqual(receivedBuffer, calculatedBuffer);
            if (isValid) {
                console.log('[ShopifyGateway] ✅ Assinatura HMAC válida');
            }
            else {
                console.warn('[ShopifyGateway] ❌ Assinatura HMAC inválida');
            }
            return isValid;
        }
        catch (error) {
            console.error('[ShopifyGateway] ❌ Erro ao validar assinatura:', error.message);
            return false;
        }
    }
    /**
     * Verifica se o webhook é do tipo orders/paid
     */
    isOrderPaidWebhook(payload) {
        return (payload &&
            typeof payload === 'object' &&
            typeof payload.id === 'number' &&
            typeof payload.email === 'string' &&
            typeof payload.total_price === 'string' &&
            payload.financial_status === 'paid' &&
            Array.isArray(payload.line_items));
    }
}
