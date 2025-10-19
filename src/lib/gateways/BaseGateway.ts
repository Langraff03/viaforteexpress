import { PaymentGateway } from './GatewayInterface';

/**
 * Configuração base para qualquer gateway
 */
export interface BaseGatewayConfig {
  clientId: string;
  gatewayId: string;
  webhookSecret?: string;
  [key: string]: any;
}

/**
 * Resultado padrão de processamento de webhook
 */
export interface WebhookProcessingResult {
  processed: boolean;
  eventType: string;
  paymentId?: string;
  orderId?: string;
  newStatus?: string;
  clientId: string;
  gatewayId: string;
  error?: string;
  [extraProps: string]: any;
}

/**
 * Classe base abstrata para implementação de gateways
 * Fornece funcionalidades comuns e implementações padrão
 */
export abstract class BaseGateway implements PaymentGateway {
  public config: BaseGatewayConfig;

  constructor(config: BaseGatewayConfig) {
    this.config = config;
    this.validateConfig();
  }

  /**
   * Valida a configuração básica do gateway
   * Subclasses podem sobrescrever para validações específicas
   */
  protected validateConfig(): void {
    if (!this.config.clientId) {
      throw new Error('clientId é obrigatório na configuração do gateway');
    }
    if (!this.config.gatewayId) {
      throw new Error('gatewayId é obrigatório na configuração do gateway');
    }
  }

  /**
   * Método abstrato para criar cliente - deve ser implementado pelas subclasses
   */
  abstract createCustomer(data: { 
    name: string; 
    email: string; 
    phone?: string; 
  }): Promise<{ id: string }>;

  /**
   * Método abstrato para criar pagamento - deve ser implementado pelas subclasses
   */
  abstract createPayment(data: {
    customer: string;
    value: number;
    dueDate: string;
    description: string;
    status: string;
  }): Promise<{ 
    id: string; 
    status: string; 
    clientId: string; 
    gatewayId: string; 
    [extraProps: string]: any 
  }>;

  /**
   * Método abstrato para processar webhook - deve ser implementado pelas subclasses
   */
  abstract processWebhook(
    payload: any, 
    headers: Record<string, string | string[] | undefined>
  ): Promise<WebhookProcessingResult>;

  /**
   * Implementação padrão para obter pagamento
   * Subclasses podem sobrescrever se necessário
   */
  async getPayment?(paymentId: string): Promise<{ 
    status: string; 
    clientId: string; 
    gatewayId: string; 
    [extraProps: string]: any 
  } | null> {
    console.warn(`[BaseGateway] getPayment não implementado para gateway ${this.config.gatewayId}`);
    return null;
  }

  /**
   * Implementação padrão para cancelar pagamento
   * Subclasses podem sobrescrever se necessário
   */
  async cancelPayment?(paymentId: string): Promise<{ 
    status: string; 
    clientId: string; 
    gatewayId: string; 
    [extraProps: string]: any 
  } | null> {
    console.warn(`[BaseGateway] cancelPayment não implementado para gateway ${this.config.gatewayId}`);
    return null;
  }

  /**
   * Implementação padrão de validação de webhook
   * Subclasses devem sobrescrever para validações específicas
   */
  validateWebhookSignature?(
    rawPayload: string | Buffer,
    signature: string | undefined,
    secret?: string
  ): boolean {
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
  protected normalizePaymentStatus(gatewayStatus: string): string {
    const statusMap: { [key: string]: string } = {
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
  protected createWebhookResult(
    processed: boolean,
    eventType: string,
    additionalData: Partial<WebhookProcessingResult> = {}
  ): WebhookProcessingResult {
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
  protected log(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
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
  protected handleError(error: any, context: string): never {
    this.log(`Erro em ${context}: ${error.message}`, 'error');
    throw error;
  }
}