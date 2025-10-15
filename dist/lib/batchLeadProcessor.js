"use strict";
// src/lib/batchLeadProcessor.js
const fs = require('fs');
const path = require('path');
const { Resend } = require('resend');
const { createReadStream } = require('fs');
const JSONStream = require('JSONStream');
const { queueExternalLeadProcessing } = require('./queue');
const os = require('os');
// Configurações de processamento em lote
const BATCH_SIZE = 100; // Número de leads por lote
const MAX_CONCURRENT_BATCHES = 3; // Número máximo de lotes processados simultaneamente
const RATE_LIMIT_DELAY = 200; // Delay entre envios de emails em ms
/**
 * Processa um arquivo JSON de leads usando streaming e processamento em lotes
 * @param {string} filePath - Caminho para o arquivo JSON
 * @param {Object} ofertaConfig - Configuração da oferta
 * @param {string} clientId - ID do cliente
 * @param {boolean} useQueue - Se deve usar o sistema de filas (true) ou envio direto (false)
 * @returns {Promise<Object>} - Estatísticas do processamento
 */
async function processLeadsInBatches(filePath, ofertaConfig, clientId, useQueue = true) {
    // Obter configurações de email
    const fromName = process.env.FROM_NAME || 'VIA FORTE EXPRESS';
    const fromEmail = process.env.FROM_EMAIL || 'contato@viaforteexpress.com';
    const replyToEmail = process.env.SUPPORT_EMAIL || 'suporte@viaforteexpress.com';
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey && !useQueue) {
        throw new Error('RESEND_API_KEY não encontrada no arquivo .env');
    }
    // Verificar se o arquivo existe
    if (!fs.existsSync(filePath)) {
        throw new Error(`Arquivo não encontrado: ${filePath}`);
    }
    console.log(`\n🔍 Analisando arquivo: ${filePath}`);
    // Estatísticas
    let totalLeads = 0;
    let validLeads = 0;
    let successCount = 0;
    let failCount = 0;
    let batchCount = 0;
    // Inicializar o cliente Resend se não estiver usando fila
    const resend = !useQueue ? new Resend(resendApiKey) : null;
    // Obter o tamanho do arquivo para estimativas
    const stats = fs.statSync(filePath);
    const fileSizeMB = stats.size / (1024 * 1024);
    console.log(`📊 Tamanho do arquivo: ${fileSizeMB.toFixed(2)} MB`);
    // Estimar o número de leads (aproximado)
    const estimatedLeads = Math.round(fileSizeMB * 50); // Estimativa grosseira: ~50 leads por MB
    console.log(`📈 Número estimado de leads: ~${estimatedLeads} (estimativa)`);
    // Determinar a estratégia de processamento com base no tamanho do arquivo
    const useStreaming = fileSizeMB > 5; // Usar streaming para arquivos maiores que 5MB
    if (useStreaming) {
        console.log(`\n🚀 Usando processamento por streaming para arquivo grande`);
        // Criar um array para armazenar os lotes de leads
        let currentBatch = [];
        let activeBatches = 0;
        let batchPromises = [];
        // Criar um stream de leitura do arquivo JSON
        const jsonStream = createReadStream(filePath, { encoding: 'utf8' })
            .pipe(JSONStream.parse('*'));
        // Processar cada lead do stream
        for await (const lead of jsonStream) {
            totalLeads++;
            // Validar o email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (lead.email && emailRegex.test(lead.email)) {
                validLeads++;
                currentBatch.push(lead);
                // Quando o lote estiver completo, processá-lo
                if (currentBatch.length >= BATCH_SIZE) {
                    const batchToProcess = [...currentBatch];
                    currentBatch = [];
                    batchCount++;
                    // Controlar o número de lotes processados simultaneamente
                    while (activeBatches >= MAX_CONCURRENT_BATCHES) {
                        // Aguardar até que um lote seja concluído
                        await Promise.race(batchPromises);
                        // Filtrar promessas concluídas
                        batchPromises = batchPromises.filter(p => p.status !== 'fulfilled' && p.status !== 'rejected');
                        activeBatches = batchPromises.length;
                    }
                    // Processar o lote
                    console.log(`\n📦 Processando lote #${batchCount} (${batchToProcess.length} leads)`);
                    activeBatches++;
                    const batchPromise = processBatch(batchToProcess, ofertaConfig, clientId, useQueue, resend, replyToEmail, fromName, fromEmail)
                        .then(result => {
                        successCount += result.success;
                        failCount += result.fail;
                        activeBatches--;
                        console.log(`✅ Lote #${batchCount} concluído: ${result.success} sucessos, ${result.fail} falhas`);
                        // Atualizar progresso
                        const progress = Math.round((totalLeads / estimatedLeads) * 100);
                        console.log(`📊 Progresso: ~${progress}% (${totalLeads}/${estimatedLeads} leads processados)`);
                        return result;
                    })
                        .catch(err => {
                        console.error(`❌ Erro no lote #${batchCount}:`, err);
                        activeBatches--;
                        failCount += batchToProcess.length;
                        return { success: 0, fail: batchToProcess.length };
                    });
                    batchPromises.push(batchPromise);
                }
            }
        }
        // Processar o último lote se houver leads restantes
        if (currentBatch.length > 0) {
            batchCount++;
            console.log(`\n📦 Processando lote final #${batchCount} (${currentBatch.length} leads)`);
            try {
                const result = await processBatch(currentBatch, ofertaConfig, clientId, useQueue, resend, replyToEmail, fromName, fromEmail);
                successCount += result.success;
                failCount += result.fail;
            }
            catch (err) {
                console.error(`❌ Erro no lote final #${batchCount}:`, err);
                failCount += currentBatch.length;
            }
        }
        // Aguardar a conclusão de todos os lotes
        if (batchPromises.length > 0) {
            console.log(`\n⏳ Aguardando a conclusão de ${batchPromises.length} lotes em processamento...`);
            await Promise.all(batchPromises);
        }
    }
    else {
        // Para arquivos pequenos, carregar tudo na memória
        console.log(`\n🚀 Usando processamento em memória para arquivo pequeno`);
        // Ler o arquivo JSON
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const leads = JSON.parse(fileContent);
        if (!Array.isArray(leads)) {
            throw new Error('O arquivo JSON deve conter um array de leads');
        }
        totalLeads = leads.length;
        console.log(`📊 Encontrados ${totalLeads} leads no arquivo JSON`);
        // Validar os leads
        const validLeadsList = leads.filter(lead => {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return lead.email && emailRegex.test(lead.email);
        });
        validLeads = validLeadsList.length;
        console.log(`✅ ${validLeads} leads válidos de ${totalLeads} totais`);
        // Dividir em lotes
        const batches = [];
        for (let i = 0; i < validLeadsList.length; i += BATCH_SIZE) {
            batches.push(validLeadsList.slice(i, i + BATCH_SIZE));
        }
        batchCount = batches.length;
        console.log(`📦 Dividindo em ${batchCount} lotes de até ${BATCH_SIZE} leads cada`);
        // Processar lotes com concorrência limitada
        let activeBatches = 0;
        const batchPromises = [];
        for (let i = 0; i < batches.length; i++) {
            const batch = batches[i];
            // Controlar o número de lotes processados simultaneamente
            while (activeBatches >= MAX_CONCURRENT_BATCHES) {
                // Aguardar até que um lote seja concluído
                await Promise.race(batchPromises.filter(p => p.status !== 'fulfilled' && p.status !== 'rejected'));
                // Atualizar contagem de lotes ativos
                activeBatches = batchPromises.filter(p => p.status !== 'fulfilled' && p.status !== 'rejected').length;
            }
            console.log(`\n📦 Processando lote #${i + 1} de ${batchCount} (${batch.length} leads)`);
            activeBatches++;
            const batchPromise = processBatch(batch, ofertaConfig, clientId, useQueue, resend, replyToEmail, fromName, fromEmail)
                .then(result => {
                successCount += result.success;
                failCount += result.fail;
                activeBatches--;
                console.log(`✅ Lote #${i + 1} concluído: ${result.success} sucessos, ${result.fail} falhas`);
                // Atualizar progresso
                const progress = Math.round(((i + 1) / batchCount) * 100);
                console.log(`📊 Progresso: ${progress}% (${i + 1}/${batchCount} lotes)`);
                return result;
            })
                .catch(err => {
                console.error(`❌ Erro no lote #${i + 1}:`, err);
                activeBatches--;
                failCount += batch.length;
                return { success: 0, fail: batch.length };
            });
            batchPromises.push(batchPromise);
        }
        // Aguardar a conclusão de todos os lotes
        if (batchPromises.length > 0) {
            console.log(`\n⏳ Aguardando a conclusão de ${batchPromises.length} lotes...`);
            await Promise.all(batchPromises);
        }
    }
    // Exibir resumo final
    console.log(`\n📊 Resumo do processamento:`);
    console.log(`✅ ${successCount} emails enfileirados/enviados com sucesso`);
    console.log(`❌ ${failCount} emails falharam`);
    console.log(`📧 ${validLeads} leads válidos de ${totalLeads} totais`);
    console.log(`📦 ${batchCount} lotes processados`);
    return {
        success: true,
        totalLeads,
        validLeads,
        successCount,
        failCount,
        batchCount
    };
}
/**
 * Processa um lote de leads
 * @param {Array} batch - Array de leads para processar
 * @param {Object} ofertaConfig - Configuração da oferta
 * @param {string} clientId - ID do cliente
 * @param {boolean} useQueue - Se deve usar o sistema de filas
 * @param {Resend} resend - Cliente Resend (se não estiver usando fila)
 * @param {string} replyToEmail - Email de resposta
 * @param {string} fromName - Nome do remetente
 * @param {string} fromEmail - Email do remetente
 * @returns {Promise<{success: number, fail: number}>} - Contagem de sucessos e falhas
 */
async function processBatch(batch, ofertaConfig, clientId, useQueue, resend, replyToEmail, fromName, fromEmail) {
    let successCount = 0;
    let failCount = 0;
    if (useQueue) {
        // Usar o sistema de filas para processamento assíncrono
        try {
            const fileId = path.basename(process.argv[2] || 'unknown-file');
            // Enfileirar o lote para processamento
            await queueExternalLeadProcessing({
                clientId,
                fileId,
                leads: batch,
                ofertaConfig
            });
            successCount = batch.length;
            console.log(`✅ Lote de ${batch.length} leads enfileirado com sucesso`);
        }
        catch (error) {
            console.error('❌ Erro ao enfileirar lote:', error);
            failCount = batch.length;
        }
    }
    else {
        // Processar diretamente enviando emails
        // Usar Promise.all com limitação de concorrência
        const concurrencyLimit = 5; // Número máximo de emails simultâneos
        const chunks = [];
        // Dividir o lote em chunks menores para controlar concorrência
        for (let i = 0; i < batch.length; i += concurrencyLimit) {
            chunks.push(batch.slice(i, i + concurrencyLimit));
        }
        // Processar cada chunk sequencialmente
        for (const chunk of chunks) {
            // Processar leads no chunk em paralelo
            const results = await Promise.allSettled(chunk.map(async (lead) => {
                try {
                    // HTML do email
                    const html = generateEmailHTML(lead, ofertaConfig, replyToEmail);
                    // Enviar email
                    const response = await resend.emails.send({
                        from: `${fromName} <${fromEmail}>`,
                        to: [lead.email],
                        replyTo: replyToEmail,
                        subject: `🔥 Oferta especial: ${ofertaConfig.oferta_nome} - VIA FORTE EXPRESS`,
                        html,
                    });
                    if (response.error || !response.data) {
                        throw new Error(response.error || 'Resposta inválida');
                    }
                    return { success: true, email: lead.email, id: response.data.id };
                }
                catch (error) {
                    return { success: false, email: lead.email, error };
                }
            }));
            // Contar sucessos e falhas
            results.forEach(result => {
                if (result.status === 'fulfilled' && result.value.success) {
                    successCount++;
                }
                else {
                    failCount++;
                    console.error(`❌ Falha ao enviar para ${result.value?.email || 'desconhecido'}:`, result.reason || result.value?.error || 'Erro desconhecido');
                }
            });
            // Pequeno delay entre chunks para evitar rate limiting
            await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY * concurrencyLimit));
        }
    }
    return { success: successCount, fail: failCount };
}
/**
 * Gera o HTML do email
 * @param {Object} lead - Dados do lead
 * @param {Object} ofertaConfig - Configuração da oferta
 * @param {string} replyToEmail - Email de resposta
 * @returns {string} - HTML do email
 */
function generateEmailHTML(lead, ofertaConfig, replyToEmail) {
    return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${ofertaConfig.oferta_nome}</title>
    </head>
    <body style="margin:0;padding:0;background:#f6f9fc;font-family:Segoe UI,Tahoma,Geneva,Arial,sans-serif;line-height:1.6;">
      <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
        <div style="background:linear-gradient(135deg,#4f46e5 0%,#6366f1 100%);padding:40px 20px;text-align:center;">
          <h1 style="color:#fff;font-size:32px;margin:0;text-transform:uppercase;letter-spacing:2px;">VIA FORTE EXPRESS</h1>
          <p style="color:rgba(255,255,255,0.9);margin:10px 0 0;font-size:16px;">Oferta Especial</p>
        </div>
        <div style="padding:40px 30px;">
          <h2 style="color:#1f2937;font-size:24px;margin:0 0 20px;">Olá, ${lead.nome || 'Cliente'}! 👋</h2>
          <p style="color:#4b5563;margin-bottom:30px;font-size:16px;">
            Temos uma oferta especial para você! Aproveite agora ${ofertaConfig.desconto ? `com ${ofertaConfig.desconto} de desconto` : ''}.
          </p>
          
          <div style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:12px;padding:25px;text-align:center;margin:30px 0;">
            <p style="color:#6b7280;margin:0 0 10px;font-size:14px;text-transform:uppercase;letter-spacing:1px;">Oferta Especial</p>
            <div style="font-size:32px;color:#4f46e5;font-weight:bold;letter-spacing:3px;margin:10px 0;">${ofertaConfig.oferta_nome}</div>
            ${ofertaConfig.desconto ? `<div style="font-size:24px;color:#ef4444;font-weight:bold;margin:10px 0;">${ofertaConfig.desconto} OFF</div>` : ''}
          </div>
          
          <div style="text-align:center;margin:35px 0;">
            <a href="${ofertaConfig.link_da_oferta}" style="display:inline-block;background:#4f46e5;color:#fff;padding:16px 36px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px;">
              Aproveitar Oferta
            </a>
          </div>
          
          ${ofertaConfig.descricao_adicional ? `
          <p style="color:#4b5563;margin-bottom:30px;font-size:16px;">
            ${ofertaConfig.descricao_adicional}
          </p>
          ` : ''}
        </div>
        <div style="background:#f8fafc;border-top:1px solid #e5e7eb;padding:30px;text-align:center;">
          <p style="color:#6b7280;margin:0 0 10px;font-size:14px;">
            Precisa de ajuda? Entre em contato: 
            <a href="mailto:${replyToEmail}" style="color:#4f46e5;text-decoration:none;">${replyToEmail}</a>
          </p>
          <p style="color:#9ca3af;margin:20px 0 0;font-size:12px;">
            © ${new Date().getFullYear()} VIA FORTE EXPRESS • Todos os direitos reservados
          </p>
          <p style="color:#9ca3af;margin:8px 0 0;font-size:12px;">
            Para cancelar o recebimento de ofertas, <a href="#" style="color:#4f46e5;text-decoration:none;">clique aqui</a>.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}
module.exports = {
    processLeadsInBatches,
    BATCH_SIZE,
    MAX_CONCURRENT_BATCHES
};
