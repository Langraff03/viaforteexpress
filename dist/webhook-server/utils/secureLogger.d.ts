/**
 * 🔒 LOGGER SEGURO ANTI-RASTREAMENTO
 *
 * Este logger garante ZERO logs em produção para evitar qualquer
 * possibilidade de rastreamento pelas autoridades.
 */
export declare const secureLog: {
    /**
     * Log de informação - apenas em desenvolvimento
     */
    info: (message: string, data?: any) => void;
    /**
     * Log de erro - apenas em desenvolvimento
     */
    error: (message: string, error?: any) => void;
    /**
     * Log de aviso - apenas em desenvolvimento
     */
    warn: (message: string, data?: any) => void;
    /**
     * Log de debug - apenas em desenvolvimento
     */
    debug: (message: string, data?: any) => void;
    /**
     * Função vazia para produção - não faz nada
     */
    production: () => undefined;
    /**
     * Verifica se logs estão habilitados
     */
    isEnabled: () => boolean;
};
/**
 * Função de conveniência para substituir console.log
 */
export declare const log: (message: string, data?: any) => void;
export declare const logError: (message: string, error?: any) => void;
export declare const logWarn: (message: string, data?: any) => void;
export declare const logDebug: (message: string, data?: any) => void;
/**
 * Wrapper para try-catch com log seguro
 */
export declare const secureExecute: <T>(operation: () => Promise<T>, errorMessage: string) => Promise<T | null>;
export default secureLog;
