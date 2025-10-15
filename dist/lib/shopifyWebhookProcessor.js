/**
 * Processador de webhooks da Shopify
 * Shopify não é um gateway de pagamento, é uma integração de e-commerce
 */
import crypto from 'crypto';
/**
 * Classe para processar webhooks da Shopify
 */
export class ShopifyWebhookProcessor {
    /**
     * Valida assinatura HMAC do webhook da Shopify
     */
    static validateWebhookSignature(rawPayload, signatureHeader, webhookSecret) {
        if (!webhookSecret) {
            console.warn('[ShopifyProcessor] ⚠️ Webhook secret não configurado');
            return false;
        }
        if (!signatureHeader) {
            console.warn('[ShopifyProcessor] ⚠️ Header X-Shopify-Hmac-Sha256 não encontrado');
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
            console.log(`[ShopifyProcessor] 🔐 Validando assinatura HMAC`);
            console.log(`[ShopifyProcessor] - Recebida: ${receivedSignature.substring(0, 20)}...`);
            console.log(`[ShopifyProcessor] - Calculada: ${calculatedSignature.substring(0, 20)}...`);
            // Comparação segura usando timingSafeEqual
            const receivedBuffer = Buffer.from(receivedSignature, 'base64');
            const calculatedBuffer = Buffer.from(calculatedSignature, 'base64');
            if (receivedBuffer.length !== calculatedBuffer.length) {
                console.warn('[ShopifyProcessor] ❌ Tamanhos de assinatura diferentes');
                return false;
            }
            const isValid = crypto.timingSafeEqual(receivedBuffer, calculatedBuffer);
            if (isValid) {
                console.log('[ShopifyProcessor] ✅ Assinatura HMAC válida');
            }
            else {
                console.warn('[ShopifyProcessor] ❌ Assinatura HMAC inválida');
            }
            return isValid;
        }
        catch (error) {
            console.error('[ShopifyProcessor] ❌ Erro ao validar assinatura:', error.message);
            return false;
        }
    }
    /**
     * Processa webhook da Shopify do evento orders/paid
     */
    static async processOrderPaidWebhook(payload) {
        console.log('[ShopifyProcessor] 🛍️ Processando webhook orders/paid da Shopify');
        try {
            // Verificar se é um webhook de pedido pago
            if (!this.isOrderPaidWebhook(payload)) {
                console.log('[ShopifyProcessor] ⚠️ Webhook não é do tipo orders/paid, ignorando');
                return {
                    processed: false,
                    error: 'Webhook não é do tipo orders/paid'
                };
            }
            const order = payload;
            console.log(`[ShopifyProcessor] ✅ Pedido pago identificado: ${order.name} (ID: ${order.id})`);
            console.log(`[ShopifyProcessor] 💰 Valor total: ${order.total_price} ${order.currency}`);
            console.log(`[ShopifyProcessor] 👤 Cliente: ${order.customer?.first_name} ${order.customer?.last_name} (${order.email})`);
            // ✅ VALIDAÇÃO CRÍTICA: Só processar pedidos com endereço de entrega
            if (!order.shipping_address || !order.shipping_address.address1 || !order.shipping_address.city) {
                console.warn('[ShopifyProcessor] ⚠️ Pedido sem endereço de entrega completo, ignorando');
                console.log('[ShopifyProcessor] 📍 Endereço recebido:', order.shipping_address);
                return {
                    processed: false,
                    error: 'Pedido sem endereço de entrega válido - sistema de rastreamento não aplicável'
                };
            }
            // Normalizar dados do cliente
            const customerName = order.customer
                ? `${order.customer.first_name} ${order.customer.last_name}`.trim()
                : 'Cliente Shopify';
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
                vendor: item.vendor
            })) || [];
            // Calcular valor total em centavos
            const totalAmount = Math.round(parseFloat(order.total_price) * 100);
            console.log(`[ShopifyProcessor] 📊 Dados normalizados:`);
            console.log(`[ShopifyProcessor] - Cliente: ${customerName} (${order.email})`);
            console.log(`[ShopifyProcessor] - Endereço: ${shipping.city}, ${shipping.state} ✅`);
            console.log(`[ShopifyProcessor] - Total: R$ ${(totalAmount / 100).toFixed(2)}`);
            console.log(`[ShopifyProcessor] - Itens: ${items.length} produto(s)`);
            return {
                processed: true,
                order: {
                    id: String(order.id),
                    customer_name: customerName,
                    customer_email: order.email,
                    amount: totalAmount,
                    shipping: shipping,
                    items: items,
                    shopify_order_number: order.order_number,
                    shopify_financial_status: order.financial_status,
                    shopify_fulfillment_status: order.fulfillment_status,
                    currency: order.currency,
                    created_at: order.created_at
                }
            };
        }
        catch (error) {
            console.error('[ShopifyProcessor] ❌ Erro ao processar webhook:', error);
            return {
                processed: false,
                error: `Erro ao processar webhook da Shopify: ${error.message}`
            };
        }
    }
    /**
     * Verifica se o webhook é do tipo orders/paid
     */
    static isOrderPaidWebhook(payload) {
        return (payload &&
            typeof payload === 'object' &&
            typeof payload.id === 'number' &&
            typeof payload.email === 'string' &&
            typeof payload.total_price === 'string' &&
            payload.financial_status === 'paid' &&
            Array.isArray(payload.line_items));
    }
}
