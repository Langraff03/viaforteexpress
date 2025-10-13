const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
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

// IDs do cliente e gateway criados anteriormente
const clientId = '747e0d51-609f-4102-9927-d3685edd83bf';
const gatewayId = '63b8c4fe-14ad-4c80-885f-08e0fb9eec1a';

// Dados do usuário de gateway
const gatewayUserEmail = 'asset-user@rastreio.logfastexpress.com';
const gatewayUserPassword = 'gateway123';
const gatewayUserName = 'Asset Gateway User';

async function createGatewayUser() {
  try {
    console.log('Iniciando criação de usuário de gateway...');

    // 1. Registrar o usuário na autenticação do Supabase
    console.log('Registrando usuário na autenticação do Supabase...');
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: gatewayUserEmail,
      password: gatewayUserPassword,
      email_confirm: true
    });

    if (authError) {
      throw new Error(`Erro ao criar usuário na autenticação: ${authError.message}`);
    }

    console.log(`Usuário autenticado criado com ID: ${authData.user.id}`);

    // 2. Gerar hash da senha para armazenar no banco
    const passwordHash = await bcrypt.hash(gatewayUserPassword, 10);

    // 3. Criar usuário de gateway na tabela users
    console.log('Criando usuário de gateway na tabela users...');
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email: gatewayUserEmail,
        name: gatewayUserName,
        password_hash: passwordHash,
        role: 'gateway_user',
        client_id: clientId,
        gateway_id: gatewayId
      })
      .select()
      .single();

    if (userError) {
      throw new Error(`Erro ao criar usuário no banco de dados: ${userError.message}`);
    }

    console.log(`Usuário de gateway criado com sucesso: ${userData.name} (${userData.email})`);
    console.log('Credenciais de usuário de gateway criadas com sucesso!');
    console.log('Email:', gatewayUserEmail);
    console.log('Senha:', gatewayUserPassword);
    console.log('Role:', userData.role);
    console.log('Cliente ID:', userData.client_id);
    console.log('Gateway ID:', userData.gateway_id);

  } catch (error) {
    console.error('Erro durante a criação do usuário de gateway:', error.message);
    process.exit(1);
  }
}

createGatewayUser();