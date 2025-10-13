import { PaymentStatus, WebhookEventType } from '../../types/gateway';

/**
 * Utilitários para normalização de dados entre diferentes gateways
 */
export class GatewayUtils {
  /**
   * Mapeia status de pagamento específicos do gateway para status padronizados
   */
  static normalizePaymentStatus(gatewayType: string, gatewayStatus: string): PaymentStatus {
    const normalizedStatus = gatewayStatus.toLowerCase();
    
    switch (gatewayType.toLowerCase()) {
      case 'asset':
        return GatewayUtils.normalizeAssetStatus(normalizedStatus);
      case 'mercadopago':
        return GatewayUtils.normalizeMercadoPagoStatus(normalizedStatus);
      case 'stripe':
        return GatewayUtils.normalizeStripeStatus(normalizedStatus);
      default:
        return GatewayUtils.normalizeGenericStatus(normalizedStatus);
    }
  }

  /**
   * Normaliza status do gateway Asset/Asaas
   */
  private static normalizeAssetStatus(status: string): PaymentStatus {
    const statusMap: { [key: string]: PaymentStatus } = {
      'pending': 'pending',
      'awaiting_payment': 'pending',
      'received_in_cash': 'paid',
      'confirmed': 'paid',
      'paid': 'paid',
      'overdue': 'expired',
      'cancelled': 'cancelled',
      'refunded': 'refunded',
      'received_in_cash_undone': 'cancelled',
      'chargeback_requested': 'cancelled',
      'chargeback_dispute': 'cancelled',
      'awaiting_chargeback_reversal': 'cancelled',
      'dunning_requested': 'failed',
      'dunning_received': 'failed',
      'awaiting_risk_analysis': 'pending'
    };

    return statusMap[status] || 'pending';
  }

  /**
   * Normaliza status do Mercado Pago
   */
  private static normalizeMercadoPagoStatus(status: string): PaymentStatus {
    const statusMap: { [key: string]: PaymentStatus } = {
      'pending': 'pending',
      'approved': 'paid',
      'authorized': 'paid',
      'in_process': 'pending',
      'in_mediation': 'pending',
      'rejected': 'failed',
      'cancelled': 'cancelled',
      'refunded': 'refunded',
      'charged_back': 'cancelled'
    };

    return statusMap[status] || 'pending';
  }

  /**
   * Normaliza status do Stripe
   */
  private static normalizeStripeStatus(status: string): PaymentStatus {
    const statusMap: { [key: string]: PaymentStatus } = {
      'incomplete': 'pending',
      'incomplete_expired': 'expired',
      'trialing': 'pending',
      'active': 'paid',
      'past_due': 'expired',
      'canceled': 'cancelled',
      'unpaid': 'failed',
      'requires_payment_method': 'pending',
      'requires_confirmation': 'pending',
      'requires_action': 'pending',
      'processing': 'pending',
      'requires_capture': 'pending',
      'succeeded': 'paid'
    };

    return statusMap[status] || 'pending';
  }

  /**
   * Normaliza status genérico (fallback)
   */
  private static normalizeGenericStatus(status: string): PaymentStatus {
    const statusMap: { [key: string]: PaymentStatus } = {
      'pending': 'pending',
      'paid': 'paid',
      'completed': 'paid',
      'approved': 'paid',
      'confirmed': 'paid',
      'success': 'paid',
      'successful': 'paid',
      'cancelled': 'cancelled',
      'canceled': 'cancelled',
      'failed': 'failed',
      'rejected': 'failed',
      'declined': 'failed',
      'error': 'failed',
      'expired': 'expired',
      'timeout': 'expired',
      'refunded': 'refunded',
      'reversed': 'refunded'
    };

    return statusMap[status] || 'pending';
  }

  /**
   * Normaliza tipos de evento de webhook
   */
  static normalizeWebhookEventType(gatewayType: string, eventType: string): WebhookEventType {
    const normalizedEvent = eventType.toLowerCase();
    
    switch (gatewayType.toLowerCase()) {
      case 'asset':
        return GatewayUtils.normalizeAssetEventType(normalizedEvent);
      case 'mercadopago':
        return GatewayUtils.normalizeMercadoPagoEventType(normalizedEvent);
      case 'stripe':
        return GatewayUtils.normalizeStripeEventType(normalizedEvent);
      default:
        return GatewayUtils.normalizeGenericEventType(normalizedEvent);
    }
  }

  /**
   * Normaliza eventos do Asset/Asaas
   */
  private static normalizeAssetEventType(eventType: string): WebhookEventType {
    const eventMap: { [key: string]: WebhookEventType } = {
      'payment_created': 'payment.created',
      'payment_confirmed': 'payment.confirmed',
      'payment_received': 'payment.paid',
      'payment_overdue': 'payment.expired',
      'payment_deleted': 'payment.cancelled',
      'payment_refunded': 'payment.refunded',
      'payment_received_in_cash_undone': 'payment.cancelled',
      'payment_chargeback_requested': 'chargeback.created',
      'payment_awaiting_chargeback_reversal': 'chargeback.created',
      'transaction_created': 'transaction.created',
      'transaction_paid': 'transaction.paid',
      'transaction_failed': 'transaction.failed'
    };

    return eventMap[eventType] || 'payment.created';
  }

  /**
   * Normaliza eventos do Mercado Pago
   */
  private static normalizeMercadoPagoEventType(eventType: string): WebhookEventType {
    const eventMap: { [key: string]: WebhookEventType } = {
      'payment': 'payment.created',
      'payment.created': 'payment.created',
      'payment.updated': 'payment.confirmed',
      'merchant_order': 'payment.created',
      'plan': 'subscription.created',
      'subscription': 'subscription.created',
      'preapproval': 'subscription.created',
      'invoice': 'payment.created'
    };

    return eventMap[eventType] || 'payment.created';
  }

  /**
   * Normaliza eventos do Stripe
   */
  private static normalizeStripeEventType(eventType: string): WebhookEventType {
    const eventMap: { [key: string]: WebhookEventType } = {
      'payment_intent.created': 'payment.created',
      'payment_intent.succeeded': 'payment.paid',
      'payment_intent.payment_failed': 'payment.failed',
      'payment_intent.canceled': 'payment.cancelled',
      'charge.succeeded': 'payment.paid',
      'charge.failed': 'payment.failed',
      'charge.dispute.created': 'chargeback.created',
      'invoice.payment_succeeded': 'payment.paid',
      'invoice.payment_failed': 'payment.failed',
      'customer.subscription.created': 'subscription.created',
      'customer.subscription.deleted': 'subscription.cancelled'
    };

    return eventMap[eventType] || 'payment.created';
  }

  /**
   * Normaliza eventos genéricos
   */
  private static normalizeGenericEventType(eventType: string): WebhookEventType {
    const eventMap: { [key: string]: WebhookEventType } = {
      'created': 'payment.created',
      'paid': 'payment.paid',
      'confirmed': 'payment.confirmed',
      'failed': 'payment.failed',
      'cancelled': 'payment.cancelled',
      'canceled': 'payment.cancelled',
      'refunded': 'payment.refunded',
      'expired': 'payment.expired'
    };

    return eventMap[eventType] || 'payment.created';
  }

  /**
   * Extrai ID do pedido de diferentes formatos de payload
   */
  static extractOrderId(payload: any): string | null {
    // Tentar diferentes caminhos possíveis
    const possiblePaths = [
      payload.orderId,
      payload.order_id,
      payload.externalReference,
      payload.external_reference,
      payload.metadata?.orderId,
      payload.metadata?.order_id,
      payload.reference,
      payload.reference_id,
      payload.merchant_order_id,
      payload.description?.match(/(?:pedido|order)[:\s#]*(\w+)/i)?.[1]
    ];

    for (const path of possiblePaths) {
      if (path && typeof path === 'string') {
        return path;
      }
    }

    return null;
  }

  /**
   * Extrai informações do cliente de diferentes formatos de payload
   */
  static extractCustomerInfo(payload: any): {
    name?: string;
    email?: string;
    phone?: string;
    document?: string;
  } | null {
    const customer = payload.customer || payload.payer || payload.billing_details || payload;

    if (!customer) return null;

    // Extração específica para diferentes estruturas de documento
    let document = customer.document || customer.cpf || customer.cnpj || customer.tax_id;

    // Tratamento específico para Asset (estrutura: customer.document.number)
    if (customer.document && typeof customer.document === 'object' && customer.document.number) {
      document = customer.document.number;
    }

    return {
      name: customer.name || customer.first_name || customer.full_name || customer.nome,
      email: customer.email || customer.email_address,
      phone: customer.phone || customer.phone_number || customer.mobile_phone || customer.telefone,
      document: document
    };
  }

  /**
   * Extrai valor do pagamento de diferentes formatos
   */
  static extractPaymentAmount(payload: any): number {
    const possiblePaths = [
      payload.amount,
      payload.value,
      payload.total,
      payload.total_amount,
      payload.transaction_amount,
      payload.amount_cents,
      payload.valor
    ];

    for (const path of possiblePaths) {
      if (typeof path === 'number' && path > 0) {
        return path;
      }
    }

    return 0;
  }

  /**
   * Converte valor entre diferentes formatos (centavos/reais)
   */
  static convertAmount(amount: number, fromFormat: 'cents' | 'reals', toFormat: 'cents' | 'reals'): number {
    if (fromFormat === toFormat) return amount;
    
    if (fromFormat === 'cents' && toFormat === 'reals') {
      return amount / 100;
    }
    
    if (fromFormat === 'reals' && toFormat === 'cents') {
      return Math.round(amount * 100);
    }

    return amount;
  }

  /**
   * Valida se um payload de webhook é válido
   */
  static validateWebhookPayload(payload: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!payload) {
      errors.push('Payload não pode ser nulo ou undefined');
    }

    if (typeof payload !== 'object') {
      errors.push('Payload deve ser um objeto');
    }

    // Verificações básicas
    if (!payload.id && !payload.payment_id && !payload.transaction_id) {
      errors.push('Payload deve conter um ID de pagamento válido');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Gera um hash único para um payload de webhook
   */
  static generateWebhookHash(payload: any): string {
    const crypto = require('crypto');
    const payloadString = JSON.stringify(payload, Object.keys(payload).sort());
    return crypto.createHash('sha256').update(payloadString).digest('hex');
  }

  /**
   * Normaliza dados de endereço de diferentes formatos
   */
  static normalizeAddress(address: any): {
    street?: string;
    number?: string;
    complement?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  } | null {
    if (!address) return null;

    return {
      street: address.street || address.street_name || address.logradouro || address.address_line_1,
      number: address.number || address.street_number || address.numero,
      complement: address.complement || address.complemento || address.address_line_2,
      neighborhood: address.neighborhood || address.district || address.bairro,
      city: address.city || address.cidade,
      state: address.state || address.state_code || address.estado || address.uf,
      zipCode: address.zip_code || address.postal_code || address.cep,
      country: address.country || address.country_code || address.pais || 'BR'
    };
  }

  /**
   * Formata um valor monetário para exibição
   */
  static formatCurrency(amount: number, currency: string = 'BRL'): string {
    const formatter = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency
    });

    return formatter.format(amount / 100); // Assumindo que o valor está em centavos
  }
}