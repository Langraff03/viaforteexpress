import { type AssetPayment } from './asset';
export declare function processPayment(orderId: string, amount: number, customer: {
    name: string;
    email: string;
    phone?: string;
}): Promise<AssetPayment>;
