// src/scripts/process-json-leads.js

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { processLeadsInBatches } = require('../lib/batchLeadProcessor');

/**
 * Função principal
 */
async function main() {
  // Verificar argumentos
  const args = process.argv.slice(2);
  
  if (args.length < 1) {
    console.error('❌ Erro: Caminho do arquivo JSON não fornecido');
    console.log('Uso: node process-json-leads.js <caminho_arquivo.json> [oferta_config.json] [--direct]');
    process.exit(1);
  }

  const filePath = args[0];
  const useDirect = args.includes('--direct');
  
  // Configuração da oferta (padrão ou fornecida)
  let ofertaConfig = {
    oferta_nome: 'Oferta Especial',
    desconto: '15%',
    link_da_oferta: 'https://rastreio.viaforteexpress.com/ofertas/especial',
    descricao_adicional: 'Aproveite esta oferta exclusiva por tempo limitado!'
  };

  // Se foi fornecido um arquivo de configuração da oferta
  const configPath = args.find(arg => arg.endsWith('.json') && arg !== filePath);
  if (configPath) {
    try {
      console.log(`📝 Carregando configuração de oferta de: ${configPath}`);
      const configContent = fs.readFileSync(configPath, 'utf8');
      ofertaConfig = JSON.parse(configContent);
    } catch (error) {
      console.error('❌ Erro ao ler arquivo de configuração da oferta:', error);
      process.exit(1);
    }
  }

  try {
    // Extrair o cliente ID do caminho do arquivo ou usar um padrão
    const clientId = path.basename(path.dirname(filePath)) || 'default';
    
    console.log(`\n🚀 Iniciando processamento de leads em lotes`);
    console.log(`📂 Arquivo: ${filePath}`);
    console.log(`👤 Cliente: ${clientId}`);
    console.log(`📝 Oferta: ${ofertaConfig.oferta_nome}`);
    console.log(`🔄 Modo: ${useDirect ? 'Envio direto' : 'Enfileiramento'}`);
    
    // Processar os leads em lotes
    const result = await processLeadsInBatches(filePath, ofertaConfig, clientId, !useDirect);
    
    console.log(`\n✅ Processamento concluído com sucesso!`);
    console.log(`📊 Total de leads: ${result.totalLeads}`);
    console.log(`✓ Leads válidos: ${result.validLeads}`);
    console.log(`📧 Emails enviados/enfileirados: ${result.successCount}`);
    console.log(`❌ Falhas: ${result.failCount}`);
    console.log(`📦 Lotes processados: ${result.batchCount}`);
    
  } catch (error) {
    console.error('\n❌ Erro durante o processamento:', error);
    process.exit(1);
  }
}

// Executar a função principal
main();