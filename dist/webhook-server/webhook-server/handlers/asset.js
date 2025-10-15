import { queuePaymentWebhook } from '../../lib/queue';
import { supabaseAdmin } from '../../lib/server/supabaseAdmin';
export const assetWebhookHandler = async (req, res) => {
    console.log('[AssetWebhook] Recebido POST', req.method, req.originalUrl);
    console.log('[AssetWebhook] Body:', JSON.stringify(req.body, null, 2));
    try {
        const payload = req.body;
        // Extrair client_id da query string ou usar um valor padrão
        let clientId = req.query.client_id || 'default';
        // Se for "default", substituir por um UUID válido
        if (clientId === 'default') {
            clientId = '747e0d51-609f-4102-9927-d3685edd83bf'; // UUID válido do cliente padrão
            console.warn('[AssetWebhook] client_id não fornecido na query string, usando UUID do cliente padrão');
        }
        else if (!req.query.client_id) {
            console.warn('[AssetWebhook] client_id não fornecido na query string, usando valor fornecido');
        }
        if (payload.data.status !== 'paid') {
            console.log('[AssetWebhook] Ignorando status:', payload.data.status);
            return res.status(200).json({ received: true, message: 'Status ignorado' });
        }
        // Verificar se tem endereço de entrega (shipping ou customer.address)
        const hasShippingAddress = !!(payload.data.shipping?.address?.street ||
            payload.data.customer?.address?.street);
        if (!hasShippingAddress) {
            console.log('[AssetWebhook] ⚠️ Pedido sem endereço (infoproduto) - salvando no banco mas sem enviar email');
        }
        else {
            console.log('[AssetWebhook] ✅ Pedido com endereço (produto físico) - salvando no banco e enviando email');
        }
        const d = payload.data;
        const paymentId = String(d.id);
        const amount = d.amount;
        const customerName = d.customer.name;
        const customerEmail = d.customer.email;
        // Extrair order_id dos metadados
        let orderId = null;
        try {
            if (d.metadata) {
                const metadata = JSON.parse(d.metadata);
                orderId = metadata.order_id;
                console.log('[AssetWebhook] Metadados extraídos:', { orderId });
            }
        }
        catch (err) {
            console.error('[AssetWebhook] Erro ao parsear metadata:', err);
        }
        // Se não encontrou orderId no metadata, tenta usar externalReference
        if (!orderId && d.externalReference) {
            orderId = d.externalReference;
        }
        // Se ainda não temos orderId, usar o secureId ou o próprio paymentId
        if (!orderId && d.secureId) {
            orderId = d.secureId;
        }
        else if (!orderId) {
            orderId = paymentId;
        }
        if (!paymentId || amount == null || !customerEmail) {
            console.warn('[AssetWebhook] Dados inválidos em payload.data:', d);
            return res.status(200).json({ received: true, warning: 'payload inválido' });
        }
        // Verificar se o produto é físico (não é do tipo "info")
        // Buscar informações do pedido no banco de dados
        let isPhysicalProduct = true; // Assume que é produto físico por padrão
        if (orderId) {
            const { data: orderData, error: orderError } = await supabaseAdmin
                .from('orders')
                .select('product_type, is_physical')
                .eq('id', orderId)
                .single();
            if (!orderError && orderData) {
                // Se o produto for do tipo "info" ou is_physical for false, não envia email
                if (orderData.product_type === 'info' || orderData.is_physical === false) {
                    isPhysicalProduct = false;
                    console.log('[AssetWebhook] Ignorando produto não físico ou do tipo info:', orderData.product_type);
                    return res.status(200).json({ received: true, message: 'Produto não físico ou do tipo info' });
                }
            }
        }
        console.log('[AssetWebhook] Pagamento confirmado para order_id:', orderId);
        // ✅ SEMPRE enfileirar para salvar no banco com CPF/telefone
        // O payment-webhook.worker.ts decidirá se envia email baseado no endereço
        await queuePaymentWebhook({
            gateway: 'asset',
            event: 'payment.confirmed',
            payload: {
                id: paymentId,
                customer_email: customerEmail,
                customer_name: customerName,
                amount: amount,
                order_id: orderId,
                external_ref: d.externalReference,
                secure_id: d.secureId,
                is_physical_product: hasShippingAddress, // ✅ Indicar se é produto físico
                // Enviando endereço completo para o payment-webhook.worker.ts
                shipping: d.shipping,
                customer: {
                    address: d.customer?.address,
                    phone: d.customer?.phone, // ✅ ADICIONAR TELEFONE
                    document: d.customer?.document // ✅ ADICIONAR CPF
                }
            }
        });
        if (hasShippingAddress) {
            console.log('[AssetWebhook] ✅ Job enfileirado para produto físico (com email):', paymentId);
        }
        else {
            console.log('[AssetWebhook] ✅ Job enfileirado para infoproduto (sem email):', paymentId);
        }
        return res.status(200).json({ received: true });
    }
    catch (err) {
        console.error('[AssetWebhook] ❌ Erro interno:', err);
        return res.status(500).json({ error: err.message || 'Erro interno' });
    }
};
//# sourceMappingURL=asset.js.map