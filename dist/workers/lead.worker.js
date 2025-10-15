// src/workers/lead.worker.ts
import { Worker } from 'bullmq';
import Redis from 'ioredis';
import { supabaseAdmin } from '../lib/server/supabaseAdmin'; // ✅ Backend seguro
import { queueLeadEmail, queueExternalLeadProcessing } from '../lib/queue';
import { sendOfferEmail } from '../lib/emailService';
import fs from 'fs';
import path from 'path';
import * as csv from 'csv-parse';
// Redis connection
const connection = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT) || 6379,
    maxRetriesPerRequest: null,
});
// Worker para processar leads internos
const internalLeadWorker = new Worker('internal-lead', async (job) => {
    console.log(`[InternalLeadWorker] Processando job.id=${job.id}`, job.data);
    const { filters = {}, batchId } = job.data;
    try {
        // Configurações para processamento em lotes
        const BATCH_SIZE = 100; // Número de leads por lote
        const CONCURRENCY_LIMIT = 5; // Número máximo de operações simultâneas
        let successCount = 0;
        let failCount = 0;
        let totalLeads = 0;
        let processedBatches = 0;
        // Função para buscar leads em lotes usando paginação
        async function fetchLeadsBatch(page, pageSize) {
            // Construir a query para buscar leads ativos com paginação
            let query = supabaseAdmin
                .from('leads')
                .select('*')
                .eq('status', 'ativo')
                .range(page * pageSize, (page + 1) * pageSize - 1);
            // Aplicar filtros adicionais se fornecidos
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    query = query.eq(key, value);
                }
            });
            // Executar a query
            const { data: leads, error } = await query;
            if (error) {
                console.error(`[InternalLeadWorker] Erro ao buscar lote de leads:`, error);
                throw error;
            }
            return leads || [];
        }
        // Primeiro, obter a contagem total para estimar o número de lotes
        let countQuery = supabaseAdmin
            .from('leads')
            .select('id', { count: 'exact' })
            .eq('status', 'ativo');
        // Aplicar os mesmos filtros à query de contagem
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                countQuery = countQuery.eq(key, value);
            }
        });
        const { count, error: countError } = await countQuery;
        if (countError) {
            console.error(`[InternalLeadWorker] Erro ao contar leads:`, countError);
            throw countError;
        }
        totalLeads = count || 0;
        const totalBatches = Math.ceil(totalLeads / BATCH_SIZE);
        console.log(`[InternalLeadWorker] Encontrados ${totalLeads} leads para processar em ${totalBatches} lotes`);
        if (totalLeads === 0) {
            return {
                success: true,
                processedLeads: 0,
                message: 'Nenhum lead encontrado para processar',
                batchId
            };
        }
        // Processar lotes com concorrência limitada
        const pendingBatches = new Set();
        for (let page = 0; page < totalBatches; page++) {
            // Controlar o número de lotes processados simultaneamente
            while (pendingBatches.size >= CONCURRENCY_LIMIT) {
                // Aguardar até que um lote seja concluído
                await Promise.race(Array.from(pendingBatches));
                // Limpar promessas concluídas
                for (const promise of pendingBatches) {
                    if (Promise.resolve(promise) === promise) {
                        pendingBatches.delete(promise);
                    }
                }
            }
            // Buscar e processar um lote de leads
            const batchPromise = (async () => {
                try {
                    // Buscar um lote de leads
                    const leadsBatch = await fetchLeadsBatch(page, BATCH_SIZE);
                    processedBatches++;
                    console.log(`[InternalLeadWorker] Processando lote ${processedBatches}/${totalBatches} (${leadsBatch.length} leads)`);
                    // Processar cada lead no lote
                    let batchSuccess = 0;
                    let batchFail = 0;
                    // Usar Promise.all para processar leads em paralelo dentro do lote
                    const results = await Promise.allSettled(leadsBatch.map(async (lead) => {
                        try {
                            // Buscar a oferta de interesse do lead
                            const { data: oferta, error: ofertaError } = await supabaseAdmin
                                .from('ofertas')
                                .select('*')
                                .eq('id', lead.oferta_interesse_id)
                                .maybeSingle();
                            if (ofertaError) {
                                console.error(`[InternalLeadWorker] Erro ao buscar oferta para lead ${lead.id}:`, ofertaError);
                                return { success: false };
                            }
                            // Se não encontrou oferta específica, usar oferta padrão
                            const ofertaData = oferta || {
                                nome: 'Oferta Especial',
                                desconto: '10%',
                                link: `${process.env.VITE_APP_URL || 'https://rastreio.viaforteexpress.com'}/ofertas/padrao`,
                                descricao: 'Aproveite nossa oferta especial por tempo limitado!'
                            };
                            // Enfileirar job para enviar email para este lead
                            await queueLeadEmail({
                                leadId: lead.id,
                                email: lead.email,
                                nome: lead.nome || 'Cliente',
                                oferta_nome: ofertaData.nome,
                                desconto: ofertaData.desconto,
                                link_da_oferta: ofertaData.link,
                                descricao_adicional: ofertaData.descricao,
                                origem: 'interno'
                                // domain_id não especificado para leads internos - usa padrão
                            });
                            return { success: true };
                        }
                        catch (error) {
                            console.error(`[InternalLeadWorker] Erro ao processar lead ${lead.id}:`, error);
                            return { success: false };
                        }
                    }));
                    // Contar sucessos e falhas
                    batchSuccess = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
                    batchFail = results.length - batchSuccess;
                    successCount += batchSuccess;
                    failCount += batchFail;
                    console.log(`[InternalLeadWorker] Lote ${processedBatches}/${totalBatches} processado: ${batchSuccess} sucessos, ${batchFail} falhas`);
                    // Calcular e exibir progresso
                    const progress = Math.round((processedBatches / totalBatches) * 100);
                    console.log(`[InternalLeadWorker] Progresso: ${progress}% (${successCount + failCount}/${totalLeads} leads)`);
                    return { success: batchSuccess, fail: batchFail };
                }
                catch (error) {
                    console.error(`[InternalLeadWorker] Erro no lote ${page + 1}:`, error);
                    return { success: 0, fail: BATCH_SIZE };
                }
            })();
            pendingBatches.add(batchPromise);
        }
        // Aguardar a conclusão de todos os lotes
        await Promise.all(Array.from(pendingBatches));
        console.log(`[InternalLeadWorker] Processamento concluído: ${successCount} sucessos, ${failCount} falhas`);
        return {
            success: true,
            processedLeads: successCount,
            failedLeads: failCount,
            totalLeads,
            batchId
        };
    }
    catch (err) {
        console.error(`[InternalLeadWorker] Falha job.id=${job.id}:`, err);
        throw err;
    }
}, { connection });
// Worker para processar leads externos (de arquivos)
const externalLeadWorker = new Worker('external-lead', async (job) => {
    console.log(`[ExternalLeadWorker] Processando job.id=${job.id}`, job.data);
    const { clientId, leads, ofertaConfig, fileId } = job.data;
    try {
        console.log(`[ExternalLeadWorker] Processando ${leads.length} leads externos do cliente ${clientId}`);
        // Validar leads antes de processar
        const validLeads = leads.filter(lead => {
            // Verificar se o email é válido
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return lead.email && emailRegex.test(lead.email);
        });
        console.log(`[ExternalLeadWorker] ${validLeads.length} leads válidos de ${leads.length} totais`);
        // Configurações para processamento em lotes
        const BATCH_SIZE = 50; // Número de leads por lote para enfileiramento
        const CONCURRENCY_LIMIT = 10; // Número máximo de operações de enfileiramento simultâneas
        let successCount = 0;
        let failCount = 0;
        // Dividir leads em lotes menores para processamento mais eficiente
        const batches = [];
        for (let i = 0; i < validLeads.length; i += BATCH_SIZE) {
            batches.push(validLeads.slice(i, i + BATCH_SIZE));
        }
        console.log(`[ExternalLeadWorker] Dividindo em ${batches.length} lotes de até ${BATCH_SIZE} leads cada`);
        // Processar lotes com concorrência limitada
        let activeBatches = 0;
        const batchPromises = [];
        const pendingBatches = new Set();
        for (let i = 0; i < batches.length; i++) {
            const batch = batches[i];
            // Controlar o número de lotes processados simultaneamente
            while (pendingBatches.size >= CONCURRENCY_LIMIT) {
                // Aguardar até que um lote seja concluído
                await Promise.race(Array.from(pendingBatches));
                // Limpar promessas concluídas
                for (const promise of pendingBatches) {
                    if (Promise.resolve(promise) === promise) {
                        pendingBatches.delete(promise);
                    }
                }
            }
            activeBatches++;
            const batchPromise = (async () => {
                try {
                    // Processar cada lead no lote
                    const promises = batch.map(lead => queueLeadEmail({
                        email: lead.email,
                        nome: lead.nome || 'Cliente',
                        oferta_nome: ofertaConfig.oferta_nome,
                        desconto: ofertaConfig.desconto,
                        link_da_oferta: ofertaConfig.link_da_oferta,
                        descricao_adicional: ofertaConfig.descricao_adicional,
                        origem: 'externo',
                        cliente_id: clientId,
                        email_template: ofertaConfig.email_template, // Template personalizado
                        domain_id: ofertaConfig.domain_id // ✅ NOVO: Suporte a domínio personalizado
                    }));
                    // Aguardar a conclusão de todos os enfileiramentos no lote
                    const results = await Promise.allSettled(promises);
                    // Contar sucessos e falhas
                    const batchSuccess = results.filter(r => r.status === 'fulfilled').length;
                    const batchFail = results.filter(r => r.status === 'rejected').length;
                    successCount += batchSuccess;
                    failCount += batchFail;
                    console.log(`[ExternalLeadWorker] Lote ${i + 1}/${batches.length} processado: ${batchSuccess} sucessos, ${batchFail} falhas`);
                    return { success: batchSuccess, fail: batchFail };
                }
                catch (error) {
                    console.error(`[ExternalLeadWorker] Erro no lote ${i + 1}:`, error);
                    failCount += batch.length;
                    return { success: 0, fail: batch.length };
                }
                finally {
                    activeBatches--;
                }
            })();
            batchPromises.push(batchPromise);
            pendingBatches.add(batchPromise);
        }
        // Aguardar a conclusão de todos os lotes
        await Promise.all(batchPromises);
        console.log(`[ExternalLeadWorker] Processamento concluído: ${successCount} sucessos, ${failCount} falhas`);
        // Atualizar status da campanha para 'completed'
        const { error: updateError } = await supabaseAdmin
            .from('lead_campaigns')
            .update({
            status: 'completed',
            processed_leads: successCount + failCount,
            success_count: successCount,
            fail_count: failCount,
            completed_at: new Date().toISOString()
        })
            .eq('id', fileId);
        if (updateError) {
            console.error(`[ExternalLeadWorker] Erro ao atualizar campanha:`, updateError);
        }
        else {
            console.log(`✅ [ExternalLeadWorker] Campanha ${fileId} finalizada: ${successCount} sucessos, ${failCount} falhas`);
        }
        // Registrar o processamento no banco de dados (opcional para auditoria)
        const { error: logError } = await supabaseAdmin.from('external_lead_batches').insert({
            client_id: clientId,
            file_id: fileId,
            total_leads: leads.length,
            valid_leads: validLeads.length,
            processed_at: new Date().toISOString(),
            offer_name: ofertaConfig.oferta_nome,
            success_count: successCount,
            fail_count: failCount
        });
        if (logError) {
            console.error(`[ExternalLeadWorker] Erro ao registrar processamento:`, logError);
            // Não falhar o job por causa disso
        }
        return {
            success: true,
            totalLeads: leads.length,
            validLeads: validLeads.length,
            successCount,
            failCount,
            clientId,
            fileId
        };
    }
    catch (err) {
        console.error(`[ExternalLeadWorker] Falha job.id=${job.id}:`, err);
        // Atualizar campanha como falha
        try {
            await supabaseAdmin
                .from('lead_campaigns')
                .update({
                status: 'failed',
                error_message: err instanceof Error ? err.message : String(err),
                completed_at: new Date().toISOString()
            })
                .eq('id', fileId);
        }
        catch (updateErr) {
            console.error(`[ExternalLeadWorker] Erro ao atualizar status da campanha para falha:`, updateErr);
        }
        throw err;
    }
}, {
    connection,
    // Configurações para processar grandes volumes
    limiter: {
        max: 50,
        duration: 1000 * 60 // 1 minuto
    }
});
// Worker para enviar emails para leads
const leadEmailWorker = new Worker('lead-email', async (job) => {
    console.log(`[LeadEmailWorker] Processando job.id=${job.id}`, job.data);
    try {
        // ✅ ATUALIZADO: Enviar email com suporte a domínio personalizado
        const result = await sendOfferEmail(job.data, job.data.domain_id);
        console.log(`[LeadEmailWorker] Email enviado com sucesso para ${job.data.email}, messageId=${result.id}`);
        return {
            success: true,
            messageId: result.id,
            email: job.data.email
        };
    }
    catch (err) {
        console.error(`[LeadEmailWorker] Falha ao enviar email para ${job.data.email}:`, err);
        throw err;
    }
}, { connection });
// Função auxiliar para processar arquivo CSV
export async function processCSVFile(filePath, clientId, ofertaConfig) {
    try {
        // Ler o arquivo
        const fileContent = fs.readFileSync(filePath, 'utf8');
        // Parsear o CSV de forma assíncrona
        const parseAsync = (content) => {
            return new Promise((resolve, reject) => {
                csv.parse(content, {
                    columns: true,
                    skip_empty_lines: true
                }, (err, output) => {
                    if (err)
                        reject(err);
                    else
                        resolve(output);
                });
            });
        };
        // Processar o CSV
        const records = await parseAsync(fileContent);
        // Enfileirar job para processar os leads
        await queueExternalLeadProcessing({
            clientId,
            fileId: path.basename(filePath),
            leads: records,
            ofertaConfig
        });
        return { success: true, totalLeads: records.length };
    }
    catch (err) {
        console.error(`Erro ao processar arquivo CSV ${filePath}:`, err);
        throw err;
    }
}
// Função auxiliar para processar arquivo JSON
export async function processJSONFile(filePath, clientId, ofertaConfig) {
    try {
        // Ler o arquivo
        const fileContent = fs.readFileSync(filePath, 'utf8');
        // Parsear o JSON
        const leads = JSON.parse(fileContent);
        if (!Array.isArray(leads)) {
            throw new Error('O arquivo JSON deve conter um array de leads');
        }
        // Enfileirar job para processar os leads
        await queueExternalLeadProcessing({
            clientId,
            fileId: path.basename(filePath),
            leads,
            ofertaConfig
        });
        return { success: true, totalLeads: leads.length };
    }
    catch (err) {
        console.error(`Erro ao processar arquivo JSON ${filePath}:`, err);
        throw err;
    }
}
// Event handlers
internalLeadWorker.on('completed', (job) => {
    console.log(`✅ Job de processamento de leads internos concluído (job.id=${job?.id})`);
});
internalLeadWorker.on('failed', (job, err) => {
    console.error(`❌ Job de processamento de leads internos falhou (job.id=${job?.id}):`, err);
});
externalLeadWorker.on('completed', (job) => {
    console.log(`✅ Job de processamento de leads externos concluído (job.id=${job?.id})`);
});
externalLeadWorker.on('failed', (job, err) => {
    console.error(`❌ Job de processamento de leads externos falhou (job.id=${job?.id}):`, err);
});
leadEmailWorker.on('completed', (job) => {
    console.log(`✅ Job de envio de email para lead concluído (job.id=${job?.id})`);
});
leadEmailWorker.on('failed', (job, err) => {
    console.error(`❌ Job de envio de email para lead falhou (job.id=${job?.id}):`, err);
});
export { internalLeadWorker, externalLeadWorker, leadEmailWorker };
