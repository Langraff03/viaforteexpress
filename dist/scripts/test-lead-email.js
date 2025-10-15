// src/scripts/test-lead-email.ts
import dotenv from 'dotenv';
dotenv.config();
import { sendOfferEmail } from '../lib/emailService';
import { queueLeadEmail } from '../lib/queue';
/**
 * Testa o envio direto de um email de oferta para um lead
 */
async function testDirectSend() {
    try {
        console.log('Testando envio direto de email de oferta...');
        const result = await sendOfferEmail({
            nome: 'Lucas',
            email: 'lucaslangrafff@gmail.com',
            oferta_nome: 'Oferta Especial de Teste',
            desconto: '15%',
            link_da_oferta: 'https://rastreio.viaforteexpress.com/ofertas/teste',
            descricao_adicional: 'Este é um email de teste para verificar o funcionamento do sistema de envio de ofertas.',
            origem: 'interno'
        });
        console.log('Email enviado com sucesso:', result);
        return result;
    }
    catch (error) {
        console.error('Erro ao enviar email de teste:', error);
        throw error;
    }
}
/**
 * Testa o enfileiramento de um email de oferta para um lead
 */
async function testQueueSend() {
    try {
        console.log('Testando enfileiramento de email de oferta...');
        const job = await queueLeadEmail({
            email: 'lucaslangrafff@gmail.com',
            nome: 'Lucas',
            oferta_nome: 'Oferta Especial de Teste (Fila)',
            desconto: '20%',
            link_da_oferta: 'https://rastreio.viaforteexpress.com/ofertas/teste-fila',
            descricao_adicional: 'Este é um email de teste enfileirado para verificar o funcionamento do sistema de filas.',
            origem: 'interno'
        });
        console.log('Email enfileirado com sucesso:', job.id);
        return { success: true, jobId: job.id };
    }
    catch (error) {
        console.error('Erro ao enfileirar email de teste:', error);
        throw error;
    }
}
/**
 * Testa o processamento de um lote de leads de teste
 */
async function testBatchProcess() {
    try {
        console.log('Testando processamento em lote de leads...');
        // Criar alguns leads de teste
        const testLeads = [
            {
                email: 'lucaslangrafff@gmail.com',
                nome: 'Lucas'
            }
        ];
        // Configuração da oferta
        const ofertaConfig = {
            oferta_nome: 'Oferta Especial em Lote',
            desconto: '25%',
            link_da_oferta: 'https://rastreio.viaforteexpress.com/ofertas/lote',
            descricao_adicional: 'Este é um teste de processamento em lote.'
        };
        // Enfileirar jobs para cada lead
        const jobs = [];
        for (const lead of testLeads) {
            const job = await queueLeadEmail({
                email: lead.email,
                nome: lead.nome,
                oferta_nome: ofertaConfig.oferta_nome,
                desconto: ofertaConfig.desconto,
                link_da_oferta: ofertaConfig.link_da_oferta,
                descricao_adicional: ofertaConfig.descricao_adicional,
                origem: 'externo',
                cliente_id: 'cliente-teste'
            });
            jobs.push(job.id);
        }
        console.log(`${jobs.length} emails enfileirados com sucesso:`, jobs);
        return { success: true, jobIds: jobs };
    }
    catch (error) {
        console.error('Erro ao processar lote de teste:', error);
        throw error;
    }
}
// Função para executar o script diretamente
async function main() {
    const args = process.argv.slice(2);
    const command = args[0] || 'direct';
    try {
        switch (command) {
            case 'direct':
                await testDirectSend();
                break;
            case 'queue':
                await testQueueSend();
                break;
            case 'batch':
                await testBatchProcess();
                break;
            default:
                console.error('Comando inválido. Use: direct, queue ou batch');
                process.exit(1);
        }
        console.log('Teste concluído com sucesso!');
        process.exit(0);
    }
    catch (error) {
        console.error('Erro durante o teste:', error);
        process.exit(1);
    }
}
// Executar o script se for chamado diretamente
if (require.main === module) {
    main();
}
