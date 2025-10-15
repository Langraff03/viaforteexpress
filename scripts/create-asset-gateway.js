const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');
require('dotenv').config();

// Configurar fetch global para o Supabase
global.fetch = fetch;

// Configuração do cliente Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Erro: SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY devem estar definidos no arquivo .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// ID do cliente criado anteriormente
const clientId = '747e0d51-609f-4102-9927-d3685edd83bf';

async function createAssetGateway() {
  try {
    console.log('Iniciando criação do gateway Asset...');

    // Criar gateway Asset
    console.log('Criando gateway Asset...');
    const { data: gatewayData, error: gatewayError } = await supabase
      .from('gateways')
      .insert({
        client_id: clientId,
        type: 'asset',
        api_key: process.env.ASSET_API_KEY || 'admin_live_0JqhhCVNXuTwzhfQHiiFbYpUT7YyDNI35rY',
        webhook_secret: process.env.ASSET_WEBHOOK_SECRET || '12b81c3b01e40506bef7c583f757fe9e4a028920ca3cf178530c94fbfb4ceb43',
        additional_settings: {
          api_url: 'https://api.asaas.com/v3',
          webhook_url: 'https://rastreio.logfastexpress.com/webhook/asset'
        },
        is_active: true
      })
      .select()
      .single();

    if (gatewayError) {
      throw new Error(`Erro ao criar gateway Asset: ${gatewayError.message}`);
    }

    console.log(`Gateway Asset criado com ID: ${gatewayData.id}`);
    console.log('Gateway Asset criado com sucesso!');
    console.log('Tipo:', gatewayData.type);
    console.log('Cliente ID:', gatewayData.client_id);
    console.log('Gateway ID:', gatewayData.id);

  } catch (error) {
    console.error('Erro durante a criação do gateway Asset:', error.message);
    process.exit(1);
  }
}

createAssetGateway();