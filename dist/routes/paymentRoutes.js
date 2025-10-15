import { Router } from 'express';
import { queuePaymentCreation } from '../lib/queue';
import { supabaseAdmin } from '../lib/server/supabaseAdmin'; // ✅ Backend seguro // For creating an initial order record
const router = Router();
router.post('/create-payment', async (req, res) => {
    try {
        const { clientId, gatewayId, items, customer, orderId: clientSuppliedOrderId } = req.body;
        if (!clientId || !gatewayId || !items || !items.length || !customer || !customer.email) {
            return res.status(400).json({ error: 'Missing required fields: clientId, gatewayId, items, customer details.' });
        }
        // 1. Calculate total amount
        const totalAmount = items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
        if (totalAmount <= 0) {
            return res.status(400).json({ error: 'Total amount must be greater than zero.' });
        }
        // 2. (Optional but Recommended) Create an initial order record in your database
        let localOrderId = clientSuppliedOrderId;
        if (!localOrderId) {
            const { data: newOrder, error: orderError } = await supabaseAdmin
                .from('orders')
                .insert({
                client_id: clientId,
                gateway_id: gatewayId,
                customer_name: customer.name,
                customer_email: customer.email,
                amount: totalAmount,
                payment_status: 'PENDING_GATEWAY',
            })
                .select('id')
                .single();
            if (orderError) {
                console.error('Error creating initial order in Supabase:', orderError);
                return res.status(500).json({ error: 'Failed to initialize order.' });
            }
            localOrderId = newOrder.id;
            console.log(`📝 Initial order record created with ID: ${localOrderId}`);
        }
        else {
            console.log(`📝 Using client-supplied order ID: ${localOrderId}`);
        }
        // 3. Prepare job data for the payment creation queue
        const jobData = {
            orderId: localOrderId,
            clientId,
            amount: totalAmount,
            dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
            customer: {
                name: customer.name,
                email: customer.email,
                phone: customer.phone,
            },
            description: `Pedido ${localOrderId} para ${customer.name}`,
        };
        // 4. Enqueue the payment creation job
        const job = await queuePaymentCreation(jobData);
        console.log(`🚀 Payment creation job enqueued with ID: ${job.id} for order ${localOrderId}`);
        // 5. Respond to the client
        return res.status(202).json({
            message: 'Payment processing initiated.',
            orderId: localOrderId,
            jobId: job.id
        });
    }
    catch (error) {
        console.error('Error in /create-payment route:', error);
        return res.status(500).json({ error: 'Internal server error while initiating payment.' });
    }
});
export default router;
// You would then use this router in your main Express app file:
// import paymentApiRoutes from './routes/paymentRoutes';
// app.use('/api/payments', paymentApiRoutes); // Example base path
