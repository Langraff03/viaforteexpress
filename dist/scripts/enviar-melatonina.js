"use strict";
// src/scripts/enviar-melatonina.js
require('dotenv').config();
const { supabase } = require('../lib/supabaseClient');
const { renderAsync } = require('@react-email/render');
const { Resend } = require('resend');
const React = require('react');
const { createElement } = React;
// Configurações do email
const fromName = process.env.PAGUE_MENOS_FROM_NAME || 'Pague Menos Farma';
// Usar o domínio paguemenosfarma.com que agora está verificado
const fromEmail = process.env.PAGUE_MENOS_FROM_EMAIL || 'contato@paguemenosfarma.com';
const replyToEmail = process.env.PAGUE_MENOS_SUPPORT_EMAIL || 'suporte@paguemenosfarma.com';
const resendApiKey = process.env.RESEND_API_KEY;
// Configurações de processamento em lote
const BATCH_SIZE = 50; // Número de leads por lote
const RATE_LIMIT_DELAY = 500; // Delay entre envios de emails em ms
/**
 * Renderiza o template de email de oferta de Melatonina
 * @param {Object} props - Propriedades para o template
 * @returns {Promise<string>} - HTML renderizado
 */
async function renderMelatoninaEmail(props) {
    // Criar um objeto simples que representa o email
    const emailContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Oferta Especial: Melatonina Fini Dr. Good</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif; background-color: #f6f9fc; padding: 40px 0; margin: 0;">
      <div style="background-color: #ffffff; padding: 40px; border-radius: 12px; max-width: 600px; margin: auto; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); border: 1px solid #e5e7eb;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="font-size: 42px; color: #10b981; font-weight: bold; margin: 0; letter-spacing: -0.025em; font-family: system-ui, -apple-system, sans-serif; text-transform: uppercase; line-height: 1;">
            Pague Menos Farma
          </h1>
          <p style="font-size: 16px; color: #6b7280; margin: 8px 0 0;">
            Ofertas exclusivas para você
          </p>
        </div>
        
        <div style="background-color: #f0f4ff; border-radius: 8px; padding: 24px; margin-bottom: 32px; text-align: center;">
          <h2 style="font-size: 24px; color: #10b981; margin: 0 0 16px; font-weight: bold;">
            🌙 Durma Melhor, Viva Melhor! 🌙
          </h2>
          <p style="font-size: 18px; color: #1f2937; margin: 0; font-weight: bold;">
            Melatonina Fini Dr. Good
            <br />
            <span style="font-size: 16px; font-weight: normal;">60 unidades • Sabor Morango</span>
          </p>
        </div>
        
        <h2 style="font-size: 24px; font-weight: bold; color: #1f2937; margin-bottom: 16px; text-align: center;">
          Olá, ${props.nome || 'Cliente'}! 👋
        </h2>
        
        <p style="font-size: 16px; color: #4b5563; line-height: 24px; margin-bottom: 24px; text-align: center;">
          Você sabia que uma boa noite de sono é essencial para sua saúde e bem-estar? 
          Estamos com uma oferta especial para ajudar você a melhorar a qualidade do seu sono!
        </p>
        
        <div style="background-color: #f8fafc; border-radius: 8px; padding: 24px; margin-bottom: 32px; text-align: center;">
          <p style="font-size: 18px; color: #475569; margin: 0 0 16px; font-weight: bold;">
            Benefícios da Melatonina Fini:
          </p>
          <p style="font-size: 16px; color: #4b5563; margin: 0 0 8px; line-height: 24px;">
            ✅ Ajuda a regular o ciclo de sono
          </p>
          <p style="font-size: 16px; color: #4b5563; margin: 0 0 8px; line-height: 24px;">
            ✅ Formato de goma mastigável deliciosa
          </p>
          <p style="font-size: 16px; color: #4b5563; margin: 0 0 8px; line-height: 24px;">
            ✅ Sem açúcares adicionados
          </p>
          <p style="font-size: 16px; color: #4b5563; margin: 0 0 8px; line-height: 24px;">
            ✅ Sabor morango irresistível
          </p>
        </div>
        
        <div style="text-align: center; margin-bottom: 32px;">
          <p style="font-size: 32px; color: #ef4444; font-weight: bold; margin: 0 0 8px; text-decoration: line-through;">
            R$ 67,99
          </p>
          <p style="font-size: 42px; color: #10b981; font-weight: bold; margin: 0 0 16px;">
            R$ 44,99
          </p>
          <p style="font-size: 18px; color: #10b981; font-weight: bold; margin: 0 0 24px;">
            ${props.desconto || '30%'} OFF no carrinho!
          </p>
          <a href="https://paguemenosfarma.com/produto/melatonina-fini-60un" 
             style="background-color: #10b981; color: #ffffff; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-size: 18px; font-weight: bold; display: inline-block; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);">
            Comprar Agora
          </a>
        </div>
        
        <div style="background-color: #f0f9ff; border-radius: 8px; padding: 24px; margin-top: 32px; margin-bottom: 32px;">
          <p style="font-size: 16px; color: #0369a1; margin: 0; text-align: center; line-height: 24px;">
            <span style="font-weight: bold;">⏰ Oferta por tempo limitado!</span> Aproveite enquanto durar o estoque. 
            Produto sujeito à disponibilidade.
          </p>
        </div>
        
        <hr style="border-top: 1px solid #e5e7eb; margin: 32px 0;" />
        
        <p style="font-size: 14px; color: #6b7280; line-height: 20px; margin-bottom: 24px; text-align: center;">
          Precisa de ajuda? Nossa equipe está disponível 24/7 em <a href="mailto:suporte@paguemenosfarma.com" style="color: #10b981; text-decoration: none;">suporte@paguemenosfarma.com</a>
        </p>
        
        <p style="font-size: 12px; color: #9ca3af; text-align: center; margin: 0; line-height: 16px;">
          © ${new Date().getFullYear()} Pague Menos Farma • Todos os direitos reservados
          <br />
          <span style="display: block; margin-top: 4px;">
            Av. Goiás, 1234 • Goiânia, GO • 74000-000
          </span>
          <span style="display: block; margin-top: 8px;">
            Para cancelar o recebimento de ofertas, <a href="#" style="color: #10b981; text-decoration: none;">clique aqui</a>.
          </span>
        </p>
      </div>
    </body>
    </html>
  `;
    return emailContent;
}
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
        // Renderizar o email usando o template HTML
        const html = await renderMelatoninaEmail({
            nome: lead.nome || 'Cliente',
            desconto: "30%"
        });
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
        await supabase.from('offer_email_logs').insert({
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
            .select('id, recipient_email')
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
                        nome: undefined // Não temos o nome, então usaremos o valor padrão "Cliente"
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
module.exports = { processLeadsForMelatoninaOffer, sendMelatoninaOfferEmail };
