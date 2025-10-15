import { Worker } from 'bullmq';
export interface PaymentCreationJobData {
    orderId: string;
    clientId: string;
    gatewayType: string;
    amount: number;
    dueDate: string;
    customer: {
        name: string;
        email: string;
        phone?: string;
    };
    description: string;
}
declare const paymentCreationWorker: Worker<PaymentCreationJobData, any, string>;
export default paymentCreationWorker;
