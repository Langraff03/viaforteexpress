import { Worker } from 'bullmq';
declare const trackingWorker: Worker<any, any, string>;
export default trackingWorker;
