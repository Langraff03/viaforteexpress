// src/lib/payment.ts
import { assetApi } from './asset';
import { supabaseAdmin } from './server/supabaseAdmin'; // ✅ Backend seguro
export async function processPayment(orderId, amount, customer) {
    try {
        // 1. Create or get customer in Asset
        const customerResponse = await assetApi.createCustomer({
            name: customer.name,
            email: customer.email,
            mobilePhone: customer.phone,
        });
        // 2. Create payment (status é obrigatório no tipo AssetPayment)
        const payment = await assetApi.createPayment({
            customer: customerResponse.id,
            value: amount,
            dueDate: new Date().toISOString().split('T')[0], // hoje
            description: `Pedido #${orderId}`,
            status: 'PENDING', // status inicial padrão
        });
        // 3. Update order with payment info
        const { error } = await supabaseAdmin
            .from('orders')
            .update({
            payment_id: payment.id,
            payment_status: payment.status,
        })
            .eq('id', orderId);
        if (error) {
            console.error('Erro ao atualizar pedido:', error);
            throw error;
        }
        return payment;
    }
    catch (err) {
        console.error('Error processing payment:', err);
        throw err;
    }
}
//# sourceMappingURL=payment.js.map