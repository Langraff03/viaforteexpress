// src/scripts/testEmailFlow.ts
import { queuePaymentWebhook } from '../lib/queue';
import { supabaseAdmin } from '../lib/server/supabaseAdmin'; // ✅ Backend seguro
// Função para criar um pedido de teste no banco de dados
async function createTestOrder(orderData) {
    const { data, error } = await supabaseAdmin
        .from('orders')
        .upsert({
        id: orderData.id,
        product_type: orderData.product_type || 'physical',
        is_physical: orderData.is_physical !== undefined ? orderData.is_physical : true,
        customer_email: 'lucaslangrafff@gmail.com',
        customer_name: 'Lucas Teste',
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    })
        .select();
    if (error) {
        console.error('Erro ao criar pedido de teste:', error);
        throw error;
    }
    console.log(`✅ Pedido de teste criado: ${orderData.id}`);
    return data[0];
}
// Função para simular um webhook de pagamento confirmado
async function simulatePaymentWebhook(options) {
    const { orderId, hasShippingAddress, isPhysicalProduct } = options;
    // Criar o payload do webhook
    const webhookPayload = {
        gateway: 'asset',
        event: 'payment.confirmed',
        payload: {
            id: `TEST-PAYMENT-ID-${Date.now()}`,
            status: 'paid',
            order_id: orderId,
            customer_name: 'Lucas Teste',
            customer_email: 'lucaslangrafff@gmail.com',
            amount: 12345,
            client_id: 'test-client',
            gateway_id: 'test-gateway',
            is_physical_product: isPhysicalProduct,
            has_shipping_address: hasShippingAddress,
            customer: {
                address: hasShippingAddress ? {
                    street: 'Rua Teste',
                    city: 'Testópolis',
                    state: 'TS',
                    zipCode: '12345000'
                } : undefined
            },
            shipping: hasShippingAddress ? {
                address: {
                    street: 'Rua Teste',
                    city: 'Testópolis',
                    state: 'TS',
                    zipCode: '12345000'
                }
            } : undefined
        }
    };
    // Enfileirar o webhook
    await queuePaymentWebhook(webhookPayload);
    console.log(`🚀 Job de webhook de pagamento enfileirado para o pedido ${orderId}`);
}
async function main() {
    try {
        // Cenário 1: Pedido pago com endereço e produto físico (deve enviar email)
        const orderId1 = `TEST-ORDER-PHYSICAL-${Date.now()}`;
        await createTestOrder({
            id: orderId1,
            product_type: 'physical',
            is_physical: true
        });
        await simulatePaymentWebhook({
            orderId: orderId1,
            hasShippingAddress: true,
            isPhysicalProduct: true
        });
        console.log('✅ Cenário 1: Pedido pago com endereço e produto físico (deve enviar email)');
        // Aguardar um pouco antes de testar o próximo cenário
        await new Promise(resolve => setTimeout(resolve, 2000));
        // Cenário 2: Pedido pago sem endereço (não deve enviar email)
        const orderId2 = `TEST-ORDER-NO-ADDRESS-${Date.now()}`;
        await createTestOrder({
            id: orderId2,
            product_type: 'physical',
            is_physical: true
        });
        await simulatePaymentWebhook({
            orderId: orderId2,
            hasShippingAddress: false,
            isPhysicalProduct: true
        });
        console.log('✅ Cenário 2: Pedido pago sem endereço (não deve enviar email)');
        // Aguardar um pouco antes de testar o próximo cenário
        await new Promise(resolve => setTimeout(resolve, 2000));
        // Cenário 3: Pedido pago com produto do tipo "info" (não deve enviar email)
        const orderId3 = `TEST-ORDER-INFO-${Date.now()}`;
        await createTestOrder({
            id: orderId3,
            product_type: 'info',
            is_physical: false
        });
        await simulatePaymentWebhook({
            orderId: orderId3,
            hasShippingAddress: true,
            isPhysicalProduct: false
        });
        console.log('✅ Cenário 3: Pedido pago com produto do tipo "info" (não deve enviar email)');
        console.log('\n🎉 Todos os cenários de teste foram enfileirados com sucesso!');
        console.log('Verifique os logs dos workers para ver o resultado do processamento.');
        console.log('Emails devem ser enviados apenas para o Cenário 1.');
    }
    catch (error) {
        console.error('❌ Erro ao executar testes:', error);
    }
}
main().catch(console.error);
