"use strict";
// src/scripts/process-client-leads.js
/**
 * Script para facilitar o processamento de arquivos JSON de leads enviados pelos clientes
 *
 * Uso:
 * node src/scripts/process-client-leads.js <nome_cliente> <caminho_arquivo_json>
 *
 * Exemplo:
 * node src/scripts/process-client-leads.js empresa-abc leads-empresa-abc.json
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
// Função principal
async function main() {
    try {
        // Verificar argumentos
        const args = process.argv.slice(2);
        if (args.length < 2) {
            console.error('❌ Erro: Argumentos insuficientes');
            console.log('Uso: node src/scripts/process-client-leads.js <nome_cliente> <caminho_arquivo_json>');
            console.log('Exemplo: node src/scripts/process-client-leads.js empresa-abc leads-empresa-abc.json');
            process.exit(1);
        }
        const clientName = args[0];
        const jsonFilePath = args[1];
        // Verificar se o arquivo existe
        if (!fs.existsSync(jsonFilePath)) {
            console.error(`❌ Erro: Arquivo não encontrado: ${jsonFilePath}`);
            process.exit(1);
        }
        console.log(`\n🔍 Processando leads do cliente: ${clientName}`);
        console.log(`📄 Arquivo: ${jsonFilePath}`);
        // Criar pasta para o cliente se não existir
        const clientDir = path.join('clients', clientName);
        if (!fs.existsSync(clientDir)) {
            fs.mkdirSync(clientDir, { recursive: true });
            console.log(`📁 Pasta do cliente criada: ${clientDir}`);
        }
        // Criar arquivo de configuração de oferta para o cliente se não existir
        const ofertaConfigPath = path.join(clientDir, 'oferta-config.json');
        if (!fs.existsSync(ofertaConfigPath)) {
            const defaultConfig = {
                oferta_nome: `Oferta Especial para Clientes ${clientName}`,
                desconto: "15%",
                link_da_oferta: "https://rastreio.viaforteexpress.com/ofertas/especial",
                descricao_adicional: "Aproveite esta oferta exclusiva por tempo limitado!"
            };
            fs.writeFileSync(ofertaConfigPath, JSON.stringify(defaultConfig, null, 2));
            console.log(`📝 Arquivo de configuração de oferta criado: ${ofertaConfigPath}`);
            console.log('⚠️ Você pode editar este arquivo para personalizar a oferta para este cliente');
        }
        // Copiar o arquivo JSON para a pasta do cliente
        const destJsonPath = path.join(clientDir, path.basename(jsonFilePath));
        fs.copyFileSync(jsonFilePath, destJsonPath);
        console.log(`📋 Arquivo JSON copiado para: ${destJsonPath}`);
        // Criar pasta de logs se não existir
        const logsDir = path.join(clientDir, 'logs');
        if (!fs.existsSync(logsDir)) {
            fs.mkdirSync(logsDir, { recursive: true });
        }
        // Nome do arquivo de log
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const logFilePath = path.join(logsDir, `processamento-${timestamp}.log`);
        console.log(`\n🚀 Iniciando processamento de leads em lotes...`);
        // Executar o script de processamento e salvar a saída em um arquivo de log
        try {
            // Criar um stream para o arquivo de log
            const logStream = fs.createWriteStream(logFilePath);
            // Executar o comando e capturar a saída
            console.log(`\n📝 Processando... (a saída será salva em ${logFilePath})`);
            // Verificar o tamanho do arquivo para determinar se é um arquivo grande
            const stats = fs.statSync(destJsonPath);
            const fileSizeMB = stats.size / (1024 * 1024);
            // Para arquivos grandes, mostrar uma mensagem especial
            if (fileSizeMB > 5) {
                console.log(`\n⚠️ Arquivo grande detectado (${fileSizeMB.toFixed(2)} MB)`);
                console.log(`🔄 Usando processamento em lotes para melhor desempenho`);
                console.log(`⏳ Este processo pode levar alguns minutos para arquivos grandes`);
                console.log(`📊 O progresso será exibido durante o processamento\n`);
            }
            const output = execSync(`node src/scripts/process-json-leads.js "${destJsonPath}" "${ofertaConfigPath}"`, {
                encoding: 'utf8',
                // Aumentar o tempo máximo de execução para arquivos grandes
                timeout: Math.max(60000 * 10, Math.round(fileSizeMB * 60000))
            });
            // Escrever a saída no console e no arquivo de log
            console.log(output);
            logStream.write(output);
            logStream.end();
            console.log(`\n✅ Processamento concluído com sucesso!`);
            console.log(`📊 Log salvo em: ${logFilePath}`);
            // Mover o arquivo JSON para uma subpasta 'processados'
            const processedDir = path.join(clientDir, 'processados');
            if (!fs.existsSync(processedDir)) {
                fs.mkdirSync(processedDir, { recursive: true });
            }
            const processedFilePath = path.join(processedDir, `${path.basename(jsonFilePath, '.json')}-${timestamp}.json`);
            fs.copyFileSync(destJsonPath, processedFilePath);
            console.log(`📦 Arquivo JSON arquivado em: ${processedFilePath}`);
        }
        catch (execError) {
            console.error(`\n❌ Erro durante o processamento:`);
            console.error(execError.message);
            // Mover o arquivo JSON para uma subpasta 'falhas'
            const failedDir = path.join(clientDir, 'falhas');
            if (!fs.existsSync(failedDir)) {
                fs.mkdirSync(failedDir, { recursive: true });
            }
            const failedFilePath = path.join(failedDir, `${path.basename(jsonFilePath, '.json')}-${timestamp}.json`);
            fs.copyFileSync(destJsonPath, failedFilePath);
            console.error(`📦 Arquivo JSON com falha arquivado em: ${failedFilePath}`);
            process.exit(1);
        }
    }
    catch (error) {
        console.error('❌ Erro:', error);
        process.exit(1);
    }
}
// Executar a função principal
main();
