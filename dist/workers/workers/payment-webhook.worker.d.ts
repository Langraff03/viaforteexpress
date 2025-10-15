import { Worker } from 'bullmq';
export interface PaymentWebhookJobData {
    gateway: string;
    event: string;
    payload: {
        id: string;
        customer_email: string;
        customer_name: string;
        amount: number;
        order_id?: string;
        client_id?: string;
        gateway_id?: string;
        is_physical_product?: boolean;
        has_shipping_address?: boolean;
        shipping?: {
            address?: {
                street?: string;
                number?: string;
                city?: string;
                state?: string;
                zipCode?: string;
                country?: string;
            };
        };
        customer?: {
            address?: {
                street?: string;
                number?: string;
                city?: string;
                state?: string;
                zipCode?: string;
                country?: string;
            };
        };
    };
}
declare const paymentWebhookWorker: Worker<PaymentWebhookJobData, any, string>;
export default paymentWebhookWorker;
