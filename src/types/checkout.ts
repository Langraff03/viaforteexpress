// ============================================================================
// TIPOS TYPESCRIPT: Integração de Checkout Adorei
// ============================================================================

// Base type for database timestamps
export interface DatabaseTimestamps {
  created_at: string;
  updated_at: string;
}

// ============================================================================
// FREELANCER CHECKOUT CONFIGURATIONS
// ============================================================================

export type CheckoutType = 'adorei';
export type EmailTemplateType = 'tracking' | 'custom';

export interface FreelancerCheckoutConfig extends DatabaseTimestamps {
  id: string;
  user_id: string;
  checkout_type: CheckoutType;
  
  // Configurações específicas do checkout
  checkout_config: AdoreiCheckoutConfig;
  webhook_secret?: string;
  
  // Configurações de email
  email_domain_id?: string;
  email_template_type: EmailTemplateType;
  custom_email_template?: string;
  
  // Configurações de remetente
  from_name?: string;
  from_email?: string;
  reply_to_email?: string;
  
  // Status
  is_active: boolean;
}

export interface AdoreiCheckoutConfig {
  // Configurações específicas da Adorei
  merchant_id?: string;
  merchant_alias?: string;
  webhook_url?: string;
  
  // Configurações adicionais podem ser adicionadas aqui
  [key: string]: any;
}

// ============================================================================
// DOMAIN REQUESTS
// ============================================================================

export type DomainRequestStatus = 'pending' | 'approved' | 'rejected';

export interface DomainRequest extends DatabaseTimestamps {
  id: string;
  user_id: string;
  domain_name: string;
  business_name?: string;
  business_description?: string;
  reason?: string;
  
  // Status e aprovação
  status: DomainRequestStatus;
  admin_notes?: string;
  approved_by?: string;
}

// ============================================================================
// EXTENDED EMAIL DOMAIN (with owner)
// ============================================================================

export interface EmailDomainWithOwner {
  id: string;
  domain_name: string;
  from_name: string;
  from_email: string;
  reply_to_email: string;
  resend_api_key: string;
  is_active: boolean;
  is_default: boolean;
  owner_id?: string; // Novo campo para isolamento
  created_at: string;
  updated_at: string;
}

// ============================================================================
// ADOREI WEBHOOK PAYLOAD TYPES
// ============================================================================

export type AdoreiEventType = 
  | 'order.created'
  | 'order.updated'
  | 'order.status.updated'
  | 'order.status.approved'
  | 'order.status.refused';

export type AdoreiOrderStatus = 
  | 'pending'
  | 'refused'
  | 'approved'
  | 'in_analysis'
  | 'chargeback'
  | 'cancelled'
  | 'refunded'
  | 'failed';

export type AdoreiGateway = 
  | 'appmax'
  | 'mercadopago'
  | 'doppus'
  | 'pagarme'
  | 'cielo'
  | 'pagseguro';

export type AdoreiPaymentMethod = 
  | 'billet'
  | 'pix'
  | 'credit_card'
  | 'debit_card';

export type AdoreiSource = 
  | 'shopify'
  | 'woocommerce';

export interface AdoreiCustomer {
  first_name: string;
  last_name: string;
  doc: string;
  ip: string;
  email: string;
  phone: string;
}

export interface AdoreiAddress {
  street: string;
  number: string;
  neighborhood: string;
  receiver: string;
  zipcode: string;
  city: string;
  uf: string;
}

export interface AdoreiOrderItem {
  source_reference: number;
  quantity: number;
  price: number;
}

export interface AdoreiTracking {
  code: string;
  local: string;
  last_status: string;
  status_at: string;
}

export interface AdoreiMerchant {
  id: string;
  alias: string;
}

export interface AdoreiOrderResource {
  status: AdoreiOrderStatus;
  number: number;
  value_total: number;
  value_products: number;
  value_shipment: number;
  value_discount: number;
  days_delivery: string;
  upselled: boolean;
  tracking?: AdoreiTracking;
  gateway: AdoreiGateway;
  payment_method: AdoreiPaymentMethod;
  source: AdoreiSource;
  source_reference?: string;
  gateway_transaction_id?: string;
  customer: AdoreiCustomer;
  items: AdoreiOrderItem[];
  address: AdoreiAddress;
}

export interface AdoreiWebhookPayload {
  event: AdoreiEventType;
  time: string;
  merchant: AdoreiMerchant;
  resource: AdoreiOrderResource;
}

// ============================================================================
// FORM TYPES
// ============================================================================

export interface CheckoutConfigFormData {
  checkout_type: CheckoutType;
  email_domain_id?: string;
  email_template_type: EmailTemplateType;
  custom_email_template?: string;
  from_name?: string;
  from_email?: string;
  reply_to_email?: string;
  webhook_secret?: string;
}

export interface DomainRequestFormData {
  domain_name: string;
  business_name?: string;
  business_description?: string;
  reason?: string;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface CheckoutConfigResponse {
  success: boolean;
  data?: FreelancerCheckoutConfig;
  error?: string;
}

export interface DomainRequestResponse {
  success: boolean;
  data?: DomainRequest;
  error?: string;
}

export interface AvailableDomainsResponse {
  success: boolean;
  data?: EmailDomainWithOwner[];
  error?: string;
}

export interface WebhookUrlResponse {
  success: boolean;
  webhook_url?: string;
  freelancer_id?: string;
  error?: string;
}

// ============================================================================
// ADOREI INTEGRATION HELPERS
// ============================================================================

export interface ProcessedAdoreiData {
  // Dados do cliente (mapeados)
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  customer_cpf?: string;
  
  // Dados do pedido
  payment_id: string;
  amount: number; // em centavos
  order_number: number;
  
  // Dados de entrega
  city: string;
  state: string;
  address_full: string;
  zipcode: string;
  receiver: string;
  
  // Metadados
  gateway: AdoreiGateway;
  payment_method: AdoreiPaymentMethod;
  source?: AdoreiSource;
  tracking_info?: AdoreiTracking;
  merchant: AdoreiMerchant;
  original_payload: AdoreiWebhookPayload;
}

// ============================================================================
// TEMPLATE VARIABLES
// ============================================================================

export interface EmailTemplateVariables {
  customer_name: string;
  tracking_code: string;
  order_id: string;
  order_number?: number;
  amount?: string; // formatado como R$ X,XX
  city?: string;
  state?: string;
  tracking_url: string;
  company_name?: string;
  support_email?: string;
  from_name?: string;
}

// ============================================================================
// WORKER JOB TYPES
// ============================================================================

export interface AdoreiWebhookJobData {
  freelancer_id: string;
  webhook_payload: AdoreiWebhookPayload;
  received_at: string;
}

export interface AdoreiProcessingResult {
  success: boolean;
  order_id?: string;
  tracking_code?: string;
  email_sent?: boolean;
  error?: string;
}