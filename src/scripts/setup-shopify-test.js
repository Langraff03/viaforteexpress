/**
 * Script para configurar um cliente de teste da Shopify
 * Executa: node src/scripts/setup-shopify-test.js
 */

// Carregar variáveis de ambiente
require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

// Configuração Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Erro: Variáveis de ambiente do Supabase não encontradas!');
  console.error('   Verifique se o arquivo .env contém:');
  console.error('   - VITE_SUPABASE_URL');
  console.error('   - VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

console.log(`🔗 Conectando com Supabase: ${supabaseUrl.substring(0, 30)}...`);
const supabase = createClient(supabaseUrl, supabaseKey);

// Dados de teste
const TEST_CLIENT = {
  id: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  name: 'Cliente Teste Shopify',
  email: 'cliente.teste.shopify@exemplo.com',
  role: 'freelancer'
};

const SHOPIFY_CONFIG = {
  user_id: TEST_CLIENT.id,
  gateway_type: 'shopify',
  config: {
    webhookSecret: 'meu_secret_shopify_teste_123',
    clientId: TEST_CLIENT.id,
    gatewayId: `shopify-${TEST_CLIENT.id}`,
    shopDomain: 'loja-teste.myshopify.com',
    createdAt: new Date().toISOString()
  }
};

async function setupShopifyTest() {
  try {
    console.log('🛍️ Configurando cliente de teste da Shopify...\n');

    // 1. Verificar se usuário já existe
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', TEST_CLIENT.id)
      .maybeSingle();

    if (!existingUser) {
      // 2. Criar usuário de teste
      console.log('👤 Criando usuário de teste...');
      const { data: user, error: userError } = await supabase
        .from('profiles')
        .insert({
          id: TEST_CLIENT.id,
          name: TEST_CLIENT.name,
          email: TEST_CLIENT.email,
          role: TEST_CLIENT.role,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (userError) {
        throw new Error(`Erro ao criar usuário: ${userError.message}`);
      }
      console.log('✅ Usuário criado com sucesso!');
    } else {
      console.log('👤 Usuário já existe, pulando criação...');
    }

    // 3. Verificar se configuração Shopify já existe
    const { data: existingConfig } = await supabase
      .from('gateway_configs')
      .select('*')
      .eq('user_id', TEST_CLIENT.id)
      .eq('gateway_type', 'shopify')
      .maybeSingle();

    if (!existingConfig) {
      // 4. Criar configuração Shopify
      console.log('⚙️ Criando configuração Shopify...');
      const { data: config, error: configError } = await supabase
        .from('gateway_configs')
        .insert({
          user_id: SHOPIFY_CONFIG.user_id,
          gateway_type: SHOPIFY_CONFIG.gateway_type,
          config: SHOPIFY_CONFIG.config,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (configError) {
        throw new Error(`Erro ao criar configuração: ${configError.message}`);
      }
      console.log('✅ Configuração Shopify criada com sucesso!');
    } else {
      console.log('⚙️ Configuração Shopify já existe, atualizando...');
      const { error: updateError } = await supabase
        .from('gateway_configs')
        .update({
          config: SHOPIFY_CONFIG.config,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', TEST_CLIENT.id)
        .eq('gateway_type', 'shopify');

      if (updateError) {
        throw new Error(`Erro ao atualizar configuração: ${updateError.message}`);
      }
      console.log('✅ Configuração Shopify atualizada!');
    }

    // 5. Resumo
    console.log('\n🎉 Setup concluído com sucesso!\n');
    console.log('📋 Dados configurados:');
    console.log(`   🆔 Client ID: ${TEST_CLIENT.id}`);
    console.log(`   👤 Nome: ${TEST_CLIENT.name}`);
    console.log(`   📧 Email: ${TEST_CLIENT.email}`);
    console.log(`   🔑 Webhook Secret: ${SHOPIFY_CONFIG.config.webhookSecret}`);
    console.log(`   🏪 Shopify Domain: ${SHOPIFY_CONFIG.config.shopDomain}`);
    console.log('\n🚀 Agora você pode testar o webhook com:');
    console.log(`   URL: https://fastlogexpress.ngrok.app/webhook/shopify?client_id=${TEST_CLIENT.id}`);
    console.log('\n🔗 Ou use o Postman com o guia: TESTE_SHOPIFY_POSTMAN.md');

  } catch (error) {
    console.error('\n❌ Erro no setup:', error.message);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  setupShopifyTest();
}

module.exports = { setupShopifyTest, TEST_CLIENT, SHOPIFY_CONFIG };