export interface Profile {
    id: string;
    role: 'admin' | 'gateway_user' | 'freelancer' | 'cliente';
    client_id?: string | null;
    gateway_id?: string | null;
    full_name?: string | null;
    updated_at?: string | null;
}
export interface Client {
    id: string;
    name: string;
    settings?: Record<string, any> | null;
    created_at: string;
}
export interface Gateway {
    id: string;
    client_id: string;
    type: string;
    name: string;
    config?: Record<string, any> | null;
    is_active: boolean;
    created_at: string;
}
export type OrderStatus = 'created' | 'redelivery_pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'failed';
export interface Order {
    id: string;
    client_id: string;
    gateway_id: string;
    external_id?: string | null;
    amount: number;
    status: OrderStatus;
    customer_name: string;
    customer_email: string;
    customer_phone?: string | null;
    customer_cpf?: string | null;
    city?: string | null;
    state?: string | null;
    tracking_code?: string | null;
    payment_id?: string | null;
    payment_status?: PaymentStatus | null;
    redelivery_count: number;
    has_shipping_address?: boolean | null;
    email_sent?: boolean | null;
    email_sent_at?: string | null;
    created_at: string;
    updated_at: string;
}
export interface OfferEmailLog {
    id: string;
    lead_id?: string | null;
    client_id?: string | null;
    email: string;
    status: string;
    origin: string;
    error_message?: string | null;
    sent_at: string;
}
export type LeadStatus = 'ativo' | 'inativo' | 'processado';
export interface Lead {
    id: string;
    client_id: string;
    offer_id?: string | null;
    email: string;
    name?: string | null;
    tags?: Record<string, any> | null;
    status: LeadStatus;
    created_at: string;
}
export interface OrderItem {
    id?: string;
    order_id: string;
    product_name: string;
    product_description?: string | null;
    product_code?: string | null;
    product_brand?: string | null;
    quantity: number;
    unit_price: number;
    total_price?: number;
    weight_grams?: number | null;
    dimensions_cm?: string | null;
    product_category?: string | null;
    ncm_code?: string | null;
    webhook_data?: any;
    created_at?: string;
    updated_at?: string;
}
export interface ProductStats {
    product_name: string;
    product_category?: string | null;
    product_description?: string | null;
    product_brand?: string | null;
    total_quantity: number;
    total_revenue: number;
    order_count: number;
    avg_price: number;
    first_sale: string;
    last_sale: string;
}
export type DashboardTab = 'dashboard' | 'products' | 'analytics';
export interface User {
    id: string;
    email: string;
    name: string | null;
    role: 'admin' | 'gateway_user' | 'freelancer' | 'cliente';
    client_id?: string | null;
    gateway_id?: string | null;
    clientName?: string | null;
    gatewayType?: string | null;
}
/**
 * Interface para domínios de email configuráveis
 */
export interface EmailDomain {
    id: string;
    domain_name: string;
    from_name: string;
    from_email: string;
    reply_to_email: string;
    resend_api_key: string;
    is_default: boolean;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    created_by?: string;
}
/**
 * Interface para criação de novos domínios
 */
export interface CreateEmailDomainRequest {
    domain_name: string;
    from_name: string;
    from_email: string;
    reply_to_email: string;
    resend_api_key: string;
    is_active?: boolean;
}
/**
 * Interface para atualização de domínios existentes
 */
export interface UpdateEmailDomainRequest {
    domain_name?: string;
    from_name?: string;
    from_email?: string;
    reply_to_email?: string;
    resend_api_key?: string;
    is_active?: boolean;
}
/**
 * Interface para validação de API keys do Resend
 */
export interface ResendApiKeyValidation {
    api_key: string;
    domain?: string;
}
/**
 * Interface para resposta de validação
 */
export interface ValidationResponse {
    valid: boolean;
    error?: string;
    details?: any;
}
/**
 * Interface para logs de auditoria de domínios
 */
export interface EmailDomainAudit {
    id: string;
    domain_id: string;
    action: 'INSERT' | 'UPDATE' | 'DELETE';
    old_values?: Partial<EmailDomain>;
    new_values?: Partial<EmailDomain>;
    changed_by?: string;
    changed_at: string;
    user_agent?: string;
    ip_address?: string;
}
/**
 * Interface para seleção de domínio em campanhas
 */
export interface DomainSelectionOption {
    id: string;
    label: string;
    description: string;
    domain_name: string;
    is_default?: boolean;
}
/**
 * Interface estendida para configuração de email com domínio
 */
export interface ExtendedEmailConfig {
    fromName: string;
    fromEmail: string;
    replyToEmail: string;
    resendApiKey: string;
    domainId?: string;
    domainName?: string;
    isDefault?: boolean;
}
