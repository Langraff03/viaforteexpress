import { Worker } from 'bullmq';
import { InternalLeadJobData, ExternalLeadJobData, LeadEmailJobData } from '../lib/queue';
declare const internalLeadWorker: Worker<InternalLeadJobData, any, string>;
declare const externalLeadWorker: Worker<ExternalLeadJobData, any, string>;
declare const leadEmailWorker: Worker<LeadEmailJobData, any, string>;
export declare function processCSVFile(filePath: string, clientId: string, ofertaConfig: any): Promise<{
    success: boolean;
    totalLeads: number;
}>;
export declare function processJSONFile(filePath: string, clientId: string, ofertaConfig: any): Promise<{
    success: boolean;
    totalLeads: number;
}>;
export { internalLeadWorker, externalLeadWorker, leadEmailWorker };
