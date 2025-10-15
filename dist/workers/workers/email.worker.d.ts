import { Worker } from 'bullmq';
export interface EmailJobData {
    to: string;
    subject: string;
    template?: string;
    context: {
        order_id: string;
        customerName?: string;
        trackingCode?: string;
        trackingUrl?: string;
        [key: string]: any;
    };
    html?: string;
}
declare const emailWorker: Worker<EmailJobData, any, string>;
export default emailWorker;
