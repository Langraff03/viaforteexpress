// ============================================================================
// HANDLER: Webhooks da Adorei para Freelancers
// DESCRIÇÃO: Processa webhooks da plataforma Adorei para freelancers
// ============================================================================

import { Request, Response } from 'express';
import crypto from 'crypto';
import { supabaseAdmin } from '../../lib/server/supabaseAdmin';
import { queuePaymentWebhook } from '../../lib/queue';
import type { 
  AdoreiWebhookPayload, 
  FreelancerCheckoutConfig,
  ProcessedAdoreiData 
} from '../../types/checkout';

/**
 * Valida a assinatura do webhook da Adorei
 */
function validateAdoreiWebhookSignature(
  rawBody: string | Buffer,
  signature: string,
  secret: string
): boolean {
  if (!signature || !secret) {
    console.warn('[Adorei Webhook] Signature ou secret não fornecidos');
    return false;
  }

  try {
    // A Adorei usa diferentes formatos de assinatura
    const bodyString = typeof rawBody === 'string' ? rawBody : rawBody.toString();
    
    // Formato 1: HMAC-SHA256
    const expectedSignature1 = crypto
      .createHmac('sha256', secret)
      .update(bodyString)
      .digest('hex');
    
    // Formato 2: SHA1 (alguns gateways usam)
    const expectedSignature2 = crypto
      .createHmac('sha1', secret)
      .update(bodyString)
      .digest('hex');

    // Comparar com diferentes prefixos comuns
    const possibleSignatures = [
      signature,
      signature.replace('sha256=', ''),
      signature.replace('sha1=', ''),
    ];

    const expectedSignatures = [
      expectedSignature1,
      `sha256=${expectedSignature1}`,
      expectedSignature2,
      `sha1=${expectedSignature2}`,
    ];

    for (const possible of possibleSignatures) {
      for (const expected of expectedSignatures) {
        if (crypto.timingSafeEqual(
          Buffer.from(possible, 'hex'),
          Buffer.from(expected.replace(/^(sha256=|sha1=)/, ''), 'hex')
        )) {
          return true;
        }
      }
    }

    console.warn('[Adorei Webhook] Nenhuma assinatura válida encontrada');
    return false;
  } catch (error) {
    console.error('[Adorei Webhook] Erro ao validar assinatura:', error);
    return false;
  }
}

/**
 * Mapeia payload da Adorei para formato interno do sistema
 */
function mapAdoreiPayload(payload: AdoreiWebhookPayload): ProcessedAdoreiData {
  const resource = payload.resource;
  const customer = resource.customer;
  const address = resource.address;

  return {
    // Dados do cliente (mapeados)
    customer_name: `${customer.first_name} ${customer.last_name}`.trim(),
    customer_email: customer.email,
    customer_phone: customer.phone || undefined,
    customer_cpf: customer.doc || undefined,
    
    // Dados do pedido
    payment_id: resource.number.toString(),
    amount: Math.round(resource.value_total * 100), // Converter para centavos
    order_number: resource.number,
    
    // Dados de entrega
    city: address.city,
    state: address.uf,
    address_full: `${address.street}, ${address.number}`.trim(),
    zipcode: address.zipcode,
    receiver: address.receiver,
    
    // Metadados
    gateway: resource.gateway,
    payment_method: resource.payment_method,
    source: resource.source,
    tracking_info: resource.tracking,
    merchant: payload.merchant,
    original_payload: payload
  };
}

/**
 * Handler principal para webhooks da Adorei
 */
export const adoreiWebhookHandler = async (req: Request, res: Response) => {
  const freelancerId = req.params.freelancerId;
  
  console.log(`[Adorei Webhook] Recebido para freelancer: ${freelancerId}`);
  console.log(`[Adorei Webhook] Headers:`, JSON.stringify(req.headers, null, 2));
  console.log(`[Adorei Webhook] Body:`, JSON.stringify(req.body, null, 2));

  // Validações básicas
  if (!freelancerId) {
    console.error('[Adorei Webhook] freelancerId não fornecido na URL');
    return res.status(400).json({ 
      error: 'freelancerId é obrigatório na URL',
      received: false 
    });
  }

  // ✅ CORREÇÃO: Tratar webhook de teste da Adorei
  const requestBody = req.body;
  
  // Verificar se é um webhook de teste da Adorei
  if (requestBody.sucess === "Adoorei Webhook" || requestBody.success === "Adoorei Webhook") {
    console.log('[Adorei Webhook] ✅ Webhook de teste detectado - respondendo com sucesso');
    return res.status(200).json({ 
      received: true, 
      message: 'Webhook de teste recebido com sucesso',
      test: true,
      freelancer_id: freelancerId
    });
  }

  let payload: AdoreiWebhookPayload;
  try {
    payload = requestBody as AdoreiWebhookPayload;
    
    // Validar estrutura básica do payload (apenas para webhooks reais)
    if (!payload.event || !payload.resource || !payload.merchant) {
      throw new Error('Payload inválido - campos obrigatórios ausentes');
    }
  } catch (error) {
    console.error('[Adorei Webhook] Erro ao processar payload:', error);
    return res.status(400).json({ 
      error: 'Payload inválido',
      received: false 
    });
  }

  try {
    // 1. Buscar configuração do freelancer
    console.log(`[Adorei Webhook] Buscando configuração para freelancer: ${freelancerId}`);
    
    const { data: config, error: configError } = await supabaseAdmin
      .from('freelancer_checkout_configs')
      .select('*')
      .eq('user_id', freelancerId)
      .eq('checkout_type', 'adorei')
      .eq('is_active', true)
      .maybeSingle();

    if (configError) {
      console.error('[Adorei Webhook] Erro ao buscar configuração:', configError);
      return res.status(500).json({ 
        error: 'Erro interno ao buscar configuração',
        received: false 
      });
    }

    if (!config) {
      console.warn(`[Adorei Webhook] Configuração não encontrada para freelancer: ${freelancerId}`);
      return res.status(404).json({ 
        error: 'Configuração de checkout não encontrada para este freelancer',
        received: false 
      });
    }

    const freelancerConfig = config as FreelancerCheckoutConfig;
    console.log(`[Adorei Webhook] Configuração encontrada para freelancer: ${freelancerId}`);

    // 2. Validar assinatura do webhook (se configurada)
    if (freelancerConfig.webhook_secret) {
      const signature = req.headers['x-adoorei-hash'] as string ||
                       req.headers['x-adorei-signature'] as string ||
                       req.headers['x-signature'] as string ||
                       req.headers['authorization'] as string;
      
      const rawBody = (req as any).rawBody || JSON.stringify(req.body);
      
      if (!validateAdoreiWebhookSignature(rawBody, signature, freelancerConfig.webhook_secret)) {
        console.warn(`[Adorei Webhook] Assinatura inválida para freelancer: ${freelancerId}`);
        return res.status(401).json({ 
          error: 'Assinatura webhook inválida',
          received: false 
        });
      }
      
      console.log(`[Adorei Webhook] Assinatura validada para freelancer: ${freelancerId}`);
    } else {
      console.log(`[Adorei Webhook] Webhook sem validação de assinatura (modo desenvolvimento)`);
    }

    // 3. Verificar se é um evento que devemos processar
    const eventType = payload.event;
    const orderStatus = payload.resource.status;
    
    console.log(`[Adorei Webhook] Evento: ${eventType}, Status: ${orderStatus}`);
    
    // Processar apenas pedidos aprovados
    if (orderStatus !== 'approved' && !eventType.includes('approved')) {
      console.log(`[Adorei Webhook] Ignorando evento ${eventType} com status ${orderStatus}`);
      return res.status(200).json({ 
        received: true, 
        processed: false,
        reason: 'Event not processed - waiting for approval' 
      });
    }

    // 4. Mapear dados do payload
    console.log(`[Adorei Webhook] Mapeando dados do payload...`);
    const processedData = mapAdoreiPayload(payload);
    
    console.log(`[Adorei Webhook] Dados processados:`, {
      customer_name: processedData.customer_name,
      customer_email: processedData.customer_email,
      payment_id: processedData.payment_id,
      amount: processedData.amount,
      city: processedData.city
    });

    // 5. Enfileirar para processamento assíncrono
    console.log(`[Adorei Webhook] Enfileirando para processamento...`);
    
    const jobData = {
      freelancer_id: freelancerId,
      webhook_payload: payload,
      processed_data: processedData,
      config: freelancerConfig,
      received_at: new Date().toISOString()
    };

    try {
      await queuePaymentWebhook({
        gateway: 'adorei',
        event: 'payment.confirmed',
        payload: {
          id: payload.resource.number.toString(),
          customer_email: processedData.customer_email,
          customer_name: processedData.customer_name,
          customer_phone: processedData.customer_phone,
          customer_cpf: processedData.customer_cpf,
          amount: processedData.amount,
          order_id: `adorei-${payload.resource.number}`,
          freelancer_id: freelancerId,
          freelancer_config: freelancerConfig,
          processed_data: processedData,
          has_shipping_address: !!(processedData.address_full && processedData.city),
          shipping: {
            address: {
              street: payload.resource.address.street,
              number: payload.resource.address.number,
              city: payload.resource.address.city,
              state: payload.resource.address.uf,
              zipCode: payload.resource.address.zipcode
            }
          },
          customer: {
            address: {
              street: payload.resource.address.street,
              number: payload.resource.address.number,
              city: payload.resource.address.city,
              state: payload.resource.address.uf,
              zipCode: payload.resource.address.zipcode
            }
          }
        }
      });

      console.log(`[Adorei Webhook] ✅ Webhook enfileirado com sucesso para freelancer: ${freelancerId}`);
      
      return res.status(200).json({
        received: true,
        processed: true,
        freelancer_id: freelancerId,
        order_number: payload.resource.number,
        message: 'Webhook processado e enfileirado com sucesso'
      });

    } catch (queueError) {
      console.error(`[Adorei Webhook] Erro ao enfileirar webhook:`, queueError);
      return res.status(500).json({ 
        error: 'Erro ao enfileirar processamento',
        received: true,
        processed: false 
      });
    }

  } catch (error) {
    console.error(`[Adorei Webhook] Erro geral no processamento:`, error);
    return res.status(500).json({ 
      error: 'Erro interno do servidor',
      received: false 
    });
  }
};

/**
 * Middleware para logs detalhados de webhooks Adorei
 */
export const adoreiWebhookLogger = (req: Request, res: Response, next: any) => {
  const start = Date.now();
  const freelancerId = req.params.freelancerId;
  
  console.log(`[Adorei Webhook] Iniciando processamento para freelancer: ${freelancerId}`);
  console.log(`[Adorei Webhook] Método: ${req.method}, URL: ${req.originalUrl}`);
  console.log(`[Adorei Webhook] IP: ${req.ip}, User-Agent: ${req.headers['user-agent']}`);
  
  // Log da resposta
  const originalSend = res.send;
  res.send = function(data) {
    const duration = Date.now() - start;
    console.log(`[Adorei Webhook] Resposta enviada em ${duration}ms, Status: ${res.statusCode}`);
    console.log(`[Adorei Webhook] Dados da resposta:`, data);
    return originalSend.call(this, data);
  };
  
  next();
};