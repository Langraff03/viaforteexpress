import dotenv from 'dotenv';
dotenv.config();
import { generateInvoice } from '../lib/invoiceService';
import { sendTrackingEmail } from '../lib/emailService';
import { supabase } from '../lib/supabaseClient';
/**
 * Script para testar a geração de nota fiscal e envio de e-mail com nota fiscal anexada
 *
 * Uso:
 * - Para testar com um pedido existente: npm run ts-node src/scripts/test-invoice-email.ts orderId=123456
 * - Para testar com um pedido simulado: npm run ts-node src/scripts/test-invoice-email.ts email=teste@exemplo.com
 */
async function testInvoiceEmail() {
    try {
        const args = process.argv.slice(2);
        let orderId = null;
        let email = null;
        // Processar argumentos
        for (const arg of args) {
            if (arg.startsWith('orderId=')) {
                orderId = arg.split('=')[1];
            }
            else if (arg.startsWith('email=')) {
                email = arg.split('=')[1];
            }
        }
        if (!orderId && !email) {
            console.error('❌ Erro: Você deve fornecer orderId ou email');
            console.log('Uso: npm run ts-node src/scripts/test-invoice-email.ts orderId=123456');
            console.log('  ou: npm run ts-node src/scripts/test-invoice-email.ts email=teste@exemplo.com');
            process.exit(1);
        }
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
            try {
                // Verificar se o arquivo PDF existe
                const fs = require('fs');
                if (fs.existsSync(invoicePdfPath)) {
                    console.log(`✅ Arquivo PDF encontrado: ${invoicePdfPath}`);
                    console.log(`📄 Tamanho do arquivo: ${(fs.statSync(invoicePdfPath).size / 1024).toFixed(2)} KB`);
                }
                else {
                    console.error(`❌ Arquivo PDF não encontrado: ${invoicePdfPath}`);
                }
                // Verificar configurações de e-mail
                const { getEmailConfig } = require('../lib/emailService');
                const config = await getEmailConfig();
                console.log(`📧 Configurações de e-mail:`, {
                    fromName: config.fromName,
                    fromEmail: config.fromEmail,
                    replyToEmail: config.replyToEmail,
                    resendApiKey: config.resendApiKey ? 'Configurada' : 'Não configurada'
                });
                const result = await sendTrackingEmail({
                    id: order.id,
                    tracking_code: order.tracking_code,
                    customer_name: order.customer_name,
                    customer_email: order.customer_email,
                    status: order.status
                }, invoicePdfPath);
                console.log(`✅ E-mail enviado com sucesso:`, result);
            }
            catch (emailError) {
                console.error(`❌ Erro ao enviar e-mail:`, emailError);
                throw emailError;
            }
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
            const invoicePdfPath = await generateInvoice(simulatedOrder.id, customerData, orderItems);
            console.log(`✅ Nota fiscal gerada: ${invoicePdfPath}`);
            // Enviar e-mail com nota fiscal anexada
            console.log(`📧 Enviando e-mail para ${email}...`);
            try {
                // Verificar se o arquivo PDF existe
                const fs = require('fs');
                if (fs.existsSync(invoicePdfPath)) {
                    console.log(`✅ Arquivo PDF encontrado: ${invoicePdfPath}`);
                    console.log(`📄 Tamanho do arquivo: ${(fs.statSync(invoicePdfPath).size / 1024).toFixed(2)} KB`);
                }
                else {
                    console.error(`❌ Arquivo PDF não encontrado: ${invoicePdfPath}`);
                }
                // Verificar configurações de e-mail
                const { getEmailConfig } = require('../lib/emailService');
                const config = await getEmailConfig();
                console.log(`📧 Configurações de e-mail:`, {
                    fromName: config.fromName,
                    fromEmail: config.fromEmail,
                    replyToEmail: config.replyToEmail,
                    resendApiKey: config.resendApiKey ? 'Configurada' : 'Não configurada'
                });
                const result = await sendTrackingEmail(simulatedOrder, invoicePdfPath);
                console.log(`✅ E-mail enviado com sucesso:`, result);
            }
            catch (emailError) {
                console.error(`❌ Erro ao enviar e-mail:`, emailError);
                throw emailError;
            }
        }
        console.log('✅ Teste concluído com sucesso!');
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Erro durante o teste:', error);
        process.exit(1);
    }
}
testInvoiceEmail();
