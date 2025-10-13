import './email.worker';
import './tracking.worker';
import './payment.worker';
import './payment-webhook.worker';
import './lead.worker';
import './mass-email.worker';

console.log('Workers iniciados (incluindo Mass Email Worker para campanhas 20K+)');

// Tratamento global de erros não tratados para prevenir crashes silenciosos
process.on('uncaughtException', (error) => {
  console.error('❌ ERRO NÃO TRATADO (uncaughtException):', error);
  console.error('Stack trace:', error.stack);
  // Não encerrar o processo, apenas logar o erro
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ PROMISE REJEITADA NÃO TRATADA (unhandledRejection):', reason);
  console.error('Promise:', promise);
  // Não encerrar o processo, apenas logar o erro
});

// Tratamento de sinais para graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Recebido SIGTERM, encerrando workers gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Recebido SIGINT, encerrando workers gracefully...');
  process.exit(0);
});