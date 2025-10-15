/**
 * Script para enviar e-mails de rastreamento com nota fiscal
 * 
 * Este script pode ser usado para enviar e-mails de rastreamento com nota fiscal
 * para pedidos existentes ou para testar o envio de e-mails.
 * 
 * Uso:
 * - Para enviar para um pedido específico: node src/scripts/send-tracking-with-invoice.js --orderId=123456
 * - Para enviar para um e-mail específico: node src/scripts/send-tracking-with-invoice.js --email=exemplo@email.com
 */

require('dotenv').config();
const { generateInvoice } = require('../lib/invoiceService.tsx');
const { sendTrackingEmail } = require('../lib/emailService.tsx');
const { supabase } = require('../lib/supabaseClient.ts');

// Processar argumentos da linha de comando
const args = process.argv.slice(2);
let orderId = null;
let email = null;

for (const arg of args) {
  if (arg.startsWith('--orderId=')) {
    orderId = arg.split('=')[1];
  } else if (arg.startsWith('--email=')) {
    email = arg.split('=')[1];
  }
}

// Se nenhum argumento for fornecido, usar o e-mail padrão
if (!orderId && !email) {
  email = 'lucaslangrafff@gmail.com';
  console.log(`⚠️ Nenhum argumento fornecido. Usando e-mail padrão: ${email}`);
}

/**
 * Função principal
 */
async function main() {
  console.log('===== Envio de E-mail de Rastreamento com Nota Fiscal =====');
  
  try {
    // Se temos um orderId, buscar o pedido no banco
    if (orderId) {
      console.log(`🔍 Buscando pedido ${orderId}...`);
      
      const { data: order, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();
        
      if (error || !order) {
        console.error(`❌ Erro ao buscar pedido ${orderId}:`, error);
        process.exit(1);
      }
      
      console.log(`✅ Pedido encontrado: ${order.id}`);
      console.log(`📋 Detalhes do pedido:`, {
        customer_name: order.customer_name,
        customer_email: order.customer_email,
        tracking_code: order.tracking_code,
        amount: order.amount
      });
      
      // Gerar nota fiscal
      console.log(`🧾 Gerando nota fiscal para pedido ${order.id}...`);
      const invoicePdfPath = await generateInvoice(order.id);
      console.log(`✅ Nota fiscal gerada: ${invoicePdfPath}`);
      
      // Enviar e-mail com nota fiscal anexada
      console.log(`📧 Enviando e-mail para ${order.customer_email}...`);
      const result = await sendTrackingEmail({
        id: order.id,
        tracking_code: order.tracking_code,
        customer_name: order.customer_name,
        customer_email: order.customer_email,
        status: order.status
      }, invoicePdfPath);
      
      console.log(`✅ E-mail enviado com sucesso:`, result);
    } 
    // Se temos apenas um e-mail, criar um pedido simulado
    else if (email) {
      console.log(`🔧 Criando pedido simulado para ${email}...`);
      
      // Gerar código de rastreio simulado
      const trackingCode = `TST${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`;
      
      // Criar pedido simulado
      const simulatedOrder = {
        id: `test-${Date.now()}`,
        tracking_code: trackingCode,
        customer_name: 'Cliente de Teste',
        customer_email: email,
        status: 'paid',
        amount: 199.90
      };
      
      // Dados do cliente simulado
      const customerData = {
        name: simulatedOrder.customer_name,
        email: simulatedOrder.customer_email,
        cpf: '123.456.789-00',
        address: {
          street: 'Rua de Teste',
          number: '123',
          city: 'São Paulo',
          state: 'SP',
          zipCode: '01234-567',
          country: 'Brasil'
        }
      };
      
      // Itens do pedido simulado
      const orderItems = [
        {
          title: 'Produto de Teste 1',
          quantity: 1,
          unitPrice: 99.90
        },
        {
          title: 'Produto de Teste 2',
          quantity: 2,
          unitPrice: 50.00
        }
      ];
      
      // Gerar nota fiscal
      console.log(`🧾 Gerando nota fiscal para pedido simulado...`);
      const invoicePdfPath = await generateInvoice(
        simulatedOrder.id,
        customerData,
        orderItems
      );
      console.log(`✅ Nota fiscal gerada: ${invoicePdfPath}`);
      
      // Enviar e-mail com nota fiscal anexada
      console.log(`📧 Enviando e-mail para ${email}...`);
      const result = await sendTrackingEmail(simulatedOrder, invoicePdfPath);
      
      console.log(`✅ E-mail enviado com sucesso:`, result);
    }
    
    console.log('\n✅ Processo concluído com sucesso!');
  } catch (error) {
    console.error('❌ Erro durante o processo:', error);
    process.exit(1);
  }
}

// Executar a função principal
main()
  .then(() => {
    console.log('Processo finalizado.');
  })
  .catch(err => {
    console.error('Erro fatal:', err);
    process.exit(1);
  });