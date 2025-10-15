// src/scripts/testPaymentFlow.ts
import { queuePaymentWebhook } from '../lib/queue';
async function main() {
    await queuePaymentWebhook({
        gateway: 'asset',
        event: 'payment.confirmed',
        payload: {
            id: 'TEST-PAYMENT-ID-123456',
            status: 'paid',
            order_id: 'Z-TESTORDER-001',
            customer_name: 'Lucas Teste',
            customer_email: 'lucaslangrafff@gmail.com',
            amount: 12345,
            customer: {
                address: {
                    street: 'Rua Teste',
                    city: 'Testópolis',
                    state: 'TS',
                    zipCode: '12345000'
                }
            },
            shipping: {
                address: {
                    street: 'Rua Teste',
                    city: 'Testópolis',
                    state: 'TS',
                    zipCode: '12345000'
                }
            }
        }
    });
    console.log('🚀 Job de pagamento de teste enfileirado com sucesso.');
}
main().catch(console.error);
