import { Request, Response } from 'express';
export declare const getConfig: (_req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const saveConfig: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const testEmailConfig: (req: Request, res: Response) => Promise<void>;
export declare const testGatewayConfig: (req: Request, res: Response) => Promise<void>;
