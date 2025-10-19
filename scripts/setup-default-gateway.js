const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function setupDefaultGateway() {
  console.log('🚀 Configurando gateway padrão...');
  
  // ID do cliente padrão que será usado para fallback
  const defaultClientId = '0ec3137d-ee68-4aba-82de-143b3c61516a';
  
  try {
    // Primeiro, verificar se o cliente existe
    const { data: existingClient, error: clientCheckError } = await supabase
      .from('clients')
      .select('id')
      .eq('id', defaultClientId)
      .single();
    
    if (!existingClient) {
      console.log('📝 Criando cliente padrão...');
      // Criar cliente padrão
      const { data: newClient, error: clientError } = await supabase
        .from('clients')
        .insert({
          id: defaultClientId,
          name: 'Cliente Padrão'
        })
        .select()
        .single();
      
      if (clientError) {
        console.error('❌ Erro ao criar cliente:', clientError);
        return;
      }
      console.log('✅ Cliente padrão criado:', newClient.id);
    } else {
      console.log('✅ Cliente padrão já existe:', existingClient.id);
    }
    
    // Verificar se já existe um gateway para este cliente
    const { data: existingGateway, error: checkError } = await supabase
      .from('gateways')
      .select('id')
      .eq('client_id', defaultClientId)
      .eq('type', 'asset')
      .single();
    
    if (existingGateway) {
      console.log('✅ Gateway padrão já existe:', existingGateway.id);
      return;
    }
    
    // Criar configuração do gateway
    const gatewayConfig = {
      client_id: defaultClientId,
      type: 'asset',
      name: 'Gateway Asset Padrão',
      config: {
        api_key: process.env.ASSET_API_KEY,
        api_url: 'https://api.asaas.com/v3',
        webhook_secret: process.env.ASSET_WEBHOOK_SECRET
      }
    };
    
    // Inserir gateway no banco
    const { data: newGateway, error: insertError } = await supabase
      .from('gateways')
      .insert(gatewayConfig)
      .select()
      .single();
    
    if (insertError) {
      console.error('❌ Erro ao criar gateway:', insertError);
      return;
    }
    
    console.log('✅ Gateway padrão criado com sucesso:', newGateway.id);
    console.log('📋 Configuração:');
    console.log('   - Client ID:', defaultClientId);
    console.log('   - Gateway ID:', newGateway.id);
    console.log('   - Tipo: asset');
    console.log('   - API Key:', process.env.ASSET_API_KEY?.substring(0, 10) + '...');
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  setupDefaultGateway().then(() => {
    console.log('🎉 Configuração concluída!');
    process.exit(0);
  }).catch(error => {
    console.error('💥 Falha na configuração:', error);
    process.exit(1);
  });
}

module.exports = { setupDefaultGateway };