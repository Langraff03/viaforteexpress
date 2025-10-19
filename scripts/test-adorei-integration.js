#!/usr/bin/env node

// ============================================================================
// SCRIPT DE TESTE: Integração Completa Adorei
// DESCRIÇÃO: Testa o fluxo completo de webhook da Adorei
// ============================================================================

const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

// Configuração
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'sua-url-do-supabase';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'sua-service-key';
const WEBHOOK_SERVER_URL = process.env.WEBHOOK_SERVER_URL || 'http://localhost:3001';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// UUID de teste (substitua por um UUID real de usuário)
const TEST_USER_ID = '550e8400-e29b-41d4-a716-446655440000';
const TEST_EMAIL_DOMAIN_ID = '550e8400-e29b-41d4-a716-446655440001';

console.log('🧪 INICIANDO TESTE DE INTEGRAÇÃO ADOREI');
console.log('=====================================');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function createTestData() {
  console.log('\n📊 1. Criando dados de teste...');
  
  try {
    // Criar domínio de email de teste
    const { data: emailDomain, error: emailError } = await supabase
      .from('email_domains')
      .upsert({
        id: TEST_EMAIL_DOMAIN_ID,
        domain_name: 'teste.com',
        from_name: 'Teste Empresa',
        from_email: 'contato@teste.com',
        reply_to_email: 'suporte@teste.com',
        resend_api_key: 'test_key',
        is_active: true,
        is_default: false,
        owner_id: TEST_USER_ID
      })
      .select()
      .single();

    if (emailError) {
      console.log('⚠️ Erro ao criar domínio (pode já existir):', emailError.message);
    } else {
      console.log('✅ Domínio de email criado:', emailDomain.domain_name);
    }

    // Criar configuração de checkout do freelancer
    const { data: checkoutConfig, error: configError } = await supabase
      .from('freelancer_checkout_configs')
      .upsert({
        user_id: TEST_USER_ID,
        checkout_type: 'adorei',
        checkout_config: {
          webhook_url: `${WEBHOOK_SERVER_URL}/webhook/adorei/${TEST_USER_ID}`
        },
        webhook_secret: 'test_secret_123',
        email_domain_id: TEST_EMAIL_DOMAIN_ID,
        email_template_type: 'tracking',
        from_name: 'Teste Freelancer',
        from_email: 'freelancer@teste.com',
        reply_to_email: 'suporte@teste.com',
        is_active: true
      }, { onConflict: 'user_id,checkout_type' })
      .select()
      .single();

    if (configError) {
      console.log('⚠️ Erro ao criar configuração (pode já existir):', configError.message);
    } else {
      console.log('✅ Configuração de checkout criada para user:', TEST_USER_ID);
    }

    return true;
  } catch (error) {
    console.error('❌ Erro ao criar dados de teste:', error.message);
    return false;
  }
}

async function testWebhook() {
  console.log('\n🔗 2. Testando webhook da Adorei...');
  
  // Payload de teste da Adorei
  const testPayload = {
    event: "order.status.approved",
    time: new Date().toISOString(),
    merchant: {
      id: "1",
      alias: "lojateste"
    },
    resource: {
      status: "approved",
      number: 12345,
      value_total: 100.00,
      value_products: 90.00,
      value_shipment: 10.00,
      value_discount: 0.00,
      days_delivery: "1 a 3 dias",
      upselled: false,
      tracking: {
        code: "TEST123456",
        local: "SAO PAULO-SP",
        last_status: "Objeto postado",
        status_at: new Date().toISOString()
      },
      gateway: "mercadopago",
      payment_method: "credit_card",
      source: "shopify",
      source_reference: "test-order-123",
      gateway_transaction_id: "txn_test_123",
      customer: {
        first_name: "João",
        last_name: "Silva",
        doc: "12345678901",
        ip: "127.0.0.1",
        email: "joao.silva@email.com",
        phone: "11999999999"
      },
      items: [
        {
          source_reference: 40085810839652,
          quantity: 1,
          price: 90.00
        }
      ],
      address: {
        street: "Rua Teste",
        number: "123",
        neighborhood: "Centro",
        receiver: "João Silva",
        zipcode: "01234-567",
        city: "São Paulo",
        uf: "SP"
      }
    }
  };

  try {
    const webhookUrl = `${WEBHOOK_SERVER_URL}/webhook/adorei/${TEST_USER_ID}`;
    console.log(`📤 Enviando webhook para: ${webhookUrl}`);
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-adorei-signature': 'test_signature_hash' // Em produção, usar HMAC real
      },
      body: JSON.stringify(testPayload)
    });

    const responseData = await response.text();
    console.log(`📥 Status da resposta: ${response.status}`);
    console.log(`📄 Corpo da resposta: ${responseData}`);

    if (response.status === 200) {
      console.log('✅ Webhook enviado com sucesso!');
      return JSON.parse(responseData);
    } else {
      console.log(`❌ Webhook falhou com status: ${response.status}`);
      return null;
    }
  } catch (error) {
    console.error('❌ Erro ao enviar webhook:', error.message);
    return null;
  }
}

async function checkProcessingResults() {
  console.log('\n🔍 3. Verificando resultados do processamento...');
  
  // Aguardar um pouco para o processamento assíncrono
  console.log('⏳ Aguardando processamento (5 segundos)...');
  await sleep(5000);

  try {
    // Verificar se o pedido foi criado
    const { data: orders, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('created_by', TEST_USER_ID)
      .order('created_at', { ascending: false })
      .limit(1);

    if (orderError) {
      console.error('❌ Erro ao buscar pedidos:', orderError.message);
      return false;
    }

    if (orders && orders.length > 0) {
      const order = orders[0];
      console.log('✅ Pedido encontrado no banco:');
      console.log(`   - ID: ${order.id}`);
      console.log(`   - Tracking Code: ${order.tracking_code}`);
      console.log(`   - Customer: ${order.customer_name}`);
      console.log(`   - Email: ${order.customer_email}`);
      console.log(`   - Amount: R$ ${(order.amount / 100).toFixed(2)}`);
      console.log(`   - Status: ${order.status}`);
      console.log(`   - Gateway Source: ${order.gateway_source || 'N/A'}`);
      console.log(`   - Email Sent: ${order.email_sent ? 'Sim' : 'Não'}`);

      // Verificar logs de email
      const { data: emailLogs, error: emailError } = await supabase
        .from('email_logs')
        .select('*')
        .eq('order_id', order.id)
        .order('created_at', { ascending: false });

      if (!emailError && emailLogs && emailLogs.length > 0) {
        console.log('✅ Logs de email encontrados:');
        emailLogs.forEach((log, index) => {
          console.log(`   ${index + 1}. Status: ${log.status}, Tipo: ${log.type}, Message ID: ${log.message_id}`);
        });
      } else {
        console.log('⚠️ Nenhum log de email encontrado');
      }

      return true;
    } else {
      console.log('❌ Nenhum pedido encontrado no banco');
      return false;
    }
  } catch (error) {
    console.error('❌ Erro ao verificar resultados:', error.message);
    return false;
  }
}

async function testEmailConfiguration() {
  console.log('\n📧 4. Testando configuração de email...');
  
  try {
    // Verificar se a configuração está correta
    const { data: config, error: configError } = await supabase
      .from('freelancer_checkout_configs')
      .select(`
        *,
        email_domain:email_domain_id (*)
      `)
      .eq('user_id', TEST_USER_ID)
      .eq('checkout_type', 'adorei')
      .single();

    if (configError) {
      console.error('❌ Erro ao buscar configuração:', configError.message);
      return false;
    }

    console.log('✅ Configuração de email encontrada:');
    console.log(`   - Template Type: ${config.email_template_type}`);
    console.log(`   - From Name: ${config.from_name}`);
    console.log(`   - From Email: ${config.from_email}`);
    console.log(`   - Domain: ${config.email_domain?.domain_name || 'Padrão'}`);
    console.log(`   - Active: ${config.is_active ? 'Sim' : 'Não'}`);

    return true;
  } catch (error) {
    console.error('❌ Erro ao testar configuração de email:', error.message);
    return false;
  }
}

async function cleanupTestData() {
  console.log('\n🧹 5. Limpando dados de teste...');
  
  try {
    // Remover pedidos de teste
    const { error: ordersError } = await supabase
      .from('orders')
      .delete()
      .eq('created_by', TEST_USER_ID)
      .like('payment_id', 'adorei-%');

    if (ordersError) {
      console.log('⚠️ Erro ao limpar pedidos:', ordersError.message);
    } else {
      console.log('✅ Pedidos de teste removidos');
    }

    // Manter configurações para próximos testes
    console.log('ℹ️ Mantendo configurações de teste para próximas execuções');
    
    return true;
  } catch (error) {
    console.error('❌ Erro ao limpar dados:', error.message);
    return false;
  }
}

async function runFullTest() {
  console.log('🚀 Iniciando teste completo da integração Adorei');
  
  try {
    // Executar testes em sequência
    const step1 = await createTestData();
    if (!step1) {
      console.log('❌ Falha na criação de dados de teste');
      return;
    }

    const step2 = await testWebhook();
    if (!step2) {
      console.log('❌ Falha no teste de webhook');
      return;
    }

    const step3 = await checkProcessingResults();
    if (!step3) {
      console.log('❌ Falha na verificação de resultados');
      return;
    }

    const step4 = await testEmailConfiguration();
    if (!step4) {
      console.log('❌ Falha no teste de configuração de email');
      return;
    }

    const step5 = await cleanupTestData();
    if (!step5) {
      console.log('⚠️ Falha na limpeza (não crítico)');
    }

    console.log('\n🎉 TESTE COMPLETO FINALIZADO COM SUCESSO!');
    console.log('=====================================');
    console.log('✅ Todas as etapas da integração Adorei funcionaram corretamente');
    console.log('✅ Webhook processado');
    console.log('✅ Pedido criado no banco');
    console.log('✅ Configuração de email validada');
    console.log('');
    console.log('🚀 A integração está pronta para produção!');

  } catch (error) {
    console.error('❌ ERRO CRÍTICO NO TESTE:', error.message);
    console.log('\n🔧 Verifique:');
    console.log('- Se o webhook server está rodando na porta 3001');
    console.log('- Se as variáveis de ambiente estão configuradas');
    console.log('- Se o banco de dados está acessível');
    console.log('- Se as tabelas foram criadas corretamente');
  }
}

// Executar teste se chamado diretamente
if (require.main === module) {
  runFullTest();
}

module.exports = {
  runFullTest,
  createTestData,
  testWebhook,
  checkProcessingResults,
  testEmailConfiguration,
  cleanupTestData
};