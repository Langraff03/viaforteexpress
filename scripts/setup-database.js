const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function setupDatabase() {
  console.log('🚀 Iniciando configuração do banco de dados...');
  
  // Verificar se as variáveis de ambiente estão configuradas
  if (!process.env.VITE_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Erro: Variáveis de ambiente do Supabase não configuradas!');
    console.log('Certifique-se de que VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY estão no arquivo .env');
    process.exit(1);
  }

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // Ler o arquivo SQL
    const sqlPath = path.join(__dirname, 'setup-database.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📄 Executando script SQL...');
    
    // Dividir o SQL em comandos individuais (separados por ponto e vírgula)
    const commands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--') && !cmd.startsWith('SELECT \''));

    let successCount = 0;
    let errorCount = 0;

    for (const command of commands) {
      if (command.includes('COMMIT') || command.includes('SELECT table_name') || command.includes('SELECT id, name')) {
        continue; // Pular comandos de verificação
      }

      try {
        const { error } = await supabase.rpc('exec_sql', { sql_query: command });
        
        if (error) {
          // Ignorar erros de "já existe"
          if (error.message.includes('already exists') || 
              error.message.includes('duplicate key') ||
              error.message.includes('relation') && error.message.includes('already exists')) {
            console.log(`⚠️  Ignorando (já existe): ${command.substring(0, 50)}...`);
          } else {
            console.error(`❌ Erro executando comando: ${error.message}`);
            console.log(`Comando: ${command.substring(0, 100)}...`);
            errorCount++;
          }
        } else {
          successCount++;
          if (command.includes('CREATE TABLE')) {
            const tableName = command.match(/CREATE TABLE.*?(\w+)\s*\(/)?.[1];
            console.log(`✅ Tabela criada: ${tableName}`);
          } else if (command.includes('CREATE TYPE')) {
            const typeName = command.match(/CREATE TYPE.*?(\w+)\s+AS/)?.[1];
            console.log(`✅ Tipo criado: ${typeName}`);
          } else if (command.includes('INSERT INTO')) {
            const tableName = command.match(/INSERT INTO.*?(\w+)\s*\(/)?.[1];
            console.log(`✅ Dados inseridos em: ${tableName}`);
          }
        }
      } catch (err) {
        console.error(`❌ Erro inesperado: ${err.message}`);
        errorCount++;
      }
    }

    console.log('\n📊 Resumo da execução:');
    console.log(`✅ Comandos executados com sucesso: ${successCount}`);
    console.log(`❌ Comandos com erro: ${errorCount}`);

    // Verificar se os dados foram inseridos corretamente
    console.log('\n🔍 Verificando dados criados...');
    
    // Verificar cliente padrão
    const { data: clients, error: clientError } = await supabase
      .from('clients')
      .select('id, name')
      .eq('id', '0ec3137d-ee68-4aba-82de-143b3c61516a');
    
    if (clientError) {
      console.error('❌ Erro ao verificar cliente:', clientError.message);
    } else if (clients && clients.length > 0) {
      console.log(`✅ Cliente padrão encontrado: ${clients[0].name}`);
    } else {
      console.log('⚠️  Cliente padrão não encontrado');
    }

    // Verificar gateway padrão
    const { data: gateways, error: gatewayError } = await supabase
      .from('gateways')
      .select('id, name, type')
      .eq('client_id', '0ec3137d-ee68-4aba-82de-143b3c61516a');
    
    if (gatewayError) {
      console.error('❌ Erro ao verificar gateway:', gatewayError.message);
    } else if (gateways && gateways.length > 0) {
      console.log(`✅ Gateway padrão encontrado: ${gateways[0].name} (${gateways[0].type})`);
    } else {
      console.log('⚠️  Gateway padrão não encontrado');
    }

    // Listar todas as tabelas criadas
    const { data: tables, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .order('table_name');
    
    if (!tableError && tables) {
      console.log('\n📋 Tabelas no banco de dados:');
      tables.forEach(table => {
        console.log(`   - ${table.table_name}`);
      });
    }

    console.log('\n🎉 Configuração do banco de dados concluída!');
    console.log('\n📝 Próximos passos:');
    console.log('1. Execute: npm run devall');
    console.log('2. Teste o webhook enviando uma requisição para: http://localhost:3001/webhook/asset');
    console.log('3. Verifique os logs para confirmar que tudo está funcionando');

  } catch (error) {
    console.error('💥 Erro geral na configuração:', error.message);
    process.exit(1);
  }
}

// Função auxiliar para executar SQL (caso o RPC não esteja disponível)
async function executeSqlDirect(supabase, sql) {
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    return { data, error };
  } catch (err) {
    // Se o RPC não existir, tentar executar diretamente
    console.log('⚠️  RPC exec_sql não disponível, tentando método alternativo...');
    return { data: null, error: err };
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  setupDatabase().catch(error => {
    console.error('💥 Falha na configuração:', error);
    process.exit(1);
  });
}

module.exports = { setupDatabase };