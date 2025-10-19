import { Request, Response } from 'express';
import { supabaseAdmin } from '../../lib/server/supabaseAdmin'; // ✅ Backend seguro
import { selectGateway, getGatewayForClient } from '../../lib/gateways/gatewaySelector';
import { GatewayRegistry } from '../../lib/gateways/GatewayRegistry';
import { getShopifyConfig } from '../../lib/shopifyConfig';
import { ShopifyWebhookProcessor } from '../../lib/shopifyWebhookProcessor';
import { validate as isValidUUID, v4 as uuidv4 } from 'uuid';
import { GatewayUtils } from '../../lib/gateways/GatewayUtils';
/**
 * Mapeia eventos específicos do Shopify para eventos padrão do sistema
 * @param shopifyEvent - Evento do webhook Shopify (ex: 'orders.paid')
 * @returns Evento padronizado para o sistema (ex: 'payment.confirmed')
 */
function mapShopifyEventToStandardEvent(shopifyEvent: string): string {
  const eventMapping: Record<string, string> = {
    'orders.paid': 'payment.confirmed',
    'orders.fulfilled': 'payment.confirmed',
    'orders.cancelled': 'payment.cancelled',
    'orders.partially_fulfilled': 'payment.confirmed'
  };
  
  const mappedEvent = eventMapping[shopifyEvent] || shopifyEvent;
  
  // Log do mapeamento para monitoramento
  if (eventMapping[shopifyEvent]) {
    console.log(`[Webhook] 🔄 Evento Shopify mapeado: "${shopifyEvent}" → "${mappedEvent}"`);
  } else {
    console.log(`[Webhook] ⚠️ Evento Shopify não mapeado: "${shopifyEvent}" (mantido como está)`);
  }
  
  return mappedEvent;
}

/**
 * Interface para produtos normalizados
 */
interface ProductItem {
  product_name: string;
  product_description?: string;
  product_code?: string;
  product_brand?: string;
  quantity: number;
  unit_price: number;
  weight_grams?: number;
  dimensions_cm?: string;
  product_category?: string;
  ncm_code?: string;
  webhook_data?: any;
}

/**
 * Normaliza dados de produtos de diferentes formatos de webhook
 */
function normalizeProductData(webhookData: any, totalAmount: number): ProductItem[] {
  const products: ProductItem[] = [];
  
  console.log(`[Webhook] 🔍 Normalizando produtos. Valor total: ${totalAmount} centavos (R$ ${(totalAmount/100).toFixed(2)})`);
  console.log(`[Webhook] Payload recebido:`, JSON.stringify(webhookData, null, 2));
  
  // Tentar diferentes formatos de webhook
  const productArrays = [
    webhookData.products,
    webhookData.items,
    webhookData.order_products,
    webhookData.line_items,
    webhookData.cart?.items
  ].filter(Boolean);
  
  // Se encontrou produtos estruturados
  for (const productArray of productArrays) {
    if (Array.isArray(productArray)) {
      for (const item of productArray) {
        console.log(`[Webhook] 📦 Processando item:`, JSON.stringify(item, null, 2));
        
        const product = {
          product_name: item.name || item.product_title || item.nome || item.title || 'Produto',
          product_description: item.description || item.product_description || item.descricao,
          product_code: item.sku || item.code || item.codigo_produto || item.product_code,
          product_brand: item.brand || item.marca,
          quantity: item.quantity || item.qty || item.quantidade || 1,
          unit_price: item.price || item.unit_value || item.valor_unitario || item.unit_price ||
                     item.valor || item.preco || item.amount || item.value || 0,
          weight_grams: item.weight || item.peso_gramas || item.weight_grams,
          dimensions_cm: item.dimensions || item.dimensoes,
          product_category: item.category || item.categoria || item.product_category,
          ncm_code: item.ncm || item.ncm_code,
          webhook_data: item
        };
        
        console.log(`[Webhook] ✅ Produto normalizado:`, {
          name: product.product_name,
          quantity: product.quantity,
          unit_price: product.unit_price,
          unit_price_reais: (product.unit_price / 100).toFixed(2)
        });
        
        products.push(product);
      }
    }
  }
  
  // 🔧 CORREÇÃO: Verificar se produtos têm preços válidos
  if (products.length > 0) {
    const totalProductPrice = products.reduce((sum, p) => sum + (p.unit_price * p.quantity), 0);
    
    console.log(`[Webhook] 💰 Total dos preços dos produtos: ${totalProductPrice} centavos (R$ ${(totalProductPrice/100).toFixed(2)})`);
    console.log(`[Webhook] 💰 Valor total do pedido: ${totalAmount} centavos (R$ ${(totalAmount/100).toFixed(2)})`);
    
    // Se nenhum produto tem preço ou total não confere
    if (totalProductPrice === 0 && totalAmount > 0) {
      console.log(`[Webhook] 🔧 CORREÇÃO: Produtos sem preço detectados. Distribuindo valor total entre ${products.length} produtos`);
      
      const totalQuantity = products.reduce((sum, p) => sum + p.quantity, 0);
      console.log(`[Webhook] 📊 Quantidade total de itens: ${totalQuantity}`);
      
      // Distribuir proporcionalmente por quantidade
      products.forEach((product, index) => {
        const proportion = product.quantity / totalQuantity;
        product.unit_price = Math.round((totalAmount * proportion) / product.quantity);
        
        console.log(`[Webhook] 📦 ${index + 1}. ${product.product_name}:`);
        console.log(`[Webhook]    - Quantidade: ${product.quantity}`);
        console.log(`[Webhook]    - Proporção: ${(proportion * 100).toFixed(1)}%`);
        console.log(`[Webhook]    - Preço unitário: ${product.unit_price} centavos (R$ ${(product.unit_price/100).toFixed(2)})`);
        console.log(`[Webhook]    - Total do item: ${product.unit_price * product.quantity} centavos (R$ ${(product.unit_price * product.quantity/100).toFixed(2)})`);
      });
      
      // Verificar se a soma confere (ajustar arredondamento se necessário)
      const newTotal = products.reduce((sum, p) => sum + (p.unit_price * p.quantity), 0);
      console.log(`[Webhook] 🧮 Novo total calculado: ${newTotal} centavos (R$ ${(newTotal/100).toFixed(2)})`);
      
      if (newTotal !== totalAmount) {
        const diff = totalAmount - newTotal;
        products[0].unit_price += diff;
        console.log(`[Webhook] ⚖️ Ajuste de arredondamento: +${diff} centavos no primeiro item`);
        console.log(`[Webhook] ✅ Primeiro item ajustado para: ${products[0].unit_price} centavos (R$ ${(products[0].unit_price/100).toFixed(2)})`);
      }
      
      // Log final dos produtos corrigidos
      console.log(`[Webhook] 🎯 Produtos finais após correção:`);
      products.forEach((product, index) => {
        console.log(`[Webhook]    ${index + 1}. ${product.product_name}: ${product.quantity}x R$ ${(product.unit_price/100).toFixed(2)} = R$ ${(product.unit_price * product.quantity/100).toFixed(2)}`);
      });
      
      const finalTotal = products.reduce((sum, p) => sum + (p.unit_price * p.quantity), 0);
      console.log(`[Webhook] 💯 Total final: R$ ${(finalTotal/100).toFixed(2)}`);
    } else if (totalProductPrice > 0) {
      console.log(`[Webhook] ✅ Produtos já têm preços válidos. Nenhuma correção necessária.`);
    }
  }
  
  // Se não encontrou produtos estruturados, criar produto padrão baseado no valor total
  if (products.length === 0) {
    console.log(`[Webhook] ⚠️ Nenhum produto estruturado encontrado, criando produto padrão`);
    products.push({
      product_name: 'Serviço de Transporte',
      product_description: 'Serviço de logística e transporte',
      quantity: 1,
      unit_price: totalAmount,
      product_category: 'logistica',
      webhook_data: { generated: true, original_payload: webhookData }
    });
    console.log(`[Webhook] 📦 Produto padrão criado: Serviço de Transporte - R$ ${(totalAmount/100).toFixed(2)}`);
  }
  
  console.log(`[Webhook] 🏁 Normalização concluída. ${products.length} produtos processados.`);
  return products;
}

/**
 * Salva produtos na tabela order_items
 */
async function saveOrderItems(orderId: string, products: ProductItem[]): Promise<void> {
  try {
    const orderItems = products.map(product => ({
      order_id: orderId,
      product_name: product.product_name,
      product_description: product.product_description,
      product_code: product.product_code,
      product_brand: product.product_brand,
      quantity: product.quantity,
      unit_price: product.unit_price,
      weight_grams: product.weight_grams,
      dimensions_cm: product.dimensions_cm,
      product_category: product.product_category,
      ncm_code: product.ncm_code,
      webhook_data: product.webhook_data
    }));
    
    const { error } = await supabaseAdmin
      .from('order_items')
      .insert(orderItems);
    
    if (error) {
      console.error(`[Webhook] Erro ao salvar produtos do pedido ${orderId}:`, error);
    } else {
      console.log(`[Webhook] ${products.length} produto(s) salvos para pedido ${orderId}`);
    }
  } catch (error) {
    console.error(`[Webhook] Erro ao processar produtos do pedido ${orderId}:`, error);
  }
}

/**
 * Gera um código de rastreamento único
 * @returns string Código de rastreamento no formato TRK-XXXXXXXX
 */
function generateTrackingCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export const genericWebhookHandler = async (req: Request, res: Response) => {
  const gatewayType = req.params.gatewayName;
  // ClientID pode vir da URL, query param, ou derivado do payload, ou usar valor padrão
  let clientId = req.query.client_id as string || req.body.client_id || 'default';
  
  // Valor de clientId para log (antes de substituir "default" por UUID válido)
  const clientIdForLog = clientId;
  
  console.log(`[Webhook] Recebido para gateway: ${gatewayType}, cliente: ${clientIdForLog}, URL: ${req.originalUrl}`);
  console.log('[Webhook] Headers:', JSON.stringify(req.headers, null, 2));
  console.log('[Webhook] Body:', JSON.stringify(req.body, null, 2));

  if (!gatewayType) {
    return res.status(400).json({ error: 'Identificador de gateway ausente na URL.' });
  }
  
  // Verificar se o gateway está registrado no sistema
  if (!GatewayRegistry.isRegistered(gatewayType)) {
    const availableGateways = GatewayRegistry.getAvailableGateways();
    console.warn(`[Webhook] Tipo de gateway não suportado: ${gatewayType}. Gateways disponíveis: ${availableGateways.join(', ')}`);
    return res.status(400).json({
      error: `Gateway '${gatewayType}' não está registrado no sistema.`,
      availableGateways: availableGateways
    });
  }

  // Logar se não foi fornecido client_id, mas continuar o processamento
  if (!req.query.client_id && !req.body.client_id) {
    console.warn(`[Webhook] client_id não fornecido, usando valor padrão "default"`);
  }

  try {
    // ===== TRATAMENTO ESPECIAL PARA SHOPIFY =====
    if (gatewayType === 'shopify') {
      console.log(`[Webhook] 🛍️ Processando webhook Shopify (integração e-commerce)`);
      
      // Buscar configuração Shopify do freelancer
      const shopifyConfig = await getShopifyConfig(clientId);
      
      if (!shopifyConfig) {
        console.error(`[Webhook] ❌ Configuração Shopify não encontrada para usuário: ${clientId}`);
        return res.status(400).json({
          error: 'Configuração Shopify não encontrada para este usuário',
          clientId: clientId
        });
      }
      
      console.log(`[Webhook] ✅ Configuração Shopify encontrada para: ${shopifyConfig.shop_domain || 'loja'}`);
      
      // Validar HMAC da Shopify
      const signature = req.headers['x-shopify-hmac-sha256'] as string;
      const rawBody = (req as any).rawBody || JSON.stringify(req.body);
      
      if (!ShopifyWebhookProcessor.validateWebhookSignature(rawBody, signature, shopifyConfig.webhook_secret)) {
        console.warn(`[Webhook] ❌ Assinatura HMAC Shopify inválida para usuário: ${clientId}`);
        return res.status(401).json({ error: 'Assinatura webhook inválida' });
      }
      
      // Processar webhook Shopify
      const processingResult = await ShopifyWebhookProcessor.processOrderPaidWebhook(req.body);
      
      if (!processingResult.processed) {
        console.log(`[Webhook] ⚠️ Webhook Shopify não processado: ${processingResult.error}`);
        return res.status(200).json({ received: true, processed: false, error: processingResult.error });
      }
      
      const order = processingResult.order!;
      console.log(`[Webhook] ✅ Pedido Shopify processado: ${order.id}`);
      
      // ✅ SOLUÇÃO DEFINITIVA: Usar user_id real da configuração Shopify
      const realUserId = shopifyConfig.user_id;
      console.log(`[DEBUG] Usando user_id real da configuração: ${realUserId}`);
      
      // Buscar gateway Asset do usuário REAL, não do clientId do webhook
      console.log(`[DEBUG] Buscando gateway Asset para usuário real: ${realUserId}`);
      
      const { data: gatewayData, error: gatewayError } = await supabaseAdmin
        .from('gateways')
        .select('id, client_id')
        .eq('client_id', realUserId)
        .eq('type', 'asset')
        .eq('is_active', true)
        .single();
      
      console.log(`[DEBUG] Resultado busca gateway:`, { gatewayData, gatewayError });
      
      let assetGatewayId;
      let validClientId;
      
      if (gatewayError || !gatewayData) {
        console.warn(`[Webhook] Gateway Asset não encontrado para usuário real ${realUserId}`);
        console.log(`[DEBUG] Erro do gateway:`, gatewayError);
        
        // ✅ FALLBACK ROBUSTO: Usar gateway padrão mas manter usuário real
        assetGatewayId = '7e7e93d9-fc1a-4ae0-b7ab-775494d57cad'; // Gateway padrão
        validClientId = '0ec3137d-ee68-4aba-82de-143b3c61516a'; // Cliente padrão (deve existir)
        console.log(`[DEBUG] Usando gateway_id padrão: ${assetGatewayId}`);
        console.log(`[DEBUG] Usando client_id padrão: ${validClientId}`);
      } else {
        assetGatewayId = gatewayData.id;
        validClientId = gatewayData.client_id;
        console.log(`[Webhook] ✅ Gateway Asset encontrado: ${assetGatewayId}, client_id: ${validClientId}`);
      }
      
      console.log(`[DEBUG] Final values - Gateway ID: ${assetGatewayId}, Client ID: ${validClientId}, Created By: ${realUserId}`);

      // Criar pedido no banco de dados
      const newOrderId = uuidv4(); // ✅ Gerar UUID válido
      const trackingCode = generateTrackingCode();
      // Extrair dados do cliente usando a lógica já existente
      const customerData = GatewayUtils.extractCustomerInfo(order);
      console.log(`[Webhook] 🔍 DEBUG CUSTOMER DATA Shopify - Extraído: phone=${customerData?.phone}, cpf=${customerData?.document}`);
      
      const newOrder = {
        id: newOrderId, // ✅ UUID válido
        payment_id: order.id.toString(), // ✅ ID Shopify como string
        payment_status: 'paid',
        client_id: validClientId, // ID do cliente válido do gateway
        created_by: realUserId, // ✅ CRÍTICO: Usuário real que configurou Shopify
        gateway_id: assetGatewayId, // ✅ UUID do gateway Asset
        customer_name: order.customer_name,
        customer_email: order.customer_email,
        customer_phone: customerData?.phone || null,
        customer_cpf: customerData?.document || null,
        amount: order.amount,
        status: 'paid',
        tracking_code: trackingCode,
        city: order.shipping.city,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      console.log(`[Webhook] 📦 Criando pedido Shopify: ${newOrderId} com código: ${trackingCode}`);
      
      const { data: insertedOrder, error: insertError } = await supabaseAdmin
        .from('orders')
        .insert(newOrder)
        .select()
        .single();
        
      if (insertError) {
        console.error(`[Webhook] ❌ Erro ao criar pedido Shopify:`, insertError);
        return res.status(500).json({ error: 'Erro interno ao processar pedido' });
      }
      
      console.log(`[Webhook] ✅ Pedido Shopify criado: ${insertedOrder.id}`);
      
      // Salvar itens do pedido
      const orderItems = order.items.map(item => ({
        order_id: newOrderId,
        product_name: item.name,
        quantity: item.quantity,
        unit_price: item.price,
        product_code: item.sku,
        webhook_data: item
      }));
      
      await supabaseAdmin.from('order_items').insert(orderItems);
      console.log(`[Webhook] 📦 ${order.items.length} itens salvos para pedido ${newOrderId}`);
            // Enfileirar email de rastreamento
            console.log(`[DEBUG] Iniciando enfileiramento de email...`);
            console.log(`[DEBUG] Dados para email:`, {
              customer_email: order.customer_email,
              customer_name: order.customer_name,
              order_id: newOrderId,
              tracking_code: trackingCode,
              amount: order.amount
            });
      
            try {
              const { queuePaymentWebhook } = require('../../lib/queue');
              console.log(`[DEBUG] Função queuePaymentWebhook carregada`);
      
              const originalEvent = 'orders.paid';
              const mappedEvent = mapShopifyEventToStandardEvent(originalEvent);
              
              const emailPayload = {
                gateway: 'shopify',
                event: mappedEvent,
                payload: {
                  id: order.id,
                  customer_email: order.customer_email,
                  customer_name: order.customer_name,
                  amount: order.amount,
                  order_id: newOrderId,
                  tracking_code: trackingCode,
                  shipping: order.shipping,
                  customer: {
                    address: order.shipping
                  }
                }
              };
      
              console.log(`[DEBUG] Payload completo para email:`, JSON.stringify(emailPayload, null, 2));
      
              const result = await queuePaymentWebhook(emailPayload);
              console.log(`[DEBUG] Resultado do queuePaymentWebhook:`, result);
      
              console.log(`[Webhook] 📧 Email de rastreamento enfileirado para: ${order.customer_email}`);
            } catch (queueError: any) {
              console.error(`[Webhook] ❌ Erro ao enfileirar email:`, queueError);
              console.error(`[DEBUG] Stack trace:`, queueError.stack);
            }

            // ✅ NOVO: Processar fulfillment automático na Shopify
            console.log(`\n[Webhook] 🔍 Verificando configuração de fulfillment automático...`);
            
            if (shopifyConfig.auto_fulfill !== false) {
              console.log(`[Webhook] ✅ Auto-fulfill ativado, verificando credenciais...`);
              
              if (shopifyConfig.shop_url && shopifyConfig.api_access_token) {
                console.log(`[Webhook] ✅ Credenciais encontradas, iniciando fulfillment...`);
                console.log(`[Webhook] - Loja: ${shopifyConfig.shop_url}`);
                console.log(`[Webhook] - Transportadora: ${shopifyConfig.tracking_company || 'Custom'}`);
                
                try {
                  const { processShopifyFulfillment, validateFulfillmentConfig } = await import('../../lib/shopifyFulfillment');
                  
                  // Validar configuração
                  if (!validateFulfillmentConfig(shopifyConfig)) {
                    console.warn(`[Webhook] ⚠️ Configuração de fulfillment inválida ou incompleta`);
                  } else {
                    // Processar fulfillment
                    const trackingUrl = `${process.env.VITE_APP_URL || 'https://viaforteexpress.com'}/rastreamento/${trackingCode}`;
                    
                    const fulfillmentResult = await processShopifyFulfillment({
                      shopifyOrderId: parseInt(order.id.toString()),
                      trackingCode: trackingCode,
                      trackingUrl: trackingUrl,
                      config: {
                        shop_url: shopifyConfig.shop_url,
                        api_access_token: shopifyConfig.api_access_token,
                        api_version: '2024-01'
                      },
                      trackingCompany: shopifyConfig.tracking_company || 'Custom',
                      lineItems: order.items
                    });
                    
                    if (fulfillmentResult.success) {
                      console.log(`[Webhook] ✅ Fulfillment criado com sucesso na Shopify!`);
                      console.log(`[Webhook] - Fulfillment ID: ${fulfillmentResult.fulfillmentId}`);
                      console.log(`[Webhook] 📧 Shopify enviará email de confirmação ao cliente`);
                    } else {
                      console.error(`[Webhook] ❌ Falha ao criar fulfillment: ${fulfillmentResult.error}`);
                    }
                  }
                } catch (fulfillmentError: any) {
                  console.error(`[Webhook] ❌ Erro ao processar fulfillment:`, fulfillmentError.message);
                  console.error(`[Webhook] Stack:`, fulfillmentError.stack);
                  // NÃO falhar o webhook - pedido e email já foram criados com sucesso
                }
              } else {
                console.log(`[Webhook] ⚠️ Credenciais de API não configuradas`);
                console.log(`[Webhook] - shop_url: ${shopifyConfig.shop_url ? 'OK' : 'FALTANDO'}`);
                console.log(`[Webhook] - api_access_token: ${shopifyConfig.api_access_token ? 'OK' : 'FALTANDO'}`);
              }
            } else {
              console.log(`[Webhook] ℹ️ Auto-fulfill desativado pelo usuário`);
            }

      return res.status(200).json({
        received: true,
        processed: true,
        orderId: newOrderId,
        trackingCode: trackingCode
      });
    }
    
    // ===== TRATAMENTO NORMAL PARA GATEWAYS DE PAGAMENTO =====
    let gatewayInstance;
    
    // Se o clientId for "default", use um UUID válido para o fallback
    if (clientId === 'default') {
      console.log(`[Webhook] Usando gateway padrão para ${gatewayType}`);
      // Usar o UUID do cliente padrão que criamos
      gatewayInstance = await getGatewayForClient('0ec3137d-ee68-4aba-82de-143b3c61516a');
    } else {
      gatewayInstance = await selectGateway(clientId, gatewayType);
    }
    
    // 1. Validar assinatura do webhook (se o método existir no gateway)
    // 1. Validar assinatura do webhook usando o segredo da instância do gateway já configurada
    // Validação de assinatura mais flexível para desenvolvimento
    if (gatewayInstance.validateWebhookSignature) {
      const secret = gatewayInstance.config.webhookSecret;
      if (!secret) {
        console.warn(`[Webhook] Secret não configurado na instância do gateway para ${gatewayType}, client ${clientId}. Prosseguindo sem validação.`);
      } else {
        const rawBody = (req as any).rawBody || JSON.stringify(req.body);
        
        // Verificar múltiplos headers possíveis que os gateways podem usar
        const signature = req.headers['asaas-webhook-token'] as string ||
                         req.headers['x-signature'] as string ||
                         req.headers['x-asaas-signature'] as string ||
                         req.headers['authorization'] as string ||
                         req.headers['x-webhook-signature'] as string ||
                         req.headers['x-shopify-hmac-sha256'] as string; // ✅ Adicionado para Shopify
  
        if (!signature) {
          console.warn(`[Webhook] Nenhum cabeçalho de assinatura encontrado. Prosseguindo sem validação (modo desenvolvimento).`);
          console.log(`[Webhook] Headers disponíveis:`, Object.keys(req.headers));
        } else {
          console.log(`[Webhook] Header de assinatura encontrado: ${signature.substring(0, 20)}...`);
          if (!gatewayInstance.validateWebhookSignature(rawBody, signature, secret)) {
            console.warn(`[Webhook] Assinatura inválida para ${gatewayType}, client ${clientId}. Prosseguindo mesmo assim (modo desenvolvimento).`);
          } else {
            console.log(`[Webhook] Assinatura validada para ${gatewayType}, client ${clientId}.`);
          }
        }
      }
    } else {
      console.warn(`[Webhook] Nenhum método de validação de assinatura encontrado para o gateway: ${gatewayType}. Prosseguindo sem validação.`);
    }
    const processingResult = await gatewayInstance.processWebhook(req.body, req.headers);

    if (!processingResult.processed) {
      console.error(`[Webhook] Gateway ${gatewayType} failed to process webhook:`, processingResult.error, processingResult);
      // Return 200 still, as the webhook was received, but processing failed internally.
      // Some gateways retry on non-2xx, so be careful.
      return res.status(200).json({ received: true, processed: false, error: processingResult.error || 'Gateway processing error.' });
    }

    console.log(`[Webhook] Gateway ${gatewayType} processed successfully:`, processingResult);
    // 3. Update Supabase based on processingResult (paymentId, newStatus, orderId)
    if (processingResult.paymentId && processingResult.newStatus) {
      try {
        // Verificar se o pedido existe
        let orderExists = false;
        let existingOrderId = null;
        
        // Verificar pelo orderId se for um UUID válido
        if (processingResult.orderId && isValidUUID(processingResult.orderId)) {
          const { data: orderData, error: orderError } = await supabaseAdmin
            .from('orders')
            .select('id')
            .eq('id', processingResult.orderId)
            .maybeSingle();
            
          if (!orderError && orderData) {
            orderExists = true;
            existingOrderId = orderData.id;
            console.log(`[Webhook] Pedido encontrado pelo ID: ${existingOrderId}`);
          }
        }
        
        // Se não encontrou pelo orderId, verificar pelo payment_id
        if (!orderExists) {
          const { data: orderData, error: orderError } = await supabaseAdmin
            .from('orders')
            .select('id')
            .eq('payment_id', processingResult.paymentId)
            .maybeSingle();
            
          if (!orderError && orderData) {
            orderExists = true;
            existingOrderId = orderData.id;
            console.log(`[Webhook] Pedido encontrado pelo payment_id: ${existingOrderId}`);
          }
        }
        
        // Payload para atualização
        const updatePayload: { payment_status: string; updated_at: string } = {
          payment_status: processingResult.newStatus,
          updated_at: new Date().toISOString(),
        };
        
        if (orderExists) {
          // Atualizar pedido existente
          console.log(`[Webhook] Atualizando pedido existente: ${existingOrderId}`);
          const { data: updatedOrder, error: updateError } = await supabaseAdmin
            .from('orders')
            .update(updatePayload)
            .eq('id', existingOrderId)
            .select()
            .single();
            
          if (updateError) {
            console.error(`[Webhook] Erro ao atualizar pedido no Supabase:`, updateError);
          } else {
            console.log(`[Webhook] Pedido ${updatedOrder?.id} atualizado no Supabase para status: ${processingResult.newStatus}`);

            // 🔍 DEBUG: Verificar dados de endereço para pedido existente
            console.log(`[Webhook] 🔍 DEBUG EXISTING ORDER - processingResult.shipping:`, processingResult.shipping);
            console.log(`[Webhook] 🔍 DEBUG EXISTING ORDER - processingResult.customer:`, processingResult.customer);

            // ✅ CORREÇÃO: Enfileirar email para pedidos existentes também!
            if (updatedOrder && processingResult.newStatus === 'paid') {
              try {
                const { queuePaymentWebhook } = require('../../lib/queue');

                await queuePaymentWebhook({
                  gateway: gatewayType,
                  event: 'payment.confirmed',
                  payload: {
                    id: processingResult.paymentId,
                    customer_email: updatedOrder.customer_email,
                    customer_name: updatedOrder.customer_name,
                    amount: updatedOrder.amount,
                    order_id: updatedOrder.id,
                    shipping: processingResult.shipping, // ✅ Usar shipping do processingResult!
                    customer: {
                      address: processingResult.customer?.address,
                      phone: (processingResult.customer as any)?.phone,      // ✅ ADICIONAR TELEFONE
                      document: (processingResult.customer as any)?.document  // ✅ ADICIONAR CPF
                    }
                  }
                });

                console.log(`[Webhook] ✅ Email enfileirado para pedido existente: ${updatedOrder.customer_email}`);
              } catch (queueError) {
                console.error(`[Webhook] ❌ Erro ao enfileirar email para pedido existente:`, queueError);
              }
            }
          }
        } else {
          // Verificar se o status é "paid" (ou equivalente) antes de criar o pedido
          const isPaid = processingResult.newStatus.toLowerCase() === 'paid' ||
                        processingResult.newStatus.toLowerCase() === 'confirmed' ||
                        processingResult.newStatus.toLowerCase() === 'approved';
          
          if (isPaid) {
            // Criar novo pedido apenas se estiver pago
            console.log(`[Webhook] Pedido pago não encontrado. Criando novo pedido para paymentId: ${processingResult.paymentId}`);
            
            // Extrair informações do cliente e itens do payload
            const customer = processingResult.customer || {};
            const items = processingResult.items || [];
            const originalPayload = processingResult.originalPayload || {};
            
            // Preparar dados para inserção
            const newOrderId = processingResult.orderId && isValidUUID(processingResult.orderId)
              ? processingResult.orderId
              : uuidv4(); // Gerar UUID se não tiver um válido
              
            // Gerar código de rastreamento único
            const trackingCode = generateTrackingCode();
            
            const newOrder = {
              id: newOrderId,
              payment_id: processingResult.paymentId,
              payment_status: processingResult.newStatus,
              client_id: gatewayInstance.config.clientId,
              gateway_id: gatewayInstance.config.gatewayId,
              customer_name: customer.name || 'Cliente',
              customer_email: customer.email || 'cliente@exemplo.com',
              amount: originalPayload.amount || 0,
              status: 'paid', // Usando 'paid' já que foi adicionado ao banco de dados
              tracking_code: trackingCode, // Código de rastreamento gerado
              // Adicionar cidade de destino
              city: customer.address?.city || null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
              // Removido product_description pois não existe na tabela
            };
            
            console.log(`[Webhook] Gerando código de rastreamento: ${trackingCode} para pedido: ${newOrderId}`);
            
            const { data: insertedOrder, error: insertError } = await supabaseAdmin
              .from('orders')
              .insert(newOrder)
              .select()
              .single();
              
            if (insertError) {
              console.error(`[Webhook] Erro ao inserir novo pedido no Supabase:`, insertError);
            } else {
              console.log(`[Webhook] Novo pedido ${insertedOrder?.id} criado no Supabase com status: ${processingResult.newStatus}`);
              
              // Processar e salvar produtos do pedido
              const products = normalizeProductData(originalPayload, originalPayload.amount || 0);
              await saveOrderItems(insertedOrder.id, products);
              
              // Enfileirar email para o novo pedido se tiver endereço
              if (customer && customer.email && (customer.address || originalPayload.shipping)) {
                try {
                  const { queuePaymentWebhook } = require('../../lib/queue');

                  // 🔍 DEBUG: Verificar dados de endereço antes de enfileirar
                  console.log(`[Webhook] 🔍 DEBUG EMAIL QUEUE - customer.address:`, customer.address);
                  console.log(`[Webhook] 🔍 DEBUG EMAIL QUEUE - originalPayload.shipping:`, originalPayload.shipping);
                  console.log(`[Webhook] 🔍 DEBUG EMAIL QUEUE - processingResult.shipping:`, processingResult.shipping);

                  await queuePaymentWebhook({
                    gateway: gatewayType,
                    event: 'payment.confirmed',
                    payload: {
                      id: processingResult.paymentId,
                      customer_email: customer.email,
                      customer_name: customer.name || '',
                      amount: originalPayload.amount || 0,
                      order_id: newOrderId,
                      shipping: processingResult.shipping || originalPayload.shipping, // ✅ Usar processingResult.shipping!
                      customer: {
                        address: customer.address,
                        phone: (customer as any).phone,      // ✅ ADICIONAR TELEFONE
                        document: (customer as any).document  // ✅ ADICIONAR CPF
                      }
                    }
                  });

                  console.log(`[Webhook] Email de confirmação enfileirado para: ${customer.email}`);
                } catch (queueError) {
                  console.error(`[Webhook] Erro ao enfileirar email:`, queueError);
                }
              }
            }
          } else {
            console.log(`[Webhook] Ignorando pedido não pago com status: ${processingResult.newStatus}`);
          }
        }
      } catch (error) {
        console.error(`[Webhook] Erro ao processar pedido:`, error);
      }
    } else {
      console.warn(`[Webhook] No paymentId or newStatus from ${gatewayType} processing, Supabase not updated.`);
    }

    return res.status(200).json({ received: true, processed: true, details: processingResult });

  } catch (error: any) {
    console.error(`[Webhook] Critical error in genericWebhookHandler for ${gatewayType}:`, error.message, error.stack);
    return res.status(500).json({ error: 'Internal server error handling webhook.' });
  }
};

// This handler would be registered in your Express app:
// import { genericWebhookHandler } from './handlers/genericWebhookHandler';
// app.post('/api/webhooks/:gatewayName', express.raw({type: 'application/json'}), genericWebhookHandler);
// Or if clientId is in path:
// app.post('/api/webhooks/:gatewayName/:clientId', express.raw({type: 'application/json'}), genericWebhookHandler);
// Note: express.raw() is important for some signature validations that need the raw body.