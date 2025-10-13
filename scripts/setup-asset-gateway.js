// scripts/setup-asset-gateway.js
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Carregar variáveis de ambiente do arquivo .env na raiz do projeto
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// --- Configurações ---
const ASSET_API_KEY = 'admin_live_0JqhhCVNXuTwzhfQHiiFbYpUT7YyDNI35rY';
const ASSET_WEBHOOK_SECRET = '12b81c3b01e40506bef7c583f757fe9e4a028920ca3cf178530c94fbfb4ceb43';

const NEW_USER_EMAIL = 'asset@gmail.com';
const NEW_USER_PASSWORD = 'asset123';
// --- Fim das Configurações ---

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Erro: As variáveis de ambiente VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY precisam estar definidas no seu arquivo .env');
  process.exit(1);
}

// Criar um cliente Supabase com privilégios de administrador
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

async function setupGateway() {
  console.log('🚀 Iniciando a configuração do gateway e do usuário...');

  try {
    // Passo 1: Criar um novo cliente
    console.log('1. Criando o cliente...');
    const { data: client, error: clientError } = await supabaseAdmin
      .from('clients')
      .insert({ name: 'Cliente Asset (Gerado por Script)' })
      .select()
      .single();

    if (clientError) throw new Error(`Erro ao criar cliente: ${clientError.message}`);
    console.log(`✅ Cliente criado com sucesso! ID: ${client.id}`);

    // Passo 2: Criar o gateway do tipo 'Asset'
    console.log('2. Criando o gateway...');
    const { data: gateway, error: gatewayError } = await supabaseAdmin
      .from('gateways')
      .insert({
        client_id: client.id,
        type: 'Asset',
        name: 'Gateway Principal Asset',
        config: {
          api_key: ASSET_API_KEY,
          webhook_secret: ASSET_WEBHOOK_SECRET,
        },
      })
      .select()
      .single();

    if (gatewayError) throw new Error(`Erro ao criar gateway: ${gatewayError.message}`);
    console.log(`✅ Gateway criado com sucesso! ID: ${gateway.id}`);

    // Passo 3: Criar o usuário de autenticação
    console.log(`3. Criando o usuário de autenticação para ${NEW_USER_EMAIL}...`);
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: NEW_USER_EMAIL,
      password: NEW_USER_PASSWORD,
      email_confirm: true, // Marcar o e-mail como confirmado
      user_metadata: { full_name: 'Usuário Gateway Asset' },
    });

    if (authError) throw new Error(`Erro ao criar usuário de autenticação: ${authError.message}`);
    console.log(`✅ Usuário de autenticação criado com sucesso! ID: ${authUser.user.id}`);

    // Passo 4: Atualizar o perfil público que foi criado automaticamente pelo Supabase
    console.log('4. Atualizando o perfil do usuário...');
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        role: 'gateway_user',
        client_id: client.id,
        gateway_id: gateway.id,
        full_name: 'Usuário Gateway Asset',
      })
      .eq('id', authUser.user.id);

    if (profileError) throw new Error(`Erro ao atualizar perfil: ${profileError.message}`);
    console.log('✅ Perfil do usuário criado e associado com sucesso!');

    console.log('\n🎉 Configuração concluída com sucesso!');
    console.log('-----------------------------------------');
    console.log('E-mail do Usuário:', NEW_USER_EMAIL);
    console.log('Senha do Usuário:', NEW_USER_PASSWORD);
    console.log('-----------------------------------------');

  } catch (error) {
    console.error('\n❌ Ocorreu um erro durante a configuração:');
    console.error(error.message);
    process.exit(1);
  }
}

// Verificar se os placeholders foram preenchidos
if (ASSET_API_KEY === 'SUA_ASSET_API_KEY_AQUI' || ASSET_WEBHOOK_SECRET === 'SEU_ASSET_WEBHOOK_SECRET_AQUI') {
  console.error('!! ATENÇÃO !! Por favor, edite o arquivo "scripts/setup-asset-gateway.js" e preencha os valores de ASSET_API_KEY e ASSET_WEBHOOK_SECRET.');
} else {
  setupGateway();
}