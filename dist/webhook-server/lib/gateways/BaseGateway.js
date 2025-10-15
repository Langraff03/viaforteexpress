/**
 * Classe base abstrata para implementação de gateways
 * Fornece funcionalidades comuns e implementações padrão
 */
export class BaseGateway {
    constructor(config) {
        this.config = config;
        this.validateConfig();
    }
    /**
     * Valida a configuração básica do gateway
     * Subclasses podem sobrescrever para validações específicas
     */
    validateConfig() {
        if (!this.config.clientId) {
            throw new Error('clientId é obrigatório na configuração do gateway');
        }
        if (!this.config.gatewayId) {
            throw new Error('gatewayId é obrigatório na configuração do gateway');
        }
    }
    /**
     * Implementação padrão para obter pagamento
     * Subclasses podem sobrescrever se necessário
     */
    async getPayment(paymentId) {
        console.warn(`[BaseGateway] getPayment não implementado para gateway ${this.config.gatewayId}`);
        return null;
    }
    /**
     * Implementação padrão para cancelar pagamento
     * Subclasses podem sobrescrever se necessário
     */
    async cancelPayment(paymentId) {
        console.warn(`[BaseGateway] cancelPayment não implementado para gateway ${this.config.gatewayId}`);
        return null;
    }
    /**
     * Implementação padrão de validação de webhook
     * Subclasses devem sobrescrever para validações específicas
     */
    validateWebhookSignature(rawPayload, signature, secret) {
        const webhookSecret = secret || this.config.webhookSecret;
        if (!webhookSecret) {
            console.warn(`[BaseGateway] Nenhum webhook secret configurado para gateway ${this.config.gatewayId}`);
            return true; // Permitir em desenvolvimento
        }
        if (!signature) {
            console.warn(`[BaseGateway] Nenhuma assinatura fornecida para gateway ${this.config.gatewayId}`);
            return true; // Permitir em desenvolvimento
        }
        // Implementação básica - comparação simples
        // Subclasses devem implementar validação específica (HMAC, etc.)
        return signature === webhookSecret;
    }
    /**
     * Utilitário para normalizar status de pagamento
     * Mapeia status específicos do gateway para status padrão
     */
    normalizePaymentStatus(gatewayStatus) {
        const statusMap = {
            // Status comuns
            'pending': 'pending',
            'paid': 'paid',
            'confirmed': 'paid',
            'approved': 'paid',
            'completed': 'paid',
            'cancelled': 'cancelled',
            'failed': 'failed',
            'rejected': 'failed',
            'expired': 'expired',
            'refunded': 'refunded',
            // Adicionar mapeamentos específicos conforme necessário
        };
        return statusMap[gatewayStatus.toLowerCase()] || gatewayStatus;
    }
    /**
     * Utilitário para gerar resultado de webhook com valores padrão
     */
    createWebhookResult(processed, eventType, additionalData = {}) {
        return {
            processed,
            eventType,
            clientId: this.config.clientId,
            gatewayId: this.config.gatewayId,
            ...additionalData
        };
    }
    /**
     * Utilitário para log padronizado
     */
    log(message, level = 'info') {
        const prefix = `[${this.constructor.name}:${this.config.gatewayId}]`;
        switch (level) {
            case 'warn':
                console.warn(`${prefix} ${message}`);
                break;
            case 'error':
                console.error(`${prefix} ${message}`);
                break;
            default:
                console.log(`${prefix} ${message}`);
        }
    }
    /**
     * Utilitário para tratar erros de forma padronizada
     */
    handleError(error, context) {
        this.log(`Erro em ${context}: ${error.message}`, 'error');
        throw error;
    }
}
//# sourceMappingURL=BaseGateway.js.map