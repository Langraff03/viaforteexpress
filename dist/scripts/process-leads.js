// src/scripts/process-leads.ts
import dotenv from 'dotenv';
dotenv.config();
import { supabaseAdmin } from '../lib/server/supabaseAdmin'; // ✅ Backend seguro
import { queueInternalLeadProcessing, queueExternalLeadProcessing } from '../lib/queue';
import fs from 'fs';
import path from 'path';
import { parse as csvParse } from 'csv-parse';
import { promisify } from 'util';
const readFile = promisify(fs.readFile);
/**
 * Processa leads internos do banco de dados
 */
export async function processInternalLeads(filters = {}) {
    try {
        console.log('Iniciando processamento de leads internos...');
        console.log('Filtros aplicados:', filters);
        // Criar um ID de lote para rastreamento
        const batchId = `internal-${Date.now()}`;
        // Enfileirar job para processar leads internos
        const job = await queueInternalLeadProcessing({
            batchId,
            filters
        });
        console.log(`Job de processamento de leads internos enfileirado com ID: ${job.id}`);
        return { success: true, jobId: job.id, batchId };
    }
    catch (error) {
        console.error('Erro ao processar leads internos:', error);
        throw error;
    }
}
/**
 * Processa leads de um arquivo CSV
 */
export async function processCSVLeads(filePath, clientId, ofertaConfig) {
    try {
        console.log(`Processando arquivo CSV: ${filePath}`);
        // Verificar se o arquivo existe
        if (!fs.existsSync(filePath)) {
            throw new Error(`Arquivo não encontrado: ${filePath}`);
        }
        // Ler o arquivo
        const fileContent = await readFile(filePath, 'utf8');
        // Parsear o CSV
        const records = await new Promise((resolve, reject) => {
            csvParse(fileContent, {
                columns: true,
                skip_empty_lines: true
            }, (err, output) => {
                if (err)
                    reject(err);
                else
                    resolve(output);
            });
        });
        console.log(`Encontrados ${records.length} leads no arquivo CSV`);
        // Validar os leads
        const validLeads = records.filter((lead) => {
            // Verificar se o email é válido
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return lead.email && emailRegex.test(lead.email);
        });
        console.log(`${validLeads.length} leads válidos de ${records.length} totais`);
        // Enfileirar job para processar os leads
        const job = await queueExternalLeadProcessing({
            clientId,
            fileId: path.basename(filePath),
            leads: validLeads,
            ofertaConfig
        });
        console.log(`Job de processamento de leads externos enfileirado com ID: ${job.id}`);
        // Registrar o upload do arquivo no banco de dados
        const { error } = await supabaseAdmin.from('lead_file_uploads').insert({
            client_id: clientId,
            file_name: path.basename(filePath),
            file_type: 'csv',
            total_leads: records.length,
            valid_leads: validLeads.length,
            uploaded_at: new Date().toISOString(),
            offer_name: ofertaConfig.oferta_nome
        });
        if (error) {
            console.error('Erro ao registrar upload do arquivo:', error);
        }
        return {
            success: true,
            jobId: job.id,
            totalLeads: records.length,
            validLeads: validLeads.length
        };
    }
    catch (error) {
        console.error('Erro ao processar arquivo CSV:', error);
        throw error;
    }
}
/**
 * Processa leads de um arquivo JSON
 */
export async function processJSONLeads(filePath, clientId, ofertaConfig) {
    try {
        console.log(`Processando arquivo JSON: ${filePath}`);
        // Verificar se o arquivo existe
        if (!fs.existsSync(filePath)) {
            throw new Error(`Arquivo não encontrado: ${filePath}`);
        }
        // Ler o arquivo
        const fileContent = await readFile(filePath, 'utf8');
        // Parsear o JSON
        const leads = JSON.parse(fileContent);
        if (!Array.isArray(leads)) {
            throw new Error('O arquivo JSON deve conter um array de leads');
        }
        console.log(`Encontrados ${leads.length} leads no arquivo JSON`);
        // Validar os leads
        const validLeads = leads.filter(lead => {
            // Verificar se o email é válido
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return lead.email && emailRegex.test(lead.email);
        });
        console.log(`${validLeads.length} leads válidos de ${leads.length} totais`);
        // Enfileirar job para processar os leads
        const job = await queueExternalLeadProcessing({
            clientId,
            fileId: path.basename(filePath),
            leads: validLeads,
            ofertaConfig
        });
        console.log(`Job de processamento de leads externos enfileirado com ID: ${job.id}`);
        // Registrar o upload do arquivo no banco de dados
        const { error } = await supabaseAdmin.from('lead_file_uploads').insert({
            client_id: clientId,
            file_name: path.basename(filePath),
            file_type: 'json',
            total_leads: leads.length,
            valid_leads: validLeads.length,
            uploaded_at: new Date().toISOString(),
            offer_name: ofertaConfig.oferta_nome
        });
        if (error) {
            console.error('Erro ao registrar upload do arquivo:', error);
        }
        return {
            success: true,
            jobId: job.id,
            totalLeads: leads.length,
            validLeads: validLeads.length
        };
    }
    catch (error) {
        console.error('Erro ao processar arquivo JSON:', error);
        throw error;
    }
}
// Função para executar o script diretamente
async function main() {
    const args = process.argv.slice(2);
    const command = args[0];
    try {
        switch (command) {
            case 'internal':
                // Processar leads internos
                const filters = args[1] ? JSON.parse(args[1]) : {};
                await processInternalLeads(filters);
                break;
            case 'csv':
                // Processar arquivo CSV
                if (args.length < 4) {
                    console.error('Uso: npm run process-leads csv <caminho_arquivo> <cliente_id> <oferta_config_json>');
                    process.exit(1);
                }
                const csvFilePath = args[1];
                const csvClientId = args[2];
                const csvOfertaConfig = JSON.parse(args[3]);
                await processCSVLeads(csvFilePath, csvClientId, csvOfertaConfig);
                break;
            case 'json':
                // Processar arquivo JSON
                if (args.length < 4) {
                    console.error('Uso: npm run process-leads json <caminho_arquivo> <cliente_id> <oferta_config_json>');
                    process.exit(1);
                }
                const jsonFilePath = args[1];
                const jsonClientId = args[2];
                const jsonOfertaConfig = JSON.parse(args[3]);
                await processJSONLeads(jsonFilePath, jsonClientId, jsonOfertaConfig);
                break;
            default:
                console.error('Comando inválido. Use: internal, csv ou json');
                process.exit(1);
        }
        console.log('Processamento concluído com sucesso!');
        process.exit(0);
    }
    catch (error) {
        console.error('Erro durante o processamento:', error);
        process.exit(1);
    }
}
// Executar o script se for chamado diretamente
if (require.main === module) {
    main();
}
