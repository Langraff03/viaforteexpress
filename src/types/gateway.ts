/**
 * Tipos específicos para o sistema de gateways de pagamento
 */

/**
 * Tipos de gateway suportados
 */
export type GatewayType = 'asset' | 'mercadopago' | 'stripe' | 'pagarme' | 'paypal' | string;

/**
 * Status de pagamento padronizados
 */
export type PaymentStatus = 
  | 'pending'     // Pendente
  | 'paid'        // Pago
  | 'cancelled'   // Cancelado
  | 'failed'      // Falhou
  | 'expired'     // Expirado
  | 'refunded';   // Reembolsado

/**
 * Tipos de evento de webhook
 */
export type WebhookEventType = 
  | 'payment.created'
  | 'payment.confirmed'
  | 'payment.paid'
  | 'payment.failed'
  | 'payment.cancelled'
  | 'payment.refunded'
  | 'payment.expired'
  | 'transaction.created'
  | 'transaction.paid'
  | 'transaction.failed'
  | 'subscription.created'
  | 'subscription.cancelled'
  | 'chargeback.created'
  | string;

/**
 * Configuração genérica de gateway
 */
export interface GatewayConfig {
  clientId: string;
  gatewayId: string;
  type: GatewayType;
  webhookSecret?: string;
  isActive?: boolean;
  [key: string]: any;
}

/**
 * Configuração específica para Asset/Asaas
 */
export interface AssetGatewayConfig extends GatewayConfig {
  type: 'asset';
  apiKey: string;
  apiUrl: string;
  webhookSecret: string;
}

/**
 * Configuração específica para Mercado Pago
 */
export interface MercadoPagoGatewayConfig extends GatewayConfig {
  type: 'mercadopago';
  accessToken: string;
  publicKey: string;
  webhookSecret: string;
  sandboxMode?: boolean;
}

/**
 * Configuração específica para Stripe
 */
export interface StripeGatewayConfig extends GatewayConfig {
  type: 'stripe';
  secretKey: string;
  publishableKey: string;
  webhookSecret: string;
  apiVersion?: string;
}

/**
 * União de todos os tipos de configuração
 */
export type AnyGatewayConfig = AssetGatewayConfig | MercadoPagoGatewayConfig | StripeGatewayConfig | GatewayConfig;

/**
 * Dados de cliente para criação
 */
export interface CustomerData {
  name: string;
  email: string;
  phone?: string;
  document?: string;
  address?: {
    street?: string;
    number?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
}

/**
 * Dados de pagamento para criação
 */
export interface PaymentData {
  customer: string;
  value: number;
  dueDate: string;
  description: string;
  status: PaymentStatus;
  billingType?: 'PIX' | 'BOLETO' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'TRANSFER';
  externalReference?: string;
  metadata?: Record<string, any>;
}

/**
 * Resposta de criação de pagamento
 */
export interface PaymentResponse {
  id: string;
  status: PaymentStatus;
  clientId: string;
  gatewayId: string;
  invoiceUrl?: string;
  pixQrCode?: string;
  bankSlipUrl?: string;
  [extraProps: string]: any;
}

/**
 * Resultado do processamento de webhook
 */
export interface WebhookProcessingResult {
  processed: boolean;
  eventType: WebhookEventType;
  paymentId?: string;
  orderId?: string;
  newStatus?: PaymentStatus;
  clientId: string;
  gatewayId: string;
  error?: string;
  customer?: any;
  items?: any[];
  originalPayload?: any;
  [extraProps: string]: any;
}

/**
 * Informações de um gateway registrado
 */
export interface RegisteredGatewayInfo {
  name: string;
  description: string;
  type: GatewayType;
  constructor: any;
  configSchema: {
    required: string[];
    optional: string[];
  };
  features?: {
    pix?: boolean;
    boleto?: boolean;
    creditCard?: boolean;
    debitCard?: boolean;
    subscription?: boolean;
    webhook?: boolean;
  };
}

/**
 * Dados do gateway no banco de dados
 */
export interface GatewayDatabaseRow {
  id: string;
  client_id: string;
  type: GatewayType;
  name: string;
  config: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

/**
 * Parâmetros para busca de gateways
 */
export interface GatewaySearchParams {
  clientId?: string;
  type?: GatewayType;
  isActive?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * Resultado de validação de configuração
 */
export interface ConfigValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Estatísticas de gateway
 */
export interface GatewayStats {
  totalTransactions: number;
  totalAmount: number;
  successRate: number;
  avgProcessingTime: number;
  lastTransactionAt?: string;
}

/**
 * Configuração de retry para webhooks
 */
export interface WebhookRetryConfig {
  maxRetries: number;
  retryDelay: number;
  exponentialBackoff: boolean;
}

/**
 * Metadados de transação
 */
export interface TransactionMetadata {
  orderId?: string;
  customerId?: string;
  productIds?: string[];
  affiliateId?: string;
  campaignId?: string;
  [key: string]: any;
}

/**
 * Tipos de erro específicos de gateway
 */
export type GatewayErrorType = 
  | 'CONFIGURATION_ERROR'
  | 'AUTHENTICATION_ERROR'
  | 'PAYMENT_ERROR'
  | 'WEBHOOK_ERROR'
  | 'VALIDATION_ERROR'
  | 'NETWORK_ERROR'
  | 'UNKNOWN_ERROR';

/**
 * Erro customizado para gateways
 */
export interface GatewayError {
  type: GatewayErrorType;
  message: string;
  code?: string;
  details?: any;
  gatewayId?: string;
  timestamp: string;
}