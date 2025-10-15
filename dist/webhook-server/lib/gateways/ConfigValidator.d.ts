import { GatewayType } from '../../types/gateway';
/**
 * Resultado da validação de configuração
 */
export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
}
/**
 * Schema de validação para um gateway
 */
export interface ConfigSchema {
    required: string[];
    optional: string[];
    validators?: {
        [key: string]: (value: any) => boolean | string;
    };
}
/**
 * Validador de configurações de gateway
 */
export declare class ConfigValidator {
    private static schemas;
    /**
     * Inicializa os schemas padrão
     */
    private static initializeSchemas;
    /**
     * Valida uma configuração de gateway
     */
    static validate(type: GatewayType, config: any): ValidationResult;
    /**
     * Validação básica para gateways sem schema específico
     */
    private static validateBasicConfig;
    /**
     * Adiciona um schema de validação para um novo tipo de gateway
     */
    static addSchema(type: GatewayType, schema: ConfigSchema): void;
    /**
     * Obtém o schema de validação para um tipo de gateway
     */
    static getSchema(type: GatewayType): ConfigSchema | undefined;
    /**
     * Lista todos os tipos de gateway com schema de validação
     */
    static getSupportedTypes(): GatewayType[];
    /**
     * Verifica se um tipo de gateway tem schema de validação
     */
    static hasSchema(type: GatewayType): boolean;
    /**
     * Valida múltiplas configurações de gateway
     */
    static validateMultiple(configs: Array<{
        type: GatewayType;
        config: any;
        name?: string;
    }>): Map<string, ValidationResult>;
    /**
     * Gera um relatório de validação legível
     */
    static generateReport(type: GatewayType, config: any): string;
}
