/**
 * Teste de integração completa Shopify
 * Este arquivo testa o fluxo completo do webhook Shopify
 */

import { ShopifyGateway, ShopifyPaidOrder } from '../lib/gateways/ShopifyGateway';
import { GatewayRegistry } from '../lib/gateways/GatewayRegistry';
import crypto from 'crypto';

/**
 * Payload mock de um pedido pago da Shopify
 * Baseado na documentação oficial: https://shopify.dev/docs/api/admin-rest/2024-01/resources/order
 * Evento: orders/paid (enviado quando financial_status muda para "paid")
 */
const mockShopifyOrderPaid: ShopifyPaidOrder = {
  id: 450789469,
  name: "#1001",
  email: "bob.norman@hostmail.com",
  total_price: "598.94",
  subtotal_price: "598.94",
  total_tax: "0.00",
  currency: "USD",
  financial_status: "paid", // ✅ Condição obrigatória para orders/paid
  fulfillment_status: null,
  created_at: "2008-01-10T11:00:00-05:00",
  updated_at: "2008-01-10T11:00:00-05:00",
  order_number: 1001,
  customer: {
    id: 12345,
    email: "cliente@exemplo.com",
    first_name: "João",
    last_name: "Silva",
    phone: "+5511999887766",
    default_address: {
      address1: "Rua das Flores, 123",
      address2: "Apt 45",
      city: "São Paulo", 
      province: "SP",
      zip: "01234-567",
      country: "Brazil",
      phone: "+5511999887766"
    }
  },
  shipping_address: {
    address1: "Rua das Flores, 123",
    address2: "Apt 45",
    city: "São Paulo",
    province: "SP", 
    zip: "01234-567",
    country: "Brazil",
    phone: "+5511999887766"
  },
  billing_address: {
    address1: "Rua das Flores, 123",
    address2: "Apt 45",
    city: "São Paulo",
    province: "SP",
    zip: "01234-567", 
    country: "Brazil",
    phone: "+5511999887766"
  },
  line_items: [
    {
      id: 101,
      title: "Camiseta Premium",
      quantity: 2,
      price: "49.99",
      sku: "CAM-PREM-001", 
      variant_title: "Tamanho M / Cor Azul",
      vendor: "Loja Exemplo",
      product_id: 201,
      variant_id: 301,
      grams: 250
    },
    {
      id: 102,
      title: "Calça Jeans",
      quantity: 1,
      price: "50.01",
      sku: "CAL-JEANS-002",
      variant_title: "Tamanho 40",
      vendor: "Loja Exemplo", 
      product_id: 202,
      variant_id: 302,
      grams: 800
    }
  ]
};

/**
 * Testa se o ShopifyGateway está registrado corretamente
 */
export async function testGatewayRegistration() {
  console.log('🧪 [TEST] Testando registro do ShopifyGateway...');
  
  const isRegistered = GatewayRegistry.isRegistered('shopify');
  if (!isRegistered) {
    throw new Error('ShopifyGateway não está registrado no GatewayRegistry');
  }
  
  const gatewayInfo = GatewayRegistry.getGatewayInfo('shopify');
  if (!gatewayInfo) {
    throw new Error('Informações do ShopifyGateway não encontradas');
  }
  
  console.log('✅ [TEST] ShopifyGateway registrado com sucesso');
  console.log(`   - Nome: ${gatewayInfo.name}`);
  console.log(`   - Descrição: ${gatewayInfo.description}`);
  return true;
}

/**
 * Testa criação e processamento de webhook
 */
export async function testWebhookProcessing() {
  console.log('🧪 [TEST] Testando processamento de webhook...');
  
  const config = {
    webhookSecret: 'test_secret_123456',
    clientId: 'test_client_abc',
    gatewayId: 'shopify_test_gateway',
    shopDomain: 'loja-teste.myshopify.com'
  };
  
  const gateway = new ShopifyGateway(config);
  
  const result = await gateway.processWebhook(mockShopifyOrderPaid, {});
  
  if (!result.processed) {
    throw new Error(`Falha ao processar webhook: ${result.error}`);
  }
  
  console.log('✅ [TEST] Webhook processado com sucesso');
  console.log(`   - Evento: ${result.eventType}`);
  console.log(`   - Payment ID: ${result.paymentId}`);
  console.log(`   - Order ID: ${result.orderId}`);
  console.log(`   - Status: ${result.newStatus}`);
  console.log(`   - Cliente: ${result.customer?.name} (${result.customer?.email})`);
  console.log(`   - Endereço: ${result.shipping?.city}, ${result.shipping?.state}`);
  console.log(`   - Itens: ${result.items?.length} produto(s)`);
  
  return result;
}

/**
 * Testa validação de assinatura HMAC
 */
export async function testHmacValidation() {
  console.log('🧪 [TEST] Testando validação HMAC...');
  
  const secret = 'test_secret_123456';
  const payload = JSON.stringify(mockShopifyOrderPaid);
  
  // Gerar assinatura HMAC válida
  const validSignature = crypto
    .createHmac('sha256', secret)
    .update(payload, 'utf8')  
    .digest('base64');
    
  const config = {
    webhookSecret: secret,
    clientId: 'test_client',
    gatewayId: 'test_gateway'
  };
  
  const gateway = new ShopifyGateway(config);
  
  // Teste com assinatura válida
  const validResult = gateway.validateWebhookSignature(payload, validSignature, secret);
  if (!validResult) {
    throw new Error('Validação HMAC falhou para assinatura válida');
  }
  
  // Teste com assinatura inválida
  const invalidSignature = 'invalid_signature_abc123';
  const invalidResult = gateway.validateWebhookSignature(payload, invalidSignature, secret);
  if (invalidResult) {
    throw new Error('Validação HMAC passou para assinatura inválida');
  }
  
  console.log('✅ [TEST] Validação HMAC funcionando corretamente');
  console.log(`   - Assinatura válida: ✅ Aceita`);
  console.log(`   - Assinatura inválida: ❌ Rejeitada`);
  
  return true;
}

/**
 * Testa normalização de dados Shopify
 */
export async function testDataNormalization() {
  console.log('🧪 [TEST] Testando normalização de dados...');
  
  const config = {
    webhookSecret: 'test_secret',
    clientId: 'test_client', 
    gatewayId: 'test_gateway'
  };
  
  const gateway = new ShopifyGateway(config);
  const result = await gateway.processWebhook(mockShopifyOrderPaid, {});
  
  // Verificar se os dados foram normalizados corretamente
  const expectedTotal = Math.round(parseFloat(mockShopifyOrderPaid.total_price) * 100); // 14999 centavos
  
  if (result.originalPayload?.amount !== expectedTotal) {
    throw new Error(`Valor total incorreto. Esperado: ${expectedTotal}, Recebido: ${result.originalPayload?.amount}`);
  }
  
  if (!result.customer?.email || result.customer.email !== mockShopifyOrderPaid.email) {
    throw new Error('Email do cliente não normalizado corretamente');
  }
  
  if (!result.shipping?.city || result.shipping.city !== mockShopifyOrderPaid.shipping_address.city) {
    throw new Error('Endereço de entrega não normalizado corretamente');
  }
  
  if (!result.items || result.items.length !== mockShopifyOrderPaid.line_items.length) {
    throw new Error('Itens do pedido não normalizados corretamente');
  }
  
  console.log('✅ [TEST] Normalização de dados funcionando corretamente');
  console.log(`   - Valor total: R$ ${(expectedTotal / 100).toFixed(2)}`);
  console.log(`   - Cliente: ${result.customer.name} (${result.customer.email})`);
  console.log(`   - Endereço: ${result.shipping.city}, ${result.shipping.state}`);
  console.log(`   - Produtos: ${result.items.length} itens`);
  
  return true;
}

/**
 * Executa todos os testes
 */
export async function runAllTests() {
  console.log('🚀 Iniciando testes de integração Shopify...\n');
  
  try {
    await testGatewayRegistration();
    console.log('');
    
    await testWebhookProcessing(); 
    console.log('');
    
    await testHmacValidation();
    console.log('');
    
    await testDataNormalization();
    console.log('');
    
    console.log('🎉 Todos os testes passaram com sucesso!');
    console.log('✅ A integração Shopify está funcionando perfeitamente.');
    
    return true;
  } catch (error) {
    console.error('❌ Falha nos testes:', error);
    throw error;
  }
}

// Executar testes se o arquivo for executado diretamente
if (require.main === module) {
  runAllTests()
    .then(() => {
      console.log('\n🔚 Testes finalizados com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Erro nos testes:', error);
      process.exit(1);
    });
}