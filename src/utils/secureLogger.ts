/**
 * 🔒 LOGGER SEGURO ANTI-RASTREAMENTO
 * 
 * Este logger garante ZERO logs em produção para evitar qualquer
 * possibilidade de rastreamento pelas autoridades.
 */

const isDevelopment = import.meta.env.DEV;
const logsEnabled = import.meta.env.VITE_ENABLE_LOGS === 'true';

export const secureLog = {
  /**
   * Log de informação - apenas em desenvolvimento
   */
  info: (message: string, data?: any) => {
    if (isDevelopment && logsEnabled) {
      console.log(`[INFO] ${message}`, data);
    }
    // Em produção: silêncio total
  },

  /**
   * Log de erro - apenas em desenvolvimento
   */
  error: (message: string, error?: any) => {
    if (isDevelopment && logsEnabled) {
      console.error(`[ERROR] ${message}`, error);
    }
    // Em produção: silêncio total
  },

  /**
   * Log de aviso - apenas em desenvolvimento
   */
  warn: (message: string, data?: any) => {
    if (isDevelopment && logsEnabled) {
      console.warn(`[WARN] ${message}`, data);
    }
    // Em produção: silêncio total
  },

  /**
   * Log de debug - apenas em desenvolvimento
   */
  debug: (message: string, data?: any) => {
    if (isDevelopment && logsEnabled) {
      console.debug(`[DEBUG] ${message}`, data);
    }
    // Em produção: silêncio total
  },

  /**
   * Função vazia para produção - não faz nada
   */
  production: () => undefined,

  /**
   * Verifica se logs estão habilitados
   */
  isEnabled: () => isDevelopment && logsEnabled
};

/**
 * Função de conveniência para substituir console.log
 */
export const log = secureLog.info;
export const logError = secureLog.error;
export const logWarn = secureLog.warn;
export const logDebug = secureLog.debug;

/**
 * Wrapper para try-catch com log seguro
 */
export const secureExecute = async <T>(
  operation: () => Promise<T>,
  errorMessage: string
): Promise<T | null> => {
  try {
    return await operation();
  } catch (error) {
    secureLog.error(errorMessage, error);
    return null;
  }
};

export default secureLog;