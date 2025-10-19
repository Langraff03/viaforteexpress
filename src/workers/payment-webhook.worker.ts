// src/workers/payment-webhook.worker.ts

import { Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import { supabaseAdmin } from '../lib/server/supabaseAdmin'; // ✅ Backend seguro
import { queueEmail, generateTrackingCode } from '../lib/queue';
import { generateInvoice } from '../lib/invoiceService';
<<<<<<< HEAD
import { sendTrackingEmail, getEmailConfigByDomain, getFreelancerAdoreiEmailConfig } from '../lib/emailService';
import { GatewayUtils } from '../lib/gateways/GatewayUtils';
import type {
  FreelancerCheckoutConfig,
  ProcessedAdoreiData,
  EmailTemplateVariables
} from '../types/checkout';
=======
import { sendTrackingEmail } from '../lib/emailService';
import { GatewayUtils } from '../lib/gateways/GatewayUtils';
>>>>>>> 0f9b6501e96622621ca16e4187b05cd412977242

// Redis connection
const connection = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT) || 6379,
  maxRetriesPerRequest: null,
});

// Interface para os dados do job de webhook de pagamento
export interface PaymentWebhookJobData {
  gateway: string;
  event: string;
  payload: {
    id: string;
    customer_email: string;
    customer_name: string;
    amount: number;
    order_id?: string;
    client_id?: string;
    gateway_id?: string;
    is_physical_product?: boolean;
    has_shipping_address?: boolean;
<<<<<<< HEAD
    // Campos específicos para Adorei
    customer_phone?: string;
    customer_cpf?: string;
    freelancer_id?: string;
    freelancer_config?: FreelancerCheckoutConfig;
    processed_data?: ProcessedAdoreiData;
=======
>>>>>>> 0f9b6501e96622621ca16e4187b05cd412977242
    shipping?: {
      address?: {
        street?: string;
        number?: string;
        city?: string;
        state?: string;
        zipCode?: string;
        country?: string;
      };
    };
    customer?: {
      address?: {
        street?: string;
        number?: string;
        city?: string;
        state?: string;
        zipCode?: string;
        country?: string;
      };
    };
  };
}

<<<<<<< HEAD
/**
 * Processa template personalizado de email do freelancer
 */
async function processCustomEmailTemplate(
  template: string,
  variables: EmailTemplateVariables
): Promise<string> {
  let processedTemplate = template;
  
  // Substituir variáveis no template
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{{${key}}}`;
    processedTemplate = processedTemplate.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value || '');
  }
  
  return processedTemplate;
}

/**
 * Envia email personalizado para freelancer
 */
async function sendFreelancerEmail(
  config: FreelancerCheckoutConfig,
  orderData: any,
  trackingCode: string
): Promise<boolean> {
  try {
    console.log(`📧 [Freelancer] Enviando email com configuração personalizada...`);
    
    // ✅ NOVO: Usar configuração especial para freelancers Adorei
    // Se não tem domínio personalizado, usar chave padrão dos freelancers
    const emailConfig = config.email_domain_id
      ? await getEmailConfigByDomain(config.email_domain_id)
      : await getFreelancerAdoreiEmailConfig();
      
    console.log(`📧 [Freelancer] Usando configuração de email: ${emailConfig.fromEmail} (domínio: ${config.email_domain_id ? 'personalizado' : 'padrão freelancer'})`);
    
    const variables: EmailTemplateVariables = {
      customer_name: orderData.customer_name,
      tracking_code: trackingCode,
      order_id: orderData.id,
      order_number: orderData.payment_id,
      amount: `R$ ${(orderData.amount / 100).toFixed(2).replace('.', ',')}`,
      city: orderData.city,
      state: orderData.state,
      tracking_url: `${process.env.VITE_APP_URL || 'https://rastreio.viaforteexpress.com'}/tracking/${trackingCode}`,
      company_name: config.from_name || emailConfig.fromName,
      support_email: config.reply_to_email || emailConfig.replyToEmail,
      from_name: config.from_name || emailConfig.fromName
    };

    let emailContent: string;
    let emailSubject: string;

    if (config.email_template_type === 'custom' && config.custom_email_template) {
      // Usar template personalizado
      console.log(`📧 [Freelancer] Usando template personalizado`);
      emailContent = await processCustomEmailTemplate(config.custom_email_template, variables);
      emailSubject = `Pedido Confirmado - ${variables.tracking_code}`;
    } else {
      // Usar template padrão de rastreamento
      console.log(`📧 [Freelancer] Usando template padrão de rastreamento`);
      await sendTrackingEmail({
        id: orderData.id,
        tracking_code: trackingCode,
        customer_name: orderData.customer_name,
        customer_email: orderData.customer_email,
        status: orderData.status
      });
      return true;
    }

    // Enviar email personalizado usando Resend
    const { Resend } = require('resend');
    const resend = new Resend(emailConfig.resendApiKey);

    const emailOptions = {
      from: `${config.from_name || emailConfig.fromName} <${config.from_email || emailConfig.fromEmail}>`,
      to: [orderData.customer_email],
      replyTo: config.reply_to_email || emailConfig.replyToEmail,
      subject: emailSubject,
      html: emailContent
    };

    const response = await resend.emails.send(emailOptions);

    if (response.error) {
      throw response.error;
    }

    console.log(`✅ [Freelancer] Email personalizado enviado: ${response.data?.id}`);
    return true;
  } catch (error) {
    console.error(`❌ [Freelancer] Erro ao enviar email personalizado:`, error);
    throw error;
  }
}

/**
 * Processa webhook específico da Adorei para freelancers
 */
async function processAdoreiFreelancerWebhook(jobData: PaymentWebhookJobData): Promise<any> {
  const { payload } = jobData;
  const freelancerConfig = payload.freelancer_config!;
  const processedData = payload.processed_data!;
  
  console.log(`🎯 [Adorei] Iniciando processamento para freelancer: ${payload.freelancer_id}`);
  
  try {
    // Gerar código de rastreamento
    const trackingCode = generateTrackingCode();
    const orderId = payload.order_id || `adorei-${processedData.order_number}`;
    
    console.log(`📦 [Adorei] Código de rastreamento gerado: ${trackingCode}`);
    
    // Preparar dados do pedido
    const orderData = {
      id: orderId,
      payment_id: processedData.payment_id,
      customer_name: processedData.customer_name,
      customer_email: processedData.customer_email,
      customer_phone: processedData.customer_phone || null,
      customer_cpf: processedData.customer_cpf || null,
      amount: processedData.amount,
      status: 'paid',
      tracking_code: trackingCode,
      city: processedData.city,
      state: processedData.state,
      payment_status: 'paid',
      external_id: processedData.payment_id,
      created_by: payload.freelancer_id, // Vinculado ao freelancer
      // Usar gateway padrão mas manter referência ao freelancer
      client_id: '0ec3137d-ee68-4aba-82de-143b3c61516a',
      gateway_id: '7e7e93d9-fc1a-4ae0-b7ab-775494d57cad',
      redelivery_count: 0,
      // Dados adicionais da Adorei
      zipcode: processedData.zipcode,
      receiver: processedData.receiver,
      address_full: processedData.address_full,
      // Metadados
      gateway_source: 'adorei',
      merchant_id: processedData.merchant.id,
      merchant_alias: processedData.merchant.alias,
      adorei_order_number: processedData.order_number,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log(`📦 [Adorei] Salvando pedido no banco de dados...`);
    
    // Salvar pedido no banco
    const { data: insertedOrder, error } = await supabaseAdmin
      .from('orders')
      .insert([orderData])
      .select()
      .single();

    if (error) {
      console.error(`❌ [Adorei] Erro ao salvar pedido:`, error);
      throw new Error(`Erro ao salvar pedido: ${error.message}`);
    }

    console.log(`✅ [Adorei] Pedido salvo: ${insertedOrder.id}`);

    // Salvar itens do pedido (se disponíveis)
    if (processedData.original_payload.resource.items?.length > 0) {
      const orderItems = processedData.original_payload.resource.items.map(item => ({
        order_id: orderId,
        product_name: `Produto ${item.source_reference}`,
        quantity: item.quantity,
        unit_price: Math.round(item.price * 100), // Converter para centavos
        webhook_data: item
      }));

      await supabaseAdmin.from('order_items').insert(orderItems);
      console.log(`📦 [Adorei] ${orderItems.length} itens salvos para pedido ${orderId}`);
    }

    // Gerar nota fiscal (se necessário)
    let invoicePdfPath = null;
    try {
      console.log(`🧾 [Adorei] Gerando nota fiscal...`);
      
      const customerForInvoice = {
        name: processedData.customer_name,
        email: processedData.customer_email,
        address: {
          street: processedData.address_full,
          number: '',
          city: processedData.city,
          state: processedData.state,
          zipCode: processedData.zipcode,
          country: 'Brasil'
        }
      };

      const invoiceItems = processedData.original_payload.resource.items.map(item => ({
        title: `Produto ${item.source_reference}`,
        quantity: item.quantity,
        unitPrice: item.price
      }));

      if (invoiceItems.length === 0) {
        invoiceItems.push({
          title: 'Serviço',
          quantity: 1,
          unitPrice: processedData.amount / 100
        });
      }

      invoicePdfPath = await generateInvoice(orderId, customerForInvoice, invoiceItems);
      console.log(`✅ [Adorei] Nota fiscal gerada: ${invoicePdfPath}`);
    } catch (invoiceError) {
      console.error(`❌ [Adorei] Erro ao gerar nota fiscal:`, invoiceError);
      // Continuar mesmo se falhar a geração da nota fiscal
    }

    // Enviar email personalizado do freelancer
    let emailSentSuccessfully = false;
    try {
      console.log(`📧 [Adorei] Enviando email personalizado...`);
      
      emailSentSuccessfully = await sendFreelancerEmail(
        freelancerConfig,
        insertedOrder,
        trackingCode
      );
      
      console.log(`✅ [Adorei] Email personalizado enviado com sucesso`);
    } catch (emailError) {
      console.error(`❌ [Adorei] Erro ao enviar email personalizado:`, emailError);
      
      // Fallback: usar email padrão
      try {
        console.log(`📧 [Adorei] Tentando fallback com email padrão...`);
        await sendTrackingEmail({
          id: insertedOrder.id,
          tracking_code: trackingCode,
          customer_name: processedData.customer_name,
          customer_email: processedData.customer_email,
          status: 'paid'
        });
        emailSentSuccessfully = true;
        console.log(`✅ [Adorei] Email padrão (fallback) enviado`);
      } catch (fallbackError) {
        console.error(`❌ [Adorei] Erro no fallback de email:`, fallbackError);
      }
    }

    // Atualizar status do email no banco
    if (emailSentSuccessfully) {
      try {
        await supabaseAdmin
          .from('orders')
          .update({
            email_sent: true,
            email_sent_at: new Date().toISOString()
          })
          .eq('id', orderId);
          
        console.log(`✅ [Adorei] Status do email atualizado no banco`);
      } catch (updateError) {
        console.error(`❌ [Adorei] Erro ao atualizar status do email:`, updateError);
      }
    }

    console.log(`🎯 [Adorei] ✅ Processamento concluído com sucesso`);

    return {
      success: true,
      order_id: orderId,
      tracking_code: trackingCode,
      email_sent: emailSentSuccessfully,
      invoice_generated: !!invoicePdfPath,
      freelancer_id: payload.freelancer_id,
      gateway: 'adorei'
    };

  } catch (error) {
    console.error(`❌ [Adorei] Erro no processamento do webhook:`, error);
    throw error;
  }
}

=======
>>>>>>> 0f9b6501e96622621ca16e4187b05cd412977242
const paymentWebhookWorker = new Worker<PaymentWebhookJobData>(
  'payment-webhook',
  async (job: Job<PaymentWebhookJobData>) => {
    console.log(`📦 Processando pagamento:`, job.data);
    const { gateway, event, payload } = job.data;

    console.log(`📦 🔍 DEBUG PAYMENT - ID: ${payload.id}`);
<<<<<<< HEAD
    console.log(`📦 🔍 DEBUG PAYMENT - Gateway: ${gateway}`);
=======
>>>>>>> 0f9b6501e96622621ca16e4187b05cd412977242
    console.log(`📦 🔍 DEBUG PAYMENT - Order ID: ${payload.order_id}`);
    console.log(`📦 🔍 DEBUG PAYMENT - Customer Email: ${payload.customer_email}`);
    console.log(`📦 🔍 DEBUG PAYMENT - Customer Name: ${payload.customer_name}`);
    console.log(`📦 🔍 DEBUG PAYMENT - Amount: ${payload.amount}`);
<<<<<<< HEAD
    console.log(`📦 🔍 DEBUG PAYMENT - Freelancer ID: ${payload.freelancer_id}`);
=======
    console.log(`📦 🔍 DEBUG PAYMENT - Shipping Address:`, payload.shipping?.address);
    console.log(`📦 🔍 DEBUG PAYMENT - Customer Address:`, payload.customer?.address);
>>>>>>> 0f9b6501e96622621ca16e4187b05cd412977242

    // Verificar se é um evento de pagamento confirmado
    if (event !== 'payment.confirmed') {
      console.log(`Ignorando evento diferente de payment.confirmed: ${event}`);
      return { processed: true, ignored: true, reason: 'not_payment_confirmed' };
    }

    // Verificar se temos os dados necessários
    if (!payload.customer_email || !payload.customer_name) {
      console.error(`❌ Dados de cliente ausentes no payload para ID: ${payload.id}`);
      throw new Error('Dados de cliente ausentes no payload');
    }

<<<<<<< HEAD
    // ✅ NOVO: Processamento específico para Adorei (freelancers)
    const isAdoreiWebhook = gateway === 'adorei' && payload.freelancer_id && payload.freelancer_config;
    
    if (isAdoreiWebhook) {
      console.log(`🎯 [Adorei] Processando webhook de freelancer: ${payload.freelancer_id}`);
      return await processAdoreiFreelancerWebhook(job.data);
    }

=======
>>>>>>> 0f9b6501e96622621ca16e4187b05cd412977242
    // Verificar se o pedido tem endereço de entrega
    // ✅ CORREÇÃO: Manter compatibilidade com diferentes estruturas de endereço
    const payloadAny = payload as any; // Cast temporário para acessar estrutura real

    // Verificar múltiplas possibilidades de endereço (compatibilidade com diferentes gateways)
    const shippingStreet = payloadAny.shipping?.street || payloadAny.shipping?.address?.street;
    const customerStreet = payloadAny.customer?.address?.street;
    const shippingAddress = payloadAny.shipping?.address?.street || payloadAny.shipping?.street;
    const customerAddress = payloadAny.customer?.address?.street || payloadAny.customer?.street;

    // Validação permissiva: qualquer indicação de endereço é suficiente
    const hasAnyAddress = !!(shippingStreet || customerStreet || shippingAddress || customerAddress);
    // Remover linha duplicada

    // ✅ CORREÇÃO: Salvar TODOS os pedidos pagos, independente do endereço
    if (!hasAnyAddress) {
      console.log(`⚠️ Pedido sem endereço de entrega - salvando mesmo assim`);
    }

    // Verificar se o produto é físico (não é do tipo "info")
    let isPhysicalProduct = true; // Assume que é produto físico por padrão

    if (payload.order_id) {
      console.log(`📦 🔍 DEBUG PRODUCT - Verificando produto físico para order_id: ${payload.order_id}`);

      // Verificar no banco de dados se o produto é físico
      const { data: orderData, error: orderError } = await supabaseAdmin
        .from('orders')
        .select('product_type, is_physical')
        .eq('id', payload.order_id)
        .single();

      console.log(`📦 🔍 DEBUG PRODUCT - Consulta ao banco:`, { orderData, orderError });

      if (!orderError && orderData) {
        // Se o produto for do tipo "info" ou is_physical for false, não envia email
        if (orderData.product_type === 'info' || orderData.is_physical === false) {
          isPhysicalProduct = false;
          console.log(`⚠️ Ignorando produto não físico ou do tipo info:`, orderData.product_type);
          return { processed: true, ignored: true, reason: 'not_physical_product' };
        }
      } else {
        console.log(`⚠️ Erro ao consultar produto no banco ou pedido não encontrado:`, orderError);
        // Se não conseguir consultar, assume que é físico para não perder pedidos
      }
    } else {
      console.log(`⚠️ Order ID não fornecido, assumindo produto físico`);
    }

    // Gerar código de rastreio se não existir
    let trackingCode = null;
    let trackingUrl = null;

    if (payload.order_id) {
      // Verificar se o pedido já tem código de rastreio
      const { data: orderData, error: orderError } = await supabaseAdmin
        .from('orders')
        .select('tracking_code')
        .eq('id', payload.order_id)
        .single();

      if (!orderError && orderData && orderData.tracking_code) {
        trackingCode = orderData.tracking_code;
      } else {
        // Gerar novo código de rastreio
        trackingCode = generateTrackingCode();
        
        // Atualizar o pedido com o código de rastreio
        if (payload.order_id) {
          const { error: updateError } = await supabaseAdmin
            .from('orders')
            .update({
              tracking_code: trackingCode,
              status: 'paid'
            })
            .eq('id', payload.order_id);

          if (updateError) {
            console.error(`Erro ao atualizar código de rastreio:`, updateError);
          }
        }
      }

      // Gerar URL de rastreio
      // Usando a variável de ambiente para a URL base
      const baseUrl = process.env.VITE_APP_URL || 'https://rastreio.viaforteexpress.com';
      trackingUrl = `${baseUrl}/tracking/${trackingCode}`;
    }

    // Registrar informações do pagamento confirmado (sem dados pessoais)
    console.log(`💰 Pagamento confirmado: ${payload.id}, Order: ${payload.order_id || 'N/A'}`);

    // Extrair dados do cliente usando a lógica já existente
    const customerData = GatewayUtils.extractCustomerInfo(payload);

    // Log detalhado para debug
    if (!customerData?.phone && !customerData?.document) {
      console.log(`⚠️ AVISO: Nenhum dado de CPF/telefone encontrado no payload!`);
      console.log(`   Verifique se o webhook está enviando dados de customer.phone, customer.cpf, etc.`);
    }

    // Extrair endereço para salvar no pedido
    const address = payload.shipping?.address || payload.customer?.address;

    // Salvar o pedido no Supabase
    const orderData = {
      id: payload.order_id || `order-${payload.id}`,
      payment_id: payload.id,
      customer_name: payload.customer_name,
      customer_email: payload.customer_email,
      customer_phone: customerData?.phone || null,
      customer_cpf: customerData?.document || null,
      amount: payload.amount,
      status: 'paid',
      tracking_code: trackingCode,
      // Adicionar cidade de destino
      city: address?.city || null,
      // NOVOS CAMPOS: Informações de processamento
      has_shipping_address: hasAnyAddress,
      email_sent: false, // Será atualizado quando o email for enviado
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    try {
      const { error } = await supabaseAdmin
        .from('orders')
        .upsert(orderData);

      if (!error) {
        console.log(`✅ Pedido salvo no Supabase com sucesso!`);
      }
    } catch (err) {
      console.error(`Erro ao salvar pedido no Supabase:`, err);
    }

    // Gerar nota fiscal
    let invoicePdfPath = null;
    try {
      // Extrair dados do cliente para a nota fiscal
      const customerData = {
        name: payload.customer_name,
        email: payload.customer_email,
        address: {
          street: payloadAny.shipping?.address?.street || payloadAny.shipping?.street || payloadAny.customer?.address?.street || 'Rua não informada',
          number: payloadAny.shipping?.address?.number || payloadAny.shipping?.streetNumber || payloadAny.customer?.address?.number || 'S/N',
          city: payloadAny.shipping?.address?.city || payloadAny.shipping?.city || payloadAny.customer?.address?.city || 'Cidade não informada',
          state: payloadAny.shipping?.address?.state || payloadAny.shipping?.state || payloadAny.customer?.address?.state || 'UF',
          zipCode: payloadAny.shipping?.address?.zipCode || payloadAny.shipping?.zipCode || payloadAny.customer?.address?.zipCode || 'CEP não informado',
          country: payloadAny.shipping?.address?.country || payloadAny.customer?.address?.country || 'Brasil'
        }
      };

      // Extrair itens do pedido (se disponíveis)
      const orderItems = (payload as any).items || [
        {
          title: 'Produto',
          quantity: 1,
          unitPrice: payload.amount
        }
      ];

      // Gerar a nota fiscal
      console.log(`🧾 Gerando nota fiscal para pedido ${payload.order_id || payload.id}`);
      invoicePdfPath = await generateInvoice(
        payload.order_id || `order-${payload.id}`,
        customerData,
        orderItems
      );
      console.log(`✅ Nota fiscal gerada: ${invoicePdfPath}`);
    } catch (invoiceError) {
      console.error(`❌ Erro ao gerar nota fiscal:`, invoiceError);
      // Continuar mesmo se falhar a geração da nota fiscal
    }

    // ✅ CORREÇÃO: SÓ enviar email para produtos físicos (com endereço)
    let emailSentSuccessfully = false;

    if (hasAnyAddress) {
      console.log(`📦 Produto físico detectado - enviando email de rastreamento`);
      
      try {
        await sendTrackingEmail({
          id: payload.order_id || `order-${payload.id}`,
          tracking_code: trackingCode,
          customer_name: payload.customer_name,
          customer_email: payload.customer_email,
          status: 'paid'
        }, invoicePdfPath || undefined);

        emailSentSuccessfully = true;
        console.log(`📧 Email de rastreamento enviado com nota fiscal: ${payload.customer_email}`);
      } catch (emailError) {
        console.error(`❌ Erro ao enviar email com nota fiscal:`, emailError);

        // Fallback: enfileirar email sem nota fiscal se o envio direto falhar
        try {
          await queueEmail({
            to: payload.customer_email,
            subject: `Pedido Confirmado – Rastreio ${trackingCode}`,
            template: 'order_tracking',
            context: {
              order_id: payload.order_id || payload.id,
              customerName: payload.customer_name,
              trackingCode,
              statusText: 'Em Processamento',
              trackingUrl,
              year: new Date().getFullYear()
            }
          });
          emailSentSuccessfully = true;
          console.log(`📧 Email de rastreamento enfileirado (fallback): ${payload.customer_email}`);
        } catch (queueError) {
          console.error(`❌ Erro ao enfileirar email fallback:`, queueError);
        }
      }
    } else {
      console.log(`📱 Infoproduto detectado - NÃO enviando email de rastreamento`);
      console.log(`📦 Pedido salvo no banco normalmente com CPF/telefone`);
    }

    // Atualizar status do email no banco de dados
    if (emailSentSuccessfully && payload.order_id) {
      try {
        const { error: updateError } = await supabaseAdmin
          .from('orders')
          .update({
            email_sent: true,
            email_sent_at: new Date().toISOString()
          })
          .eq('id', payload.order_id);

        if (updateError) {
          console.error(`❌ Erro ao atualizar status do email:`, updateError);
        } else {
          console.log(`✅ Status do email atualizado no banco: ${payload.order_id}`);
        }
      } catch (updateErr) {
        console.error(`❌ Erro ao atualizar status do email:`, updateErr);
      }
    }

    console.log(`✅ Pagamento processado com sucesso (job.id=${job.id})`);

    return {
      success: true,
      emailSent: true,
      invoiceGenerated: !!invoicePdfPath,
      trackingCode,
      trackingUrl
    };
  },
  { connection }
);

// Event handlers
paymentWebhookWorker.on('completed', (job) => {
  console.log(`✅ Job de webhook de pagamento concluído (job.id=${job?.id})`);
});

paymentWebhookWorker.on('failed', (job, err) => {
  console.error(`❌ Job de webhook de pagamento falhou (job.id=${job?.id}):`, err);
});

export default paymentWebhookWorker;