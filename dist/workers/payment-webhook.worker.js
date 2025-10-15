// src/workers/payment-webhook.worker.ts
import { Worker } from 'bullmq';
import Redis from 'ioredis';
import { supabaseAdmin } from '../lib/server/supabaseAdmin'; // ✅ Backend seguro
import { queueEmail, generateTrackingCode } from '../lib/queue';
import { generateInvoice } from '../lib/invoiceService';
import { sendTrackingEmail } from '../lib/emailService';
import { GatewayUtils } from '../lib/gateways/GatewayUtils';
// Redis connection
const connection = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT) || 6379,
    maxRetriesPerRequest: null,
});
const paymentWebhookWorker = new Worker('payment-webhook', async (job) => {
    console.log(`📦 Processando pagamento:`, job.data);
    const { gateway, event, payload } = job.data;
    console.log(`📦 🔍 DEBUG PAYMENT - ID: ${payload.id}`);
    console.log(`📦 🔍 DEBUG PAYMENT - Order ID: ${payload.order_id}`);
    console.log(`📦 🔍 DEBUG PAYMENT - Customer Email: ${payload.customer_email}`);
    console.log(`📦 🔍 DEBUG PAYMENT - Customer Name: ${payload.customer_name}`);
    console.log(`📦 🔍 DEBUG PAYMENT - Amount: ${payload.amount}`);
    console.log(`📦 🔍 DEBUG PAYMENT - Shipping Address:`, payload.shipping?.address);
    console.log(`📦 🔍 DEBUG PAYMENT - Customer Address:`, payload.customer?.address);
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
    // Verificar se o pedido tem endereço de entrega
    // ✅ CORREÇÃO: Manter compatibilidade com diferentes estruturas de endereço
    const payloadAny = payload; // Cast temporário para acessar estrutura real
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
        }
        else {
            console.log(`⚠️ Erro ao consultar produto no banco ou pedido não encontrado:`, orderError);
            // Se não conseguir consultar, assume que é físico para não perder pedidos
        }
    }
    else {
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
        }
        else {
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
    }
    catch (err) {
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
        const orderItems = payload.items || [
            {
                title: 'Produto',
                quantity: 1,
                unitPrice: payload.amount
            }
        ];
        // Gerar a nota fiscal
        console.log(`🧾 Gerando nota fiscal para pedido ${payload.order_id || payload.id}`);
        invoicePdfPath = await generateInvoice(payload.order_id || `order-${payload.id}`, customerData, orderItems);
        console.log(`✅ Nota fiscal gerada: ${invoicePdfPath}`);
    }
    catch (invoiceError) {
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
        }
        catch (emailError) {
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
            }
            catch (queueError) {
                console.error(`❌ Erro ao enfileirar email fallback:`, queueError);
            }
        }
    }
    else {
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
            }
            else {
                console.log(`✅ Status do email atualizado no banco: ${payload.order_id}`);
            }
        }
        catch (updateErr) {
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
}, { connection });
// Event handlers
paymentWebhookWorker.on('completed', (job) => {
    console.log(`✅ Job de webhook de pagamento concluído (job.id=${job?.id})`);
});
paymentWebhookWorker.on('failed', (job, err) => {
    console.error(`❌ Job de webhook de pagamento falhou (job.id=${job?.id}):`, err);
});
export default paymentWebhookWorker;
