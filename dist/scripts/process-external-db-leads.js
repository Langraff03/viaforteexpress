"use strict";
// src/scripts/process-external-db-leads.js
/**
 * Script para processar leads diretamente do banco de dados do cliente
 *
 * Uso:
 * node src/scripts/process-external-db-leads.js <caminho_config_conexao> <caminho_config_oferta>
 *
 * Exemplo:
 * node src/scripts/process-external-db-leads.js ./cliente-db-config.json ./oferta-config.json
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { queueExternalLeadProcessing } = require('../lib/queue');
// Importar drivers de banco de dados dinamicamente
let pg, mysql, mssql;
try {
    pg = require('pg');
}
catch (e) { /* Opcional */ }
try {
    mysql = require('mysql2/promise');
}
catch (e) { /* Opcional */ }
try {
    mssql = require('mssql');
}
catch (e) { /* Opcional */ }
/**
 * Processa leads de um banco de dados externo
 * @param {Object} dbConfig - Configuração de conexão com o banco
 * @param {Object} ofertaConfig - Configuração da oferta
 * @param {number} batchSize - Tamanho do lote (padrão: 100)
 */
async function processExternalDbLeads(dbConfig, ofertaConfig, batchSize = 100) {
    console.log(`\n🔍 Conectando ao banco de dados externo: ${dbConfig.connection.host}/${dbConfig.connection.database}`);
    // Validar configuração
    if (!dbConfig.type || !dbConfig.connection || !dbConfig.table_name || !dbConfig.field_mapping) {
        throw new Error('Configuração de banco de dados inválida. Verifique o arquivo de configuração.');
    }
    if (!dbConfig.field_mapping.email) {
        throw new Error('Mapeamento de campo de email é obrigatório.');
    }
    // Conectar ao banco de dados
    let connection;
    let totalLeads = 0;
    let processedLeads = 0;
    let successCount = 0;
    let failCount = 0;
    try {
        // Conectar ao tipo de banco apropriado
        switch (dbConfig.type.toLowerCase()) {
            case 'postgres':
            case 'postgresql':
                if (!pg)
                    throw new Error('Módulo "pg" não instalado. Execute: npm install pg');
                connection = new pg.Pool(dbConfig.connection);
                break;
            case 'mysql':
                if (!mysql)
                    throw new Error('Módulo "mysql2" não instalado. Execute: npm install mysql2');
                connection = await mysql.createConnection(dbConfig.connection);
                break;
            case 'mssql':
            case 'sqlserver':
                if (!mssql)
                    throw new Error('Módulo "mssql" não instalado. Execute: npm install mssql');
                await mssql.connect(dbConfig.connection);
                connection = mssql;
                break;
            default:
                throw new Error(`Tipo de banco de dados não suportado: ${dbConfig.type}`);
        }
        console.log(`✅ Conexão estabelecida com sucesso`);
        // Contar total de leads
        totalLeads = await countLeads(connection, dbConfig);
        console.log(`📊 Total de leads encontrados: ${totalLeads}`);
        if (totalLeads === 0) {
            console.log(`⚠️ Nenhum lead encontrado com os filtros especificados.`);
            return { success: true, totalLeads: 0, processedLeads: 0 };
        }
        // Calcular número de lotes
        const totalBatches = Math.ceil(totalLeads / batchSize);
        console.log(`📦 Processando em ${totalBatches} lotes de até ${batchSize} leads cada`);
        // Processar em lotes
        for (let batchNum = 0; batchNum < totalBatches; batchNum++) {
            const offset = batchNum * batchSize;
            console.log(`\n📦 Processando lote ${batchNum + 1}/${totalBatches}`);
            // Buscar lote de leads
            const leads = await fetchLeadsBatch(connection, dbConfig, offset, batchSize);
            // Mapear campos para o formato esperado pelo sistema
            const mappedLeads = leads.map(lead => {
                const mappedLead = {};
                // Mapear email (obrigatório)
                mappedLead.email = lead[dbConfig.field_mapping.email];
                // Mapear nome (opcional)
                if (dbConfig.field_mapping.nome) {
                    mappedLead.nome = lead[dbConfig.field_mapping.nome];
                }
                // Mapear outros campos opcionais
                if (dbConfig.field_mapping.telefone) {
                    mappedLead.telefone = lead[dbConfig.field_mapping.telefone];
                }
                if (dbConfig.field_mapping.oferta_interesse) {
                    mappedLead.oferta_interesse = lead[dbConfig.field_mapping.oferta_interesse];
                }
                // Adicionar campos personalizados
                if (dbConfig.custom_fields) {
                    Object.entries(dbConfig.custom_fields).forEach(([key, fieldName]) => {
                        mappedLead[key] = lead[fieldName];
                    });
                }
                return mappedLead;
            });
            // Validar leads
            const validLeads = mappedLeads.filter(lead => {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                return lead.email && emailRegex.test(lead.email);
            });
            console.log(`✅ ${validLeads.length} leads válidos de ${mappedLeads.length} no lote atual`);
            // Enfileirar para processamento
            if (validLeads.length > 0) {
                try {
                    // Usar o cliente ID da configuração ou um valor padrão
                    const clientId = dbConfig.client_id || path.basename(dbConfig.connection.database);
                    // Enfileirar job para processar os leads
                    await queueExternalLeadProcessing({
                        clientId,
                        fileId: `db-${dbConfig.connection.database}-batch-${batchNum + 1}`,
                        leads: validLeads,
                        ofertaConfig
                    });
                    successCount += validLeads.length;
                    console.log(`✅ Lote ${batchNum + 1} enfileirado com sucesso`);
                }
                catch (error) {
                    console.error(`❌ Erro ao enfileirar lote ${batchNum + 1}:`, error);
                    failCount += validLeads.length;
                }
            }
            processedLeads += mappedLeads.length;
            // Exibir progresso
            const progress = Math.round((processedLeads / totalLeads) * 100);
            console.log(`📊 Progresso: ${progress}% (${processedLeads}/${totalLeads} leads)`);
        }
        console.log(`\n📊 Resumo do processamento:`);
        console.log(`✅ ${successCount} leads enfileirados com sucesso`);
        console.log(`❌ ${failCount} leads falharam`);
        console.log(`📧 ${processedLeads} leads processados no total`);
        return {
            success: true,
            totalLeads,
            processedLeads,
            successCount,
            failCount
        };
    }
    catch (error) {
        console.error(`❌ Erro ao processar leads do banco de dados:`, error);
        throw error;
    }
    finally {
        // Fechar conexão com o banco
        if (connection) {
            try {
                if (dbConfig.type.toLowerCase() === 'postgres' || dbConfig.type.toLowerCase() === 'postgresql') {
                    await connection.end();
                }
                else if (dbConfig.type.toLowerCase() === 'mysql') {
                    await connection.end();
                }
                else if (dbConfig.type.toLowerCase() === 'mssql' || dbConfig.type.toLowerCase() === 'sqlserver') {
                    await connection.close();
                }
                console.log(`🔌 Conexão com o banco de dados fechada`);
            }
            catch (err) {
                console.error(`⚠️ Erro ao fechar conexão:`, err);
            }
        }
    }
}
/**
 * Conta o número total de leads no banco de dados
 * @param {Object} connection - Conexão com o banco
 * @param {Object} dbConfig - Configuração do banco
 * @returns {Promise<number>} - Número total de leads
 */
async function countLeads(connection, dbConfig) {
    // Construir a query de contagem
    let countQuery = `SELECT COUNT(*) as total FROM ${dbConfig.table_name}`;
    // Adicionar cláusula WHERE se houver filtros
    if (dbConfig.filters && Object.keys(dbConfig.filters).length > 0) {
        const whereConditions = [];
        Object.entries(dbConfig.filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                // Tratar diferentes tipos de valores
                if (typeof value === 'string') {
                    whereConditions.push(`${key} = '${value.replace(/'/g, "''")}'`);
                }
                else if (typeof value === 'boolean') {
                    whereConditions.push(`${key} = ${value ? 'TRUE' : 'FALSE'}`);
                }
                else {
                    whereConditions.push(`${key} = ${value}`);
                }
            }
        });
        if (whereConditions.length > 0) {
            countQuery += ` WHERE ${whereConditions.join(' AND ')}`;
        }
    }
    // Executar a query de acordo com o tipo de banco
    try {
        let result;
        if (dbConfig.type.toLowerCase() === 'postgres' || dbConfig.type.toLowerCase() === 'postgresql') {
            const { rows } = await connection.query(countQuery);
            result = parseInt(rows[0].total);
        }
        else if (dbConfig.type.toLowerCase() === 'mysql') {
            const [rows] = await connection.execute(countQuery);
            result = parseInt(rows[0].total);
        }
        else if (dbConfig.type.toLowerCase() === 'mssql' || dbConfig.type.toLowerCase() === 'sqlserver') {
            const result = await connection.request().query(countQuery);
            return parseInt(result.recordset[0].total);
        }
        return result;
    }
    catch (error) {
        console.error(`❌ Erro ao contar leads:`, error);
        throw error;
    }
}
/**
 * Busca um lote de leads do banco de dados
 * @param {Object} connection - Conexão com o banco
 * @param {Object} dbConfig - Configuração do banco
 * @param {number} offset - Deslocamento para paginação
 * @param {number} limit - Limite de registros
 * @returns {Promise<Array>} - Array de leads
 */
async function fetchLeadsBatch(connection, dbConfig, offset, limit) {
    // Construir a lista de campos a serem selecionados
    const fields = [];
    // Adicionar campos mapeados
    Object.values(dbConfig.field_mapping).forEach(field => {
        fields.push(field);
    });
    // Adicionar campos personalizados
    if (dbConfig.custom_fields) {
        Object.values(dbConfig.custom_fields).forEach(field => {
            if (!fields.includes(field)) {
                fields.push(field);
            }
        });
    }
    // Construir a query
    let query = `SELECT ${fields.join(', ')} FROM ${dbConfig.table_name}`;
    // Adicionar cláusula WHERE se houver filtros
    if (dbConfig.filters && Object.keys(dbConfig.filters).length > 0) {
        const whereConditions = [];
        Object.entries(dbConfig.filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                // Tratar diferentes tipos de valores
                if (typeof value === 'string') {
                    whereConditions.push(`${key} = '${value.replace(/'/g, "''")}'`);
                }
                else if (typeof value === 'boolean') {
                    whereConditions.push(`${key} = ${value ? 'TRUE' : 'FALSE'}`);
                }
                else {
                    whereConditions.push(`${key} = ${value}`);
                }
            }
        });
        if (whereConditions.length > 0) {
            query += ` WHERE ${whereConditions.join(' AND ')}`;
        }
    }
    // Adicionar paginação de acordo com o tipo de banco
    if (dbConfig.type.toLowerCase() === 'postgres' || dbConfig.type.toLowerCase() === 'postgresql') {
        query += ` LIMIT ${limit} OFFSET ${offset}`;
    }
    else if (dbConfig.type.toLowerCase() === 'mysql') {
        query += ` LIMIT ${offset}, ${limit}`;
    }
    else if (dbConfig.type.toLowerCase() === 'mssql' || dbConfig.type.toLowerCase() === 'sqlserver') {
        // SQL Server requer ORDER BY para OFFSET/FETCH
        const orderByField = Object.values(dbConfig.field_mapping)[0]; // Usar primeiro campo mapeado
        query += ` ORDER BY ${orderByField} OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY`;
    }
    // Executar a query de acordo com o tipo de banco
    try {
        if (dbConfig.type.toLowerCase() === 'postgres' || dbConfig.type.toLowerCase() === 'postgresql') {
            const { rows } = await connection.query(query);
            return rows;
        }
        else if (dbConfig.type.toLowerCase() === 'mysql') {
            const [rows] = await connection.execute(query);
            return rows;
        }
        else if (dbConfig.type.toLowerCase() === 'mssql' || dbConfig.type.toLowerCase() === 'sqlserver') {
            const result = await connection.request().query(query);
            return result.recordset;
        }
    }
    catch (error) {
        console.error(`❌ Erro ao buscar lote de leads:`, error);
        throw error;
    }
}
// Função principal
async function main() {
    // Verificar argumentos
    const args = process.argv.slice(2);
    if (args.length < 2) {
        console.error('❌ Erro: Argumentos insuficientes');
        console.log('Uso: node src/scripts/process-external-db-leads.js <caminho_config_conexao> <caminho_config_oferta>');
        console.log('Exemplo: node src/scripts/process-external-db-leads.js ./cliente-db-config.json ./oferta-config.json');
        process.exit(1);
    }
    const dbConfigPath = args[0];
    const ofertaConfigPath = args[1];
    try {
        // Verificar se os arquivos existem
        if (!fs.existsSync(dbConfigPath)) {
            console.error(`❌ Erro: Arquivo de configuração de banco não encontrado: ${dbConfigPath}`);
            process.exit(1);
        }
        if (!fs.existsSync(ofertaConfigPath)) {
            console.error(`❌ Erro: Arquivo de configuração de oferta não encontrado: ${ofertaConfigPath}`);
            process.exit(1);
        }
        // Ler arquivos de configuração
        const dbConfigContent = fs.readFileSync(dbConfigPath, 'utf8');
        const ofertaConfigContent = fs.readFileSync(ofertaConfigPath, 'utf8');
        const dbConfig = JSON.parse(dbConfigContent);
        const ofertaConfig = JSON.parse(ofertaConfigContent);
        // Processar leads
        await processExternalDbLeads(dbConfig, ofertaConfig);
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
module.exports = {
    processExternalDbLeads
};
