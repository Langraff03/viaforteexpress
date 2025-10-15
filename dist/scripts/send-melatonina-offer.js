import { jsx as _jsx } from "react/jsx-runtime";
// src/scripts/send-melatonina-offer.tsx
import dotenv from 'dotenv';
dotenv.config();
import { supabase } from '../lib/supabaseClient';
import { supabaseAdmin } from '../lib/server/supabaseAdmin'; // ✅ Backend seguro
import { renderAsync } from '@react-email/render';
import { Resend } from 'resend';
import MelatoninaOfferEmail from '../emails/MelatoninaOfferEmail';
// Configurações do email
const fromName = process.env.PAGUE_MENOS_FROM_NAME || 'Pague Menos Farma';
const fromEmail = process.env.PAGUE_MENOS_FROM_EMAIL || 'contato@paguemenosfarma.com';
const replyToEmail = process.env.PAGUE_MENOS_SUPPORT_EMAIL || 'suporte@paguemenosfarma.com';
const resendApiKey = process.env.RESEND_API_KEY;
// Configurações de processamento em lote
const BATCH_SIZE = 50; // Número de leads por lote
const RATE_LIMIT_DELAY = 500; // Delay entre envios de emails em ms
/**
 * Envia email de oferta de Melatonina para um lead
 * @param {Object} lead - Dados do lead
 * @returns {Promise<Object>} - Resultado do envio
 */
async function sendMelatoninaOfferEmail(lead) {
    try {
        if (!resendApiKey) {
            throw new Error('Resend API Key não encontrada');
        }
        const resend = new Resend(resendApiKey);
        // Renderizar o email usando o template React
        const html = await renderAsync(_jsx(MelatoninaOfferEmail, { nome: lead.nome || 'Cliente', desconto: "30%" }));
        console.log(`📧 Enviando email de oferta de Melatonina para ${lead.email}`);
        // Enviar email
        const response = await resend.emails.send({
            from: `${fromName} <${fromEmail}>`,
            to: [lead.email],
            replyTo: replyToEmail,
            subject: `🌙 Durma melhor com Melatonina Fini - Oferta especial!`,
            html,
        });
        if (response.error || !response.data) {
            throw response.error || new Error('Dados de resposta inviáveis');
        }
        const messageId = response.data.id;
        // Registrar o envio no banco de dados
        await supabaseAdmin.from('offer_email_logs').insert({
            lead_id: lead.id,
            type: 'offer',
            status: 'sent',
            recipient_email: lead.email,
            sent_at: new Date().toISOString(),
            message_id: messageId,
            offer_name: 'Melatonina Fini Dr. Good',
            origin: 'interno',
            metadata: {
                product_url: 'https://paguemenosfarma.com/produto/melatonina-fini-60un',
                discount: '30%'
            }
        });
        console.log(`✅ Email de oferta enviado para ${lead.email} com ID: ${messageId}`);
        return { success: true, id: messageId };
    }
    catch (err) {
        console.error(`❌ Erro ao enviar email para ${lead.email}:`, err);
        throw err;
    }
}
/**
 * Processa leads do banco de dados e envia emails de oferta de Melatonina
 * @param {Object} filters - Filtros para buscar leads
 * @param {number} limit - Limite de leads a processar (opcional)
 */
async function processLeadsForMelatoninaOffer(filters = {}, limit) {
    try {
        console.log('🚀 Iniciando processamento de leads para oferta de Melatonina...');
        // Construir a query para buscar leads da tabela email_logs
        let query = supabase
            .from('email_logs')
            .select('id, recipient_email, metadata')
            .eq('status', 'sent');
        // Aplicar filtros adicionais se fornecidos
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                query = query.eq(key, value);
            }
        });
        // Aplicar limite se fornecido
        if (limit && limit > 0) {
            query = query.limit(limit);
        }
        // Executar a query
        const { data: leads, error } = await query;
        if (error) {
            console.error(`❌ Erro ao buscar leads:`, error);
            throw error;
        }
        console.log(`📊 Encontrados ${leads?.length || 0} leads para processar`);
        if (!leads || leads.length === 0) {
            console.log(`⚠️ Nenhum lead encontrado para processar`);
            return { success: true, processedLeads: 0 };
        }
        // Dividir leads em lotes
        const batches = [];
        for (let i = 0; i < leads.length; i += BATCH_SIZE) {
            batches.push(leads.slice(i, i + BATCH_SIZE));
        }
        console.log(`📦 Dividindo em ${batches.length} lotes de até ${BATCH_SIZE} leads cada`);
        let successCount = 0;
        let failCount = 0;
        // Processar cada lote
        for (let i = 0; i < batches.length; i++) {
            const batch = batches[i];
            console.log(`\n📦 Processando lote ${i + 1}/${batches.length} (${batch.length} leads)`);
            // Processar cada lead no lote
            for (const lead of batch) {
                try {
                    // Mapear os campos do email_logs para o formato esperado pela função sendMelatoninaOfferEmail
                    const mappedLead = {
                        id: lead.id,
                        email: lead.recipient_email,
                        nome: lead.metadata?.nome || undefined
                    };
                    await sendMelatoninaOfferEmail(mappedLead);
                    successCount++;
                    // Pequeno delay para evitar rate limiting
                    await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY));
                }
                catch (err) {
                    console.error(`❌ Erro ao processar lead ${lead.id}:`, err);
                    failCount++;
                }
            }
            console.log(`✅ Lote ${i + 1}/${batches.length} concluído`);
            console.log(`📊 Progresso: ${Math.round(((i + 1) / batches.length) * 100)}%`);
        }
        console.log(`\n📊 Resumo do processamento:`);
        console.log(`✅ ${successCount} emails enviados com sucesso`);
        console.log(`❌ ${failCount} emails falharam`);
        console.log(`📧 ${leads.length} leads processados no total`);
        return {
            success: true,
            totalLeads: leads.length,
            successCount,
            failCount
        };
    }
    catch (err) {
        console.error('❌ Erro ao processar leads:', err);
        throw err;
    }
}
// Função principal
async function main() {
    // Verificar argumentos
    const args = process.argv.slice(2);
    let filters = {};
    let limit = undefined;
    // Processar argumentos
    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--limit' && i + 1 < args.length) {
            limit = parseInt(args[i + 1]);
            i++; // Pular o próximo argumento
        }
        else if (args[i] === '--filters' && i + 1 < args.length) {
            try {
                filters = JSON.parse(args[i + 1]);
                i++; // Pular o próximo argumento
            }
            catch (err) {
                console.error('❌ Erro ao parsear filtros JSON:', err);
                process.exit(1);
            }
        }
    }
    try {
        // Processar leads
        await processLeadsForMelatoninaOffer(filters, limit);
        console.log(`\n✅ Processamento concluído com sucesso!`);
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Erro durante o processamento:', error);
        process.exit(1);
    }
}
// Executar a função principal
if (require.main === module) {
    main();
}
export { processLeadsForMelatoninaOffer, sendMelatoninaOfferEmail };
