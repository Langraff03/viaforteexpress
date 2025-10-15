// Script para testar diferença entre infoproduto e produto físico
// Execute: node scripts/test-infoproduto-vs-fisico.js

const { queuePaymentWebhook } = require('../src/lib/queue');

async function testarFluxoCompleto() {
  console.log('🧪 Testando fluxo: Infoproduto vs Produto Físico\n');

  try {
    // 1. Testar INFOPRODUTO (sem endereço) - deve salvar no banco mas NÃO enviar email
    console.log('1️⃣ Testando INFOPRODUTO (sem endereço):');
    
    const infoprodutoPayload = {
      gateway: 'asset',
      event: 'payment.confirmed',
      payload: {
        id: `infoproduto-${Date.now()}`,
        customer_email: 'cliente.info@teste.com',
        customer_name: 'Cliente Infoproduto',
        amount: 9900, // R$ 99,00
        order_id: `order-info-${Date.now()}`,
        // ❌ SEM endereço - infoproduto
        customer: {
          phone: '11999887766',
          cpf: '123.456.789-00'
        }
      }
    };

    await queuePaymentWebhook(infoprodutoPayload);
    console.log('   ✅ Infoproduto enfileirado - deve salvar no banco SEM enviar email\n');

    // 2. Testar PRODUTO FÍSICO (com endereço) - deve salvar no banco E enviar email
    console.log('2️⃣ Testando PRODUTO FÍSICO (com endereço):');
    
    const produtoFisicoPayload = {
      gateway: 'asset',
      event: 'payment.confirmed',
      payload: {
        id: `fisico-${Date.now()}`,
        customer_email: 'cliente.fisico@teste.com',
        customer_name: 'Cliente Produto Físico',
        amount: 4900, // R$ 49,00
        order_id: `order-fisico-${Date.now()}`,
        // ✅ COM endereço - produto físico
        shipping: {
          address: {
            street: 'Rua das Flores, 123',
            city: 'São Paulo',
            state: 'SP',
            zipCode: '01234-567'
          }
        },
        customer: {
          phone: '11988776655',
          cpf: '987.654.321-00',
          address: {
            street: 'Rua das Flores, 123',
            city: 'São Paulo',
            state: 'SP'
          }
        }
      }
    };

    await queuePaymentWebhook(produtoFisicoPayload);
    console.log('   ✅ Produto físico enfileirado - deve salvar no banco E enviar email\n');

    // 3. Instruções para validação
    console.log('📋 COMO VALIDAR:');
    console.log('');
    console.log('1. Aguarde alguns segundos para processamento');
    console.log('2. Verifique os logs do sistema para ver:');
    console.log('   🔍 "Infoproduto detectado - NÃO enviando email"');
    console.log('   🔍 "Produto físico detectado - enviando email"');
    console.log('');
    console.log('3. Execute no banco:');
    console.log('   SELECT customer_name, customer_email, customer_phone, customer_cpf, has_shipping_address, email_sent');
    console.log('   FROM orders WHERE customer_email IN (\'cliente.info@teste.com\', \'cliente.fisico@teste.com\');');
    console.log('');
    console.log('4. Resultado esperado:');
    console.log('   - Infoproduto: has_shipping_address=false, email_sent=false, CPF/telefone salvos');
    console.log('   - Produto físico: has_shipping_address=true, email_sent=true, CPF/telefone salvos');

  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

// Executar o teste
testarFluxoCompleto();