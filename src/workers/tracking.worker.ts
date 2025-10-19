import { Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import { TrackingJobData, generateTrackingCode } from '../lib/queue';

// Redis connection
const connection = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT) || 6379,
  maxRetriesPerRequest: null,
});

const trackingWorker = new Worker('tracking', async (job) => {
  const { clientId, orderId } = job.data as TrackingJobData;

  try {
    // Gera o código de rastreio
    const trackingCode = generateTrackingCode(clientId);

    // Simula verificação de duplicidade
    const isDuplicate = Math.random() > 0.99; // 1% de chance de ser duplicado
    if (isDuplicate) {
      throw new Error('Código duplicado');
    }

    return { trackingCode, orderId };
  } catch (error) {
    console.error('Erro ao gerar código de rastreio:', error);
    throw error;
  }
}, { connection });

trackingWorker.on('completed', (job: Job<TrackingJobData> | undefined) => {
  if (job) {
    console.log(`Código de rastreio gerado: ${job.id}`);
  }
});

trackingWorker.on('failed', (job: Job<TrackingJobData> | undefined, error: Error) => {
  if (job) {
    console.error(`Falha ao gerar código de rastreio: ${job.id}`, error);
  }
});

export default trackingWorker;