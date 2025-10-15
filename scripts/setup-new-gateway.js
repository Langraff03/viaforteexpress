#!/usr/bin/env node

/**
 * Script para configurar um novo gateway de pagamento no banco de dados
 * 
 * Uso:
 * node scripts/setup-new-gateway.js --type=mercadopago --client-id=UUID --name="Mercado Pago" --config='{"accessToken":"...", "publicKey":"..."}'
 * 
 * Ou interativo:
 * node scripts/setup-new-gateway.js
 */

const { createClient } = require('@supabase/supabase-js');
const readline = require('readline');
const { v4: uuidv4 } = require('uuid');

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Interface para input do usuário
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * Schemas de configuração padrão para diferentes gateways
 */
const CONFIG_SCHEMAS = {
  asset: {
    required: ['api_key', 'api_url', 'webhook_secret'],
    optional: ['sandbox'],
    example: {
      api_key: 'admin_live_XXXXXXXXXXXXXXXXXXXXXXXXXX',
      api_url: 'https://api.asaas.com/v3',
      webhook_secret: 'your-webhook-secret'
    }
  },
  mercadopago: {
    required: ['access_token', 'public_key', 'webhook_secret'],
    optional: ['sandbox_mode'],
    example: {
      access_token: 'APP_USR-XXXXXXXXXXXXXXXXXXXXXXXXXX',
      public_key: 'APP_USR-XXXXXXXXXXXXXXXXXXXXXXXXXX',
      webhook_secret: 'your-webhook-secret',
      sandbox_mode: false
    }
  },
  stripe: {
    required: ['secret_key', 'publishable_key', 'webhook_secret'],
    optional: ['api_version'],
    example: {
      secret_key: 'YOUR_STRIPE_SECRET_KEY',
      publishable_key: 'YOUR_STRIPE_PUBLISHABLE_KEY',
      webhook_secret: 'YOUR_STRIPE_WEBHOOK_SECRET',
      api_version: '2023-10-16'
    }
  },
  pagarme: {
    required: ['api_key', 'encryption_key', 'webhook_secret'],
    optional: ['sandbox_mode'],
    example: {
      api_key: 'ak_live_XXXXXXXXXXXXXXXXXXXXXXXXXX',
      encryption_key: 'ek_live_XXXXXXXXXXXXXXXXXXXXXXXXXX',
      webhook_secret: 'your-webhook-secret',
      sandbox_mode: false
    }
  }
};

/**
 * Função para fazer pergunta ao usuário
 */
function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

/**
 * Valida se um UUID é válido
 */
function isValidUUID(uuid) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Verifica se um cliente existe no banco
 */
async function checkClientExists(clientId) {
  const { data, error } = await supabase
    .from('clients')
    .select('id, name')
    .eq('id', clientId)
    .single();

  if (error) {
    console.error('❌ Erro ao verificar cliente:', error.message);
    return null;
  }

  return data;
}

/**
 * Lista todos os clientes disponíveis
 */
async function listClients() {
  const { data, error } = await supabase
    .from('clients')
    .select('id, name, email')
    .order('name');

  if (error) {
    console.error('❌ Erro ao listar clientes:', error.message);
    return [];
  }

  return data || [];
}

/**
 * Verifica se já existe um gateway do mesmo tipo para o cliente
 */
async function checkExistingGateway(clientId, type) {
  const { data, error } = await supabase
    .from('gateways')
    .select('id, name, is_active')
    .eq('client_id', clientId)
    .eq('type', type);

  if (error) {
    console.error('❌ Erro ao verificar gateway existente:', error.message);
    return null;
  }

  return data;
}

/**
 * Valida a configuração do gateway
 */
function validateConfig(type, config) {
  const schema = CONFIG_SCHEMAS[type];
  if (!schema) {
    console.warn(`⚠️  Schema não encontrado para tipo '${type}'. Validação básica apenas.`);
    return { valid: true, errors: [] };
  }

  const errors = [];
  
  // Verificar campos obrigatórios
  for (const field of schema.required) {
    if (!config[field]) {
      errors.push(`Campo obrigatório '${field}' não encontrado`);
    }
  }

  // Validações específicas por tipo
  if (type === 'asset' && config.api_key && !config.api_key.startsWith('admin_')) {
    errors.push('API Key do Asset deve começar com "admin_"');
  }

  if (type === 'mercadopago') {
    if (config.access_token && !config.access_token.startsWith('APP_USR-')) {
      errors.push('Access Token do Mercado Pago deve começar com "APP_USR-"');
    }
    if (config.public_key && !config.public_key.startsWith('APP_USR-')) {
      errors.push('Public Key do Mercado Pago deve começar com "APP_USR-"');
    }
  }

  if (type === 'stripe') {
    if (config.secret_key && !config.secret_key.startsWith('sk_')) {
      errors.push('Secret Key do Stripe deve começar com "sk_"');
    }
    if (config.publishable_key && !config.publishable_key.startsWith('pk_')) {
      errors.push('Publishable Key do Stripe deve começar com "pk_"');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Insere o gateway no banco de dados
 */
async function insertGateway(clientId, type, name, config) {
  const gatewayData = {
    id: uuidv4(),
    client_id: clientId,
    type: type,
    name: name,
    config: config,
    is_active: true,
    created_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('gateways')
    .insert([gatewayData])
    .select()
    .single();

  if (error) {
    console.error('❌ Erro ao inserir gateway:', error.message);
    return null;
  }

  return data;
}

/**
 * Modo interativo
 */
async function interactiveMode() {
  console.log('\n🔧 Configuração Interativa de Gateway\n');

  // Listar clientes disponíveis
  const clients = await listClients();
  if (clients.length === 0) {
    console.log('❌ Nenhum cliente encontrado. Crie um cliente primeiro.');
    return;
  }

  console.log('📋 Clientes disponíveis:');
  clients.forEach((client, index) => {
    console.log(`  ${index + 1}. ${client.name} (${client.id})`);
  });

  // Selecionar cliente
  const clientIndex = await askQuestion('\nEscolha o número do cliente: ');
  const selectedClient = clients[parseInt(clientIndex) - 1];
  
  if (!selectedClient) {
    console.log('❌ Cliente inválido selecionado.');
    return;
  }

  console.log(`✅ Cliente selecionado: ${selectedClient.name}`);

  // Selecionar tipo de gateway
  const availableTypes = Object.keys(CONFIG_SCHEMAS);
  console.log('\n🔌 Tipos de gateway disponíveis:');
  availableTypes.forEach((type, index) => {
    console.log(`  ${index + 1}. ${type}`);
  });

  const typeIndex = await askQuestion('\nEscolha o número do tipo de gateway: ');
  const selectedType = availableTypes[parseInt(typeIndex) - 1];

  if (!selectedType) {
    console.log('❌ Tipo de gateway inválido.');
    return;
  }

  // Verificar se já existe
  const existing = await checkExistingGateway(selectedClient.id, selectedType);
  if (existing && existing.length > 0) {
    console.log(`⚠️  Já existe um gateway ${selectedType} para este cliente:`);
    existing.forEach(gw => {
      console.log(`  - ${gw.name} (${gw.is_active ? 'Ativo' : 'Inativo'})`);
    });
    
    const proceed = await askQuestion('\nDeseja continuar mesmo assim? (s/n): ');
    if (proceed.toLowerCase() !== 's') {
      console.log('Operação cancelada.');
      return;
    }
  }

  // Nome do gateway
  const gatewayName = await askQuestion(`\nNome do gateway (ex: "${selectedType} Production"): `);

  // Configuração
  const schema = CONFIG_SCHEMAS[selectedType];
  console.log(`\n⚙️  Configuração para ${selectedType}:`);
  console.log(`Campos obrigatórios: ${schema.required.join(', ')}`);
  console.log(`Campos opcionais: ${schema.optional.join(', ')}`);
  console.log('\nExemplo de configuração:');
  console.log(JSON.stringify(schema.example, null, 2));

  const configJson = await askQuestion('\nCole a configuração JSON: ');
  
  let config;
  try {
    config = JSON.parse(configJson);
  } catch (error) {
    console.log('❌ JSON inválido:', error.message);
    return;
  }

  // Validar configuração
  const validation = validateConfig(selectedType, config);
  if (!validation.valid) {
    console.log('❌ Configuração inválida:');
    validation.errors.forEach(error => console.log(`  - ${error}`));
    return;
  }

  // Inserir no banco
  console.log('\n🔄 Inserindo gateway no banco de dados...');
  const result = await insertGateway(selectedClient.id, selectedType, gatewayName, config);

  if (result) {
    console.log('✅ Gateway configurado com sucesso!');
    console.log(`   ID: ${result.id}`);
    console.log(`   Cliente: ${selectedClient.name}`);
    console.log(`   Tipo: ${selectedType}`);
    console.log(`   Nome: ${gatewayName}`);
    console.log(`   Ativo: ${result.is_active ? 'Sim' : 'Não'}`);
  }
}

/**
 * Modo por argumentos de linha de comando
 */
async function commandLineMode() {
  const args = process.argv.slice(2);
  const params = {};

  // Parsear argumentos
  args.forEach(arg => {
    if (arg.startsWith('--')) {
      const [key, value] = arg.substring(2).split('=');
      params[key] = value;
    }
  });

  // Validar argumentos obrigatórios
  const required = ['type', 'client-id', 'name', 'config'];
  for (const param of required) {
    if (!params[param]) {
      console.log(`❌ Parâmetro obrigatório --${param} não encontrado`);
      console.log('\nUso: node scripts/setup-new-gateway.js --type=mercadopago --client-id=UUID --name="Nome" --config=\'{"key":"value"}\'');
      return;
    }
  }

  // Validar UUID do cliente
  if (!isValidUUID(params['client-id'])) {
    console.log('❌ client-id deve ser um UUID válido');
    return;
  }

  // Verificar se cliente existe
  const client = await checkClientExists(params['client-id']);
  if (!client) {
    console.log('❌ Cliente não encontrado');
    return;
  }

  // Parsear configuração
  let config;
  try {
    config = JSON.parse(params.config);
  } catch (error) {
    console.log('❌ JSON da configuração inválido:', error.message);
    return;
  }

  // Validar configuração
  const validation = validateConfig(params.type, config);
  if (!validation.valid) {
    console.log('❌ Configuração inválida:');
    validation.errors.forEach(error => console.log(`  - ${error}`));
    return;
  }

  // Inserir no banco
  console.log('🔄 Inserindo gateway no banco de dados...');
  const result = await insertGateway(params['client-id'], params.type, params.name, config);

  if (result) {
    console.log('✅ Gateway configurado com sucesso!');
    console.log(`   ID: ${result.id}`);
    console.log(`   Cliente: ${client.name}`);
    console.log(`   Tipo: ${params.type}`);
    console.log(`   Nome: ${params.name}`);
  }
}

/**
 * Função principal
 */
async function main() {
  console.log('🚀 Setup de Novo Gateway de Pagamento\n');

  // Verificar se tem argumentos de linha de comando
  const hasArgs = process.argv.length > 2 && process.argv.some(arg => arg.startsWith('--'));

  try {
    if (hasArgs) {
      await commandLineMode();
    } else {
      await interactiveMode();
    }
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    rl.close();
  }
}

// Executar se for chamado diretamente
if (require.main === module) {
  main();
}

module.exports = {
  insertGateway,
  validateConfig,
  checkClientExists,
  CONFIG_SCHEMAS
};