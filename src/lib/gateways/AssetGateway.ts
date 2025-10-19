import axios, { AxiosInstance } from 'axios';
import { PaymentGateway } from './GatewayInterface';
import { v5 as uuidv5 } from 'uuid';

// Interfaces do asset.ts original, podem ser movidas para um arquivo de tipos compartilhado se necessário
export interface AssetPaymentResponse {
  id: string;
  customer: string;
  value: number;
  status: string;
  dueDate: string;
  description?: string;
  invoiceUrl?: string; // Campo comum do Asaas
  pixQrCode?: string; // Campo comum do Asaas
  // Adicione quaisquer outros campos relevantes da resposta da API Asaas
  [extraProps: string]: any;
}

export interface AssetCustomerResponse {
  id: string;
  name: string;
  email: string;
  phone?: string;
  mobilePhone?: string;
  // Adicione quaisquer outros campos relevantes da resposta da API Asaas
  [extraProps: string]: any;
}

export interface AssetGatewayConfig {
  apiKey: string;
  apiUrl: string;
  webhookSecret: string;
  clientId: string;
  gatewayId: string;
}

export class AssetGateway implements PaymentGateway {
  private assetClient: AxiosInstance;
  public config: AssetGatewayConfig;

  constructor(config: AssetGatewayConfig) {
    this.config = config;
    
    this.assetClient = axios.create({
      baseURL: config.apiUrl,
      headers: {
        'access_token': config.apiKey,
        'Content-Type': 'application/json'
      }
    });
  }
  // Clientes
  async createCustomer(data: { name: string; email: string; phone?: string; }): Promise<{ id: string }> {
    // Mapear para a estrutura esperada do Asaas se for diferente
    const asaasCustomerData = {
      name: data.name,
      email: data.email,
      mobilePhone: data.phone, // Asaas usa mobilePhone
      // cpfCnpj: '12345678901' // Exemplo: Asaas pode exigir cpfCnpj
      externalReference: this.config.clientId // Referência ao cliente no nosso sistema
    };
    const response = await this.assetClient.post<AssetCustomerResponse>('/customers', asaasCustomerData);
    return { id: response.data.id };
  }

  async getCustomer(id: string): Promise<AssetCustomerResponse | null> {
    try {
      const response = await this.assetClient.get<AssetCustomerResponse>(`/customers/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching customer ${id} from Asset:`, error);
      return null;
    }
  }

  // Pagamentos
  async createPayment(data: {
    customer: string;
    value: number;
    dueDate: string;
    description: string;
    status: string; // Nosso status interno, Asaas pode ter seu próprio mapeamento
  }): Promise<{ id: string; status: string; clientId: string; gatewayId: string; [extraProps: string]: any }> {
    // Mapear para a estrutura esperada do Asaas
    const asaasPaymentData = {
      customer: data.customer,
      billingType: 'PIX', // Ou 'BOLETO', 'CREDIT_CARD' - isso deve ser configurável ou parte de `data`
      value: data.value,
      dueDate: data.dueDate,
      description: data.description,
      externalReference: `client-${this.config.clientId}`, // Referência ao cliente
      metadata: JSON.stringify({
        client_id: this.config.clientId,
        gateway_id: this.config.gatewayId
      })
    };
    const response = await this.assetClient.post<AssetPaymentResponse>('/payments', asaasPaymentData);
    // Mapear o status do Asaas para o nosso status interno, se necessário
    const { id, status, ...rest } = response.data;
    return {
      id,
      status, // Este é o status do Asaas, ex: PENDING, CONFIRMED, OVERDUE
      clientId: this.config.clientId,
      gatewayId: this.config.gatewayId,
      // invoiceUrl e pixQrCode farão parte de ...rest se existirem em response.data
      ...rest
    };
  }

  async getPayment(paymentId: string): Promise<{ status: string; clientId: string; gatewayId: string; [extraProps: string]: any } | null> {
    try {
      const response = await this.assetClient.get<AssetPaymentResponse>(`/payments/${paymentId}`);
      const { status, ...rest } = response.data;
      return {
        status,
        clientId: this.config.clientId,
        gatewayId: this.config.gatewayId,
        ...rest
      };
    } catch (error) {
      console.error(`Error fetching payment ${paymentId} from Asset:`, error);
      // Considere como lidar com diferentes tipos de erro, ex: 404 vs. 500
      return null;
    }
  }

  // Opcional: cancelPayment - Asaas usa DELETE /payments/{id} ou POST /payments/{id}/cancel
  async cancelPayment(paymentId: string): Promise<{ status: string; clientId: string; gatewayId: string; [extraProps: string]: any } | null> {
    try {
      // Asaas usa DELETE para cancelamento de alguns tipos de pagamento, ou um endpoint de cancelamento específico
      // Por exemplo, para uma cobrança que não foi paga:
      const response = await this.assetClient.delete<AssetPaymentResponse>(`/payments/${paymentId}`);
      // Ou para uma cobrança paga, pode ser o endpoint /refunds
      const { status, ...rest } = response.data;
      return {
        status, // ex: 'CANCELLED' ou 'REFUND_REQUESTED'
        clientId: this.config.clientId,
        gatewayId: this.config.gatewayId,
        ...rest
      };
    } catch (error) {
      console.error(`Error cancelling payment ${paymentId} in Asset:`, error);
      return null;
    }
  }

  // Métodos adicionais específicos do Asset, não na interface PaymentGateway, mas úteis para administração
  async listPayments(params?: {
    customer?: string;
    status?: string; // Status Asaas
    offset?: number;
    limit?: number;
    // Adicionar outros filtros específicos do Asaas
  }): Promise<{ data: AssetPaymentResponse[], totalCount: number, hasMore: boolean, clientId: string, gatewayId: string }> {
    const response = await this.assetClient.get<{ data: AssetPaymentResponse[], totalCount: number, hasMore: boolean }>('/payments', { params });
    return {
      ...response.data,
      clientId: this.config.clientId,
      gatewayId: this.config.gatewayId
    };
  }

  // Processamento de Webhook
  async processWebhook(payload: any, headers: Record<string, string | string[] | undefined>): Promise<{
    processed: boolean;
    eventType: string;
    paymentId?: string;
    orderId?: string;
    newStatus?: string;
    clientId: string;
    gatewayId: string;
    error?: string;
    [extraProps: string]: any;
  }> {
    console.log('[AssetGateway] Processando webhook com payload:', JSON.stringify(payload, null, 2));
    
    try {
      // Formato 1: Estrutura original esperada
      if (payload.event && payload.payment) {
        console.log('[AssetGateway] Detectado formato 1 (event + payment)');
        const asaasPayload = payload;
        const eventType = asaasPayload.event; // ex: "PAYMENT_CONFIRMED"
        const paymentData = asaasPayload.payment;

        const paymentId = String(paymentData.id);
        const newStatus = paymentData.status;
        
        // Tentar extrair orderId de externalReference ou description
        let orderId = paymentData.externalReference;
        if (!orderId && paymentData.description) {
            // Exemplo: se a descrição for "Pedido #123"
            const match = paymentData.description.match(/Pedido #(\w+)/);
            if (match && match[1]) {
                orderId = match[1];
            }
        }

        // Extrair client_id e gateway_id dos metadados
        let clientId = this.config.clientId;
        let gatewayId = this.config.gatewayId;
        
        if (typeof paymentData.metadata === 'string') {
          try {
            const metadata = JSON.parse(paymentData.metadata);
            clientId = metadata.client_id || clientId;
            gatewayId = metadata.gateway_id || gatewayId;
          } catch (e) {
            console.error("Failed to parse Asaas metadata string:", e);
          }
        }

        console.log(`[AssetGateway] Webhook processado (formato 1): eventType=${eventType}, paymentId=${paymentId}, newStatus=${newStatus}, orderId=${orderId}`);

        return {
          processed: true,
          eventType: eventType,
          paymentId: paymentId,
          orderId: orderId,
          newStatus: newStatus,
          clientId: clientId,
          gatewayId: gatewayId,
          originalPayload: paymentData
        };
      }
      // Formato 2: Novo formato observado nos logs (type=transaction)
      else if (payload.type === 'transaction' && payload.data) {
        console.log('[AssetGateway] Detectado formato 2 (type=transaction + data)');
        const transactionData = payload.data;
        const eventType = `TRANSACTION_${transactionData.status?.toUpperCase() || 'UNKNOWN'}`;
        const paymentId = String(transactionData.id);
        const newStatus = transactionData.status;
        
        // ===== LOGS DE DIAGNÓSTICO PARA SELLER =====
        console.log('[AssetGateway] 🔍 DIAGNÓSTICO SELLER - Analisando campos para identificação de seller:');
        console.log('[AssetGateway] 📊 CompanyId:', transactionData.companyId);
        console.log('[AssetGateway] 🏪 Origin:', transactionData.origin);
        
        // Analisar splits para identificar sellers
        if (transactionData.splits && Array.isArray(transactionData.splits)) {
          console.log('[AssetGateway] 💰 SPLITS encontrados:', transactionData.splits.length);
          transactionData.splits.forEach((split: any, index: number) => {
            console.log(`[AssetGateway] 💰 Split ${index + 1}:`, {
              recipientId: split.recipientId,
              amount: split.amount,
              netAmount: split.netAmount,
              chargeProcessingFee: split.chargeProcessingFee
            });
          });
        } else {
          console.log('[AssetGateway] ⚠️ Nenhum split encontrado no payload');
        }
        
        // Analisar metadados para seller
        if (transactionData.metadata) {
          try {
            const metadata = JSON.parse(transactionData.metadata);
            console.log('[AssetGateway] 📋 METADATA analisado:', {
              provider: metadata.provider,
              user_identification_number: metadata.user_identification_number,
              user_email: metadata.user_email,
              sell_url: metadata.sell_url,
              shop_url: metadata.shop_url
            });
            
            // Tentar extrair seller da URL de venda
            if (metadata.sell_url) {
              const urlMatch = metadata.sell_url.match(/https?:\/\/([^.]+)/);
              if (urlMatch && urlMatch[1]) {
                console.log('[AssetGateway] 🔗 Possível identificador de seller da URL:', urlMatch[1]);
              }
            }
          } catch (e) {
            console.log('[AssetGateway] ❌ Erro ao parsear metadata:', e);
          }
        }
        // ===== FIM DOS LOGS DE DIAGNÓSTICO =====
        
        // Tentar extrair orderId de externalRef
        let orderId = transactionData.externalRef;

        console.log(`[AssetGateway] 🔍 DEBUG ORDERID - paymentId: ${paymentId}`);
        console.log(`[AssetGateway] 🔍 DEBUG ORDERID - externalRef: ${transactionData.externalRef}`);
        console.log(`[AssetGateway] 🔍 DEBUG ORDERID - secureId: ${transactionData.secureId}`);
        console.log(`[AssetGateway] 🔍 DEBUG ORDERID - objectId: ${payload.objectId}`);

        // Se não tiver orderId, gerar um UUID baseado no secureId
        if (!orderId && transactionData.secureId) {
          // Namespace UUID fixo para gerar UUIDs consistentes
          const NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
          orderId = uuidv5(transactionData.secureId, NAMESPACE);
          console.log(`[AssetGateway] 🔍 DEBUG ORDERID - Gerado UUID v5 do secureId: ${orderId}`);
        }

        // Se ainda não tiver orderId, tentar usar objectId como base
        if (!orderId && payload.objectId) {
          const NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
          orderId = uuidv5(String(payload.objectId), NAMESPACE);
          console.log(`[AssetGateway] 🔍 DEBUG ORDERID - Gerado UUID v5 do objectId: ${orderId}`);
        }

        console.log(`[AssetGateway] 🔍 DEBUG ORDERID - Final orderId: ${orderId}`);

        // 🔍 DEBUG: Verificar dados de endereço antes de retornar
        console.log(`[AssetGateway] 🔍 DEBUG SHIPPING - transactionData.shipping:`, transactionData.shipping);
        console.log(`[AssetGateway] 🔍 DEBUG SHIPPING - transactionData.customer.address:`, transactionData.customer?.address);

        console.log(`[AssetGateway] Webhook processado (formato 2): eventType=${eventType}, paymentId=${paymentId}, newStatus=${newStatus}, orderId=${orderId}`);

        // Extrair informações de seller dos splits
        let sellerId = null;
        let sellerInfo = null;
        
        if (transactionData.splits && transactionData.splits.length > 0) {
          // Usar o primeiro recipientId como seller principal
          sellerId = transactionData.splits[0].recipientId;
          sellerInfo = {
            recipientId: sellerId,
            amount: transactionData.splits[0].amount,
            netAmount: transactionData.splits[0].netAmount
          };
          console.log('[AssetGateway] 🏪 Seller identificado via splits:', sellerId);
        }

        return {
          processed: true,
          eventType: eventType,
          paymentId: paymentId,
          orderId: orderId,
          newStatus: newStatus,
          clientId: this.config.clientId,
          gatewayId: this.config.gatewayId,
          originalPayload: transactionData,
          items: transactionData.items,
          customer: transactionData.customer,
          shipping: transactionData.shipping, // ✅ CORREÇÃO: Adicionar shipping!
          // Adicionar informações de seller
          sellerId: sellerId,
          sellerInfo: sellerInfo,
          companyId: transactionData.companyId,
          origin: transactionData.origin
        };
      }
      // Formato 3: Tentar processar qualquer payload com data.status
      else if (payload.data && payload.data.status) {
        console.log('[AssetGateway] Tentando processar formato alternativo (data.status)');
        const transactionData = payload.data;
        const eventType = `PAYMENT_${transactionData.status?.toUpperCase() || 'UNKNOWN'}`;
        const paymentId = String(transactionData.id || 'unknown');
        const newStatus = transactionData.status;
        
        // Tentar extrair orderId de várias fontes possíveis
        let orderId = transactionData.externalRef || transactionData.externalReference;
        
        // Se não tiver orderId, gerar um UUID baseado no secureId ou outro identificador
        if (!orderId) {
          // Namespace UUID fixo para gerar UUIDs consistentes
          const NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
          
          if (transactionData.secureId) {
            orderId = uuidv5(transactionData.secureId, NAMESPACE);
          } else if (payload.objectId) {
            orderId = uuidv5(payload.objectId, NAMESPACE);
          } else if (payload.id) {
            orderId = uuidv5(String(payload.id), NAMESPACE);
          }
        }

        console.log(`[AssetGateway] Webhook processado (formato alternativo): eventType=${eventType}, paymentId=${paymentId}, newStatus=${newStatus}, orderId=${orderId}`);

        return {
          processed: true,
          eventType: eventType,
          paymentId: paymentId,
          orderId: orderId,
          newStatus: newStatus,
          clientId: this.config.clientId,
          gatewayId: this.config.gatewayId,
          originalPayload: transactionData,
          items: transactionData.items,
          customer: transactionData.customer,
          shipping: transactionData.shipping // ✅ CORREÇÃO: Adicionar shipping também no formato alternativo!
        };
      }
      // Nenhum formato reconhecido
      else {
        console.error('[AssetGateway] Formato de webhook não reconhecido:', JSON.stringify(payload, null, 2));
        return {
          processed: false,
          eventType: 'unknown',
          error: 'Invalid Asaas webhook payload structure.',
          clientId: this.config.clientId,
          gatewayId: this.config.gatewayId
        };
      }
    } catch (error: any) {
      console.error('[AssetGateway] Erro ao processar webhook:', error);
      return {
        processed: false,
        eventType: 'error',
        error: `Error processing webhook: ${error.message || 'Unknown error'}`,
        clientId: this.config.clientId,
        gatewayId: this.config.gatewayId
      };
    }
    
  }

  /**
   * Validates Asaas webhook signature.
   * O Asaas normalmente usa um token estático ('asaas_webhook_token') enviado nos cabeçalhos para validação,
   * ou nenhuma assinatura complexa, confiando no sigilo da URL do webhook e na lista de permissões de IP.
   * Este é um placeholder; verifique a documentação do Asaas para o método de validação específico deles.
   * Se eles usarem uma assinatura HMAC, você precisará de crypto.
   */
  validateWebhookSignature(
    rawPayload: string | Buffer, // O Asaas pode não precisar do rawPayload se for uma verificação de token simples
    signatureHeader: string | undefined, // ex: req.headers['asaas-webhook-token']
    configuredSecret?: string // Opcional: se fornecido, substitui this.config.webhookSecret
  ): boolean {
    const webhookSecret = configuredSecret || this.config.webhookSecret;
    
    // Exemplo 1: Comparação simples de token (mais comum para integrações Asaas mais antigas)
    if (webhookSecret && signatureHeader) {
      if (signatureHeader === webhookSecret) {
        console.log(`[AssetGateway] Webhook token validated successfully for gateway ${this.config.gatewayId}.`);
        return true;
      } else {
        console.warn(`[AssetGateway] Webhook token mismatch for gateway ${this.config.gatewayId}.`);
        return false;
      }
    }
    
    // Exemplo 2: Se o Asaas usar HMAC (menos comum para eles, mais para Stripe/MP)
    // const crypto = require('crypto');
    // const hmac = crypto.createHmac('sha256', webhookSecret);
    // const digest = Buffer.from(hmac.update(rawPayload).digest('hex'), 'utf8');
    // const receivedSignature = Buffer.from(signatureHeader || '', 'utf8');
    // if (crypto.timingSafeEqual(digest, receivedSignature)) {
    //   return true;
    // }

    // Se o Asaas não tiver assinatura explícita e depender do sigilo da URL,
    // você pode sempre retornar true aqui e garantir que seu endpoint não seja publicamente adivinhável.
    // No entanto, isso não é recomendado por segurança.
    console.warn(`[AssetGateway] No signature validation performed or configured for Asaas webhook for gateway ${this.config.gatewayId}. This is insecure if the URL is public.`);
    return true; // Placeholder: Implemente a validação real do Asaas.
  }
}