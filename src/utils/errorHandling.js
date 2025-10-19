/**
 * Utilitário para tratamento de erros com retry
 * Ajuda a evitar falhas em operações críticas devido a erros temporários
 */

/**
 * Executa uma operação com retry automático em caso de falha
 * @param {Function} operation - Função assíncrona a ser executada
 * @param {Object} options - Opções de configuração
 * @param {number} options.maxRetries - Número máximo de tentativas (padrão: 3)
 * @param {number} options.initialDelay - Delay inicial em ms (padrão: 1000)
 * @param {number} options.backoffFactor - Fator de aumento do delay (padrão: 2)
 * @param {Function} options.shouldRetry - Função que determina se deve tentar novamente (padrão: sempre)
 * @returns {Promise<any>} - Resultado da operação
 */
export async function executeWithRetry(operation, options = {}) {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    backoffFactor = 2,
    shouldRetry = () => true,
    onRetry = null
  } = options;

  let lastError;
  let delay = initialDelay;

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      // Se for a última tentativa, não tente novamente
      if (attempt > maxRetries || !shouldRetry(error, attempt)) {
        break;
      }

      // Log da tentativa falha
      console.warn(`Tentativa ${attempt}/${maxRetries + 1} falhou: ${error.message}. Tentando novamente em ${delay}ms...`);
      
      // Callback de retry (opcional)
      if (onRetry) {
        onRetry(error, attempt, delay);
      }

      // Esperar antes de tentar novamente
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Aumentar o delay para a próxima tentativa
      delay *= backoffFactor;
    }
  }

  // Se chegou aqui, todas as tentativas falharam
  console.error(`Todas as ${maxRetries + 1} tentativas falharam. Último erro: ${lastError.message}`);
  throw lastError;
}

/**
 * Wrapper para tratamento seguro de promessas
 * Retorna um array [erro, resultado] similar ao padrão Go
 * @param {Promise} promise - Promessa a ser executada
 * @returns {Promise<[Error|null, any]>} - Array com erro e resultado
 */
export async function safeAwait(promise) {
  try {
    const result = await promise;
    return [null, result];
  } catch (error) {
    return [error, null];
  }
}

/**
 * Função para tratamento global de erros não capturados
 * @param {Error} error - Erro capturado
 * @param {string} context - Contexto onde o erro ocorreu
 */
export function handleGlobalError(error, context = 'global') {
  console.error(`[ERRO ${context}]: ${error.message}`);
  console.error(`Stack: ${error.stack}`);
  
  // Aqui você poderia adicionar código para enviar o erro para um serviço de monitoramento
  // como Sentry, LogRocket, etc.
}

// Configurar handlers globais para Node.js
// Verificamos se estamos em um ambiente Node.js completo (não apenas se process existe)
if (typeof process !== 'undefined' && process && typeof process.on === 'function') {
  process.on('uncaughtException', (error) => {
    handleGlobalError(error, 'uncaughtException');
    // Não encerre o processo para manter o sistema funcionando
  });

  process.on('unhandledRejection', (reason, promise) => {
    handleGlobalError(reason, 'unhandledRejection');
    // Não encerre o processo para manter o sistema funcionando
  });
}