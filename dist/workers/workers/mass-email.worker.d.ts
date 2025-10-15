import { Worker } from 'bullmq';
import { MassEmailCampaignJobData, MassEmailBatchJobData } from '../lib/queue';
declare const massEmailWorker: Worker<MassEmailCampaignJobData | MassEmailBatchJobData, any, string>;
export { massEmailWorker };
