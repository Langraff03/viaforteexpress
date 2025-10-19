import { Worker } from 'bullmq';
import Redis from 'ioredis';
import { supabaseAdmin } from '../lib/server/supabaseAdmin'; // ✅ Backend seguro
import { selectGateway } from '../lib/gateways/gatewaySelector';
// import { generateTrackingCode, queueEmail } from '../lib/queue'; // Keep if webhook processing remains here
// import { createOrder } from '../lib/orders'; // Keep if webhook processing remains here

// Define the expected job data structure for payment creation
export interface PaymentCreationJobData {
  orderId: string; // Your internal order ID, will be used to update the order
  clientId: string; // UUID do cliente para selecionar o gateway
  gatewayType: string; // Tipo do gateway a ser usado (deve ser 'asset')
  amount: number; // Amount in the smallest currency unit (e.g., cents) if required by gateway
  dueDate: string; // ISO Date string
  customer: {
    name: string;
    email: string;
    phone?: string;
    // document?: string; // CPF/CNPJ, if needed
    // address?: { // If needed for gateway customer creation
    //   street: string;
    //   number: string;
    //   complement?: string;
    //   zipCode: string;
    //   city: string;
    //   state: string; // UF
    //   country?: string;
    // };
  };
  description: string;
  // internalPaymentStatus?: string; // e.g. 'PENDING_CREATION'
  // any other data needed for payment creation by the specific gateway
}

// Redis connection (ensure these environment variables are set)
const connection = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT) || 6379,
  maxRetriesPerRequest: null, // Or a reasonable number
});

// Name of the queue this worker will process
const PAYMENT_CREATION_QUEUE_NAME = 'payment-creation';

const paymentCreationWorker = new Worker<PaymentCreationJobData>(
  PAYMENT_CREATION_QUEUE_NAME,
  async (job) => {
    const { orderId, clientId, gatewayType, amount, dueDate, customer, description } = job.data;
    console.log(`📦 Processing payment creation for orderId: ${orderId}, clientId: ${clientId}, gatewayType: ${gatewayType}`);

    try {
      // Selecionar o gateway com base no clientId e tipo
      const gateway = await selectGateway(clientId, gatewayType);

      // 1. Create customer in the gateway
      // Some gateways might not require explicit customer creation or do it within payment creation.
      // Adjust as per gateway needs.
      const gatewayCustomer = await gateway.createCustomer({
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        // Pass other customer details if the interface supports and gateway requires them
      });
      console.log(`👤 Customer created/retrieved in gateway: ${gatewayCustomer.id} for client ${clientId}`);

      // 2. Create payment in the gateway
      const payment = await gateway.createPayment({
        customer: gatewayCustomer.id, // Use ID from gateway's customer creation
        value: amount,
        dueDate,
        description: description || `Pedido ${orderId}`,
        status: 'PENDING', // Initial status for the gateway, it will update it
        // Pass any other required data for the specific gateway
      });
      console.log(`💳 Payment created in gateway: ${payment.id}, status: ${payment.status}`);

      // 3. Update your local order record (e.g., in Supabase) with gateway's payment ID and status
      const { data: updatedOrder, error: updateError } = await supabaseAdmin
        .from('orders') // Ensure this table exists and has these columns
        .update({
          payment_id: payment.id, // The ID returned by the payment gateway
          payment_status: payment.status, // The status returned by the payment gateway
          client_id: payment.clientId, // UUID do cliente
          gateway_id: payment.gatewayId, // UUID do gateway
          // updated_at: new Date().toISOString(), // Good practice
        })
        .eq('id', orderId) // Assuming 'id' is the primary key of your orders table
        .select()
        .single();

      if (updateError) {
        console.error(`❌ Error updating order ${orderId} in Supabase:`, updateError);
        // Decide on retry strategy or marking job as failed permanently
        throw new Error(`Failed to update order ${orderId} after payment creation: ${updateError.message}`);
      }

      console.log(`✅ Order ${orderId} updated successfully with paymentId: ${payment.id}, status: ${payment.status}, clientId: ${payment.clientId}, gatewayId: ${payment.gatewayId}`);

      // Optional: If the payment is immediately confirmed (e.g., some PIX payments)
      // and you want to trigger post-confirmation logic (like sending email) from here,
      // you could check payment.status. However, it's usually better to rely on webhooks for confirmation.
      // if (payment.status === 'PAID' || payment.status === 'CONFIRMED') {
      //   // ... trigger email sending, etc. ...
      //   // This part would be similar to the original worker's logic for 'payment.confirmed'
      // }

      return {
        success: true,
        paymentId: payment.id,
        paymentStatus: payment.status,
        clientId: payment.clientId,
        gatewayId: payment.gatewayId
      };
    } catch (error: any) {
      console.error(`❌ Error processing payment creation for orderId ${orderId}:`, error.message, error.stack);
      // Rethrow to let BullMQ handle retry logic based on queue settings
      throw error;
    }
  },
  { connection }
);

paymentCreationWorker.on('completed', (job, result) => {
  console.log(`✅ Payment creation job ${job.id} completed for order ${job.data.orderId}. Result:`, result);
});

paymentCreationWorker.on('failed', (job, err) => {
  console.error(`❌ Payment creation job ${job?.id} failed for order ${job?.data.orderId}:`, err.message, err.stack);
});

export default paymentCreationWorker;

// Note: The original `paymentWorker` logic that handles 'payment.confirmed' webhooks
// should likely be kept in a separate worker or integrated carefully if this worker
// is also meant to handle webhook events. The prompt focuses on the *creation* flow.
// If you have a `src/lib/queue.ts` that defines `PaymentJobData`, it will need to be updated
// or a new job type `PaymentCreationJobData` should be used for enqueueing.
