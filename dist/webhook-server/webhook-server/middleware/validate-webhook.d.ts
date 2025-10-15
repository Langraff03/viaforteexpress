import { Request, Response, NextFunction } from 'express';
export declare const validateWebhookRequest: () => (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
declare global {
    namespace Express {
        interface Request {
            gatewayInfo?: {
                clientId: string;
                gatewayType: string;
                webhookSecret: string;
            };
        }
    }
}
