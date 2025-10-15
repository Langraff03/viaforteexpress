/**
 * Validador de configurações de gateway
 */
export class ConfigValidator {
    /**
     * Inicializa os schemas padrão
     */
    static initializeSchemas() {
        if (ConfigValidator.schemas.size === 0) {
            // Schema para Asset
            ConfigValidator.schemas.set('asset', {
                required: ['apiKey', 'apiUrl', 'webhookSecret', 'clientId', 'gatewayId'],
                optional: ['sandbox'],
                validators: {
                    apiKey: (value) => {
                        if (typeof value !== 'string')
                            return 'apiKey deve ser uma string';
                        if (value.length < 10)
                            return 'apiKey deve ter pelo menos 10 caracteres';
                        return true;
                    },
                    apiUrl: (value) => {
                        if (typeof value !== 'string')
                            return 'apiUrl deve ser uma string';
                        try {
                            new URL(value);
                            return true;
                        }
                        catch {
                            return 'apiUrl deve ser uma URL válida';
                        }
                    },
                    webhookSecret: (value) => {
                        if (typeof value !== 'string')
                            return 'webhookSecret deve ser uma string';
                        if (value.length < 8)
                            return 'webhookSecret deve ter pelo menos 8 caracteres';
                        return true;
                    }
                }
            });
            // Schema para Mercado Pago
            ConfigValidator.schemas.set('mercadopago', {
                required: ['accessToken', 'publicKey', 'webhookSecret', 'clientId', 'gatewayId'],
                optional: ['sandboxMode'],
                validators: {
                    accessToken: (value) => {
                        if (typeof value !== 'string')
                            return 'accessToken deve ser uma string';
                        if (!value.startsWith('APP_USR-'))
                            return 'accessToken deve começar com APP_USR-';
                        return true;
                    },
                    publicKey: (value) => {
                        if (typeof value !== 'string')
                            return 'publicKey deve ser uma string';
                        if (!value.startsWith('APP_USR-'))
                            return 'publicKey deve começar com APP_USR-';
                        return true;
                    },
                    sandboxMode: (value) => {
                        if (typeof value !== 'boolean')
                            return 'sandboxMode deve ser um boolean';
                        return true;
                    }
                }
            });
            // Schema para Stripe
            ConfigValidator.schemas.set('stripe', {
                required: ['secretKey', 'publishableKey', 'webhookSecret', 'clientId', 'gatewayId'],
                optional: ['apiVersion'],
                validators: {
                    secretKey: (value) => {
                        if (typeof value !== 'string')
                            return 'secretKey deve ser uma string';
                        if (!value.startsWith('sk_'))
                            return 'secretKey deve começar com sk_';
                        return true;
                    },
                    publishableKey: (value) => {
                        if (typeof value !== 'string')
                            return 'publishableKey deve ser uma string';
                        if (!value.startsWith('pk_'))
                            return 'publishableKey deve começar com pk_';
                        return true;
                    },
                    apiVersion: (value) => {
                        if (typeof value !== 'string')
                            return 'apiVersion deve ser uma string';
                        if (!/^\d{4}-\d{2}-\d{2}$/.test(value))
                            return 'apiVersion deve estar no formato YYYY-MM-DD';
                        return true;
                    }
                }
            });
        }
    }
    /**
     * Valida uma configuração de gateway
     */
    static validate(type, config) {
        ConfigValidator.initializeSchemas();
        const result = {
            isValid: true,
            errors: [],
            warnings: []
        };
        if (!config || typeof config !== 'object') {
            result.errors.push('Configuração deve ser um objeto');
            result.isValid = false;
            return result;
        }
        const schema = ConfigValidator.schemas.get(type);
        if (!schema) {
            result.warnings.push(`Schema de validação não encontrado para gateway '${type}'`);
            return ConfigValidator.validateBasicConfig(config, result);
        }
        // Validar campos obrigatórios
        for (const field of schema.required) {
            if (!(field in config) || config[field] === undefined || config[field] === null) {
                result.errors.push(`Campo obrigatório '${field}' não encontrado`);
                result.isValid = false;
            }
        }
        // Validar campos com validadores específicos
        if (schema.validators) {
            for (const [field, validator] of Object.entries(schema.validators)) {
                if (field in config) {
                    const validationResult = validator(config[field]);
                    if (validationResult !== true) {
                        result.errors.push(validationResult);
                        result.isValid = false;
                    }
                }
            }
        }
        // Verificar campos desconhecidos
        const allKnownFields = [...schema.required, ...schema.optional];
        for (const field of Object.keys(config)) {
            if (!allKnownFields.includes(field)) {
                result.warnings.push(`Campo desconhecido '${field}' encontrado na configuração`);
            }
        }
        return result;
    }
    /**
     * Validação básica para gateways sem schema específico
     */
    static validateBasicConfig(config, result) {
        const basicRequired = ['clientId', 'gatewayId'];
        for (const field of basicRequired) {
            if (!(field in config) || config[field] === undefined || config[field] === null) {
                result.errors.push(`Campo obrigatório '${field}' não encontrado`);
                result.isValid = false;
            }
        }
        return result;
    }
    /**
     * Adiciona um schema de validação para um novo tipo de gateway
     */
    static addSchema(type, schema) {
        ConfigValidator.initializeSchemas();
        ConfigValidator.schemas.set(type, schema);
    }
    /**
     * Obtém o schema de validação para um tipo de gateway
     */
    static getSchema(type) {
        ConfigValidator.initializeSchemas();
        return ConfigValidator.schemas.get(type);
    }
    /**
     * Lista todos os tipos de gateway com schema de validação
     */
    static getSupportedTypes() {
        ConfigValidator.initializeSchemas();
        return Array.from(ConfigValidator.schemas.keys());
    }
    /**
     * Verifica se um tipo de gateway tem schema de validação
     */
    static hasSchema(type) {
        ConfigValidator.initializeSchemas();
        return ConfigValidator.schemas.has(type);
    }
    /**
     * Valida múltiplas configurações de gateway
     */
    static validateMultiple(configs) {
        const results = new Map();
        configs.forEach((item, index) => {
            const key = item.name || `${item.type}_${index}`;
            results.set(key, ConfigValidator.validate(item.type, item.config));
        });
        return results;
    }
    /**
     * Gera um relatório de validação legível
     */
    static generateReport(type, config) {
        const result = ConfigValidator.validate(type, config);
        let report = `=== Relatório de Validação - Gateway ${type} ===\n\n`;
        if (result.isValid) {
            report += '✅ Configuração válida!\n';
        }
        else {
            report += '❌ Configuração inválida!\n';
        }
        if (result.errors.length > 0) {
            report += '\n🔴 Erros:\n';
            result.errors.forEach(error => report += `  - ${error}\n`);
        }
        if (result.warnings.length > 0) {
            report += '\n🟡 Avisos:\n';
            result.warnings.forEach(warning => report += `  - ${warning}\n`);
        }
        return report;
    }
}
ConfigValidator.schemas = new Map();
