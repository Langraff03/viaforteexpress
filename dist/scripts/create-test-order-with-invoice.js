"use strict";
/**
 * Script para criar um pedido de teste no banco de dados
 * e gerar uma nota fiscal para esse pedido
 *
 * Versão melhorada com tratamento de erros robusto e validação de dados
 */
require('dotenv').config();
const { v4: uuidv4 } = require('uuid');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
// Importar utilitários
// Nota: Como estamos em um ambiente Node.js, precisamos usar require em vez de import
const errorHandlingPath = path.join(__dirname, '../utils/errorHandling.js');
const tokenUtilsPath = path.join(__dirname, '../utils/tokenUtils.js');
const validationPath = path.join(__dirname, '../utils/validation.js');
// Usar require dinâmico para os módulos ESM
async function importESM(modulePath) {
    try {
        // Converter para URL para importação dinâmica
        const moduleURL = `file://${modulePath.replace(/\\/g, '/')}`;
        return await import(moduleURL);
    }
    catch (error) {
        console.error(`Erro ao importar módulo ${modulePath}:`, error);
        throw error;
    }
}
// Configurações do Supabase
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BASE_URL = process.env.PUBLIC_URL || 'http://localhost:3000';
// Verificar se as chaves de API estão configuradas
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Erro: Configurações do Supabase não encontradas no arquivo .env');
    process.exit(1);
}
// Inicializar o cliente Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
// Função para gerar um código de rastreio simulado
function generateTrackingCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'TST';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}
// Função principal
async function main() {
    let errorHandling, tokenUtils, validation;
    try {
        // Importar utilitários
        [errorHandling, tokenUtils, validation] = await Promise.all([
            importESM(errorHandlingPath),
            importESM(tokenUtilsPath),
            importESM(validationPath)
        ]);
        console.log('===== Criando Pedido de Teste com Nota Fiscal =====');
        // Gerar dados do pedido
        const orderId = uuidv4();
        const trackingCode = generateTrackingCode();
        const customerName = 'Cliente de Teste';
        const customerEmail = 'teste@example.com';
        const amount = 19990; // Valor em centavos (199.90 * 100)
        const paymentId = `pay_${Date.now()}`;
        console.log(`📦 ID do pedido: ${orderId}`);
        console.log(`🔢 Código de rastreio: ${trackingCode}`);
        // Buscar um gateway_id válido para associar ao pedido
        const { data: gateway, error: gatewayError } = await errorHandling.executeWithRetry(() => supabase.from('gateways').select('id').limit(1).single(), {
            maxRetries: 3,
            shouldRetry: (error) => !error.message.includes('No rows matched')
        });
        if (gatewayError) {
            console.error('❌ Erro ao buscar gateway:', gatewayError);
            throw new Error('Não foi possível encontrar um gateway para associar ao pedido');
        }
        const gatewayId = gateway.id;
        console.log(`🔌 Gateway ID: ${gatewayId}`);
        // Criar objeto de pedido
        const orderData = {
            id: orderId,
            customer_name: customerName,
            customer_email: customerEmail,
            amount: amount,
            status: 'processing',
            payment_status: 'paid',
            payment_id: paymentId,
            tracking_code: trackingCode,
            gateway_id: gatewayId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        // Validar dados do pedido
        const validationResult = validation.validateOrder(orderData);
        if (!validationResult.isValid) {
            console.error('❌ Dados do pedido inválidos:', validationResult.errors);
            throw new Error(`Dados do pedido inválidos: ${validationResult.errors.join(', ')}`);
        }
        // Criar o pedido no banco de dados com retry
        const { data: order, error: orderError } = await errorHandling.executeWithRetry(() => supabase.from('orders').insert(orderData).select().single(), { maxRetries: 3 });
        if (orderError) {
            console.error('❌ Erro ao criar pedido:', orderError);
            throw orderError;
        }
        console.log('✅ Pedido criado com sucesso!');
        // Gerar token para a nota fiscal usando o utilitário
        const invoiceToken = tokenUtils.generateInvoiceToken(orderId, trackingCode);
        const invoiceUrl = `${BASE_URL}/invoice/${invoiceToken}`;
        console.log('✅ Nota fiscal gerada com sucesso!');
        console.log(`🔗 Link para visualizar a nota fiscal: ${invoiceUrl}`);
        console.log('\nVocê pode acessar a nota fiscal em:');
        console.log(`👉 ${invoiceUrl}`);
        console.log('\nOu visualizar o pedido na lista de pedidos em:');
        console.log(`👉 ${BASE_URL}/gateway/orders`);
    }
    catch (error) {
        console.error('❌ Erro:', error);
        // Se temos o utilitário de tratamento de erros, usar para log detalhado
        if (errorHandling) {
            errorHandling.handleGlobalError(error, 'create-test-order');
        }
        process.exit(1);
    }
}
// Executar a função principal
main();
