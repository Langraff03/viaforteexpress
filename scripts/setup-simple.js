const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Erro: VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY devem estar definidos no arquivo .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function setupSimple() {
  console.log('🚀 CONFIGURAÇÃO SIMPLIFICADA DO SISTEMA');
  console.log('=' .repeat(50));
  console.log('');

  try {
    // 1. Criar dados básicos usando métodos do Supabase
    console.log('📊 ETAPA 1: Criando estrutura básica...');
    await createBasicStructure();
    
    // 2. Configurar autenticação
    console.log('\n🔐 ETAPA 2: Configurando autenticação...');
    await setupAuthentication();
    
    // 3. Verificação final
    console.log('\n🔍 ETAPA 3: Verificação final...');
    await finalVerification();
    
    // 4. Mostrar resumo
    console.log('\n🎉 CONFIGURAÇÃO CONCLUÍDA COM SUCESSO!');
    showFinalSummary();
    
  } catch (error) {
    console.error('💥 Erro durante a configuração:', error.message);
    console.log('\n📋 INSTRUÇÕES MANUAIS:');
    console.log('1. Acesse o Supabase SQL Editor');
    console.log('2. Execute o arquivo: scripts/setup-complete-system.sql');
    console.log('3. Execute novamente este script para criar usuários');
    process.exit(1);
  }
}

async function createBasicStructure() {
  try {
    // Verificar se as tabelas já existem
    const { data: tables, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');

    if (tableError) {
      throw new Error('Não foi possível verificar tabelas. Execute o SQL manualmente.');
    }

    const tableNames = tables.map(t => t.table_name);
    
    if (!tableNames.includes('clients')) {
      console.log('   ❌ Tabelas não encontradas. Execute primeiro:');
      console.log('   📄 scripts/setup-complete-system.sql no Supabase SQL Editor');
      throw new Error('Estrutura do banco não encontrada');
    }

    console.log('   ✅ Estrutura do banco encontrada');

    // Inserir cliente padrão
    const { error: clientError } = await supabase
      .from('clients')
      .upsert({
        id: '0ec3137d-ee68-4aba-82de-143b3c61516a',
        name: 'Rapid Transporte',
        settings: {
          webhook_enabled: true,
          email_notifications: true,
          company_name: 'Rapid Transporte',
          support_email: 'suporte@rapidtransporte.com'
        }
      });

    if (clientError && !clientError.message.includes('duplicate')) {
      console.log(`   ⚠️  Erro ao inserir cliente: ${clientError.message}`);
    } else {
      console.log('   ✅ Cliente padrão configurado');
    }

    // Inserir gateway padrão
    const { error: gatewayError } = await supabase
      .from('gateways')
      .upsert({
        id: '7e7e93d9-fc1a-4ae0-b7ab-775494d57cad',
        client_id: '0ec3137d-ee68-4aba-82de-143b3c61516a',
        type: 'asset',
        name: 'Gateway Asset Principal',
        config: {
          api_key: process.env.ASSET_API_KEY,
          api_url: 'https://api.asaas.com/v3',
          webhook_secret: process.env.ASSET_WEBHOOK_SECRET,
          webhook_url: 'https://rastreio.logfastexpress.com/webhook/asset',
          environment: 'production'
        },
        is_active: true
      });

    if (gatewayError && !gatewayError.message.includes('duplicate')) {
      console.log(`   ⚠️  Erro ao inserir gateway: ${gatewayError.message}`);
    } else {
      console.log('   ✅ Gateway Asset configurado');
    }

    // Inserir oferta padrão
    const { error: offerError } = await supabase
      .from('offers')
      .upsert({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        client_id: '0ec3137d-ee68-4aba-82de-143b3c61516a',
        name: 'Oferta Especial Melatonina',
        description: 'Melatonina premium para melhor qualidade do sono',
        discount: '30% OFF',
        link: 'https://rapidtransporte.com/melatonina-oferta',
        is_active: true
      });

    if (offerError && !offerError.message.includes('duplicate')) {
      console.log(`   ⚠️  Erro ao inserir oferta: ${offerError.message}`);
    } else {
      console.log('   ✅ Oferta padrão configurada');
    }

  } catch (error) {
    throw new Error(`Falha na estrutura básica: ${error.message}`);
  }
}

async function setupAuthentication() {
  try {
    // Credenciais padrão
    const ADMIN_EMAIL = 'admin@rapidtransporte.com';
    const ADMIN_PASSWORD = 'admin123456';
    const GATEWAY_EMAIL = 'gateway@rapidtransporte.com';
    const GATEWAY_PASSWORD = 'gateway123456';
    
    const CLIENT_ID = '0ec3137d-ee68-4aba-82de-143b3c61516a';
    const GATEWAY_ID = '7e7e93d9-fc1a-4ae0-b7ab-775494d57cad';

    // Criar usuário administrador
    console.log('   👑 Configurando administrador...');
    await createUser(ADMIN_EMAIL, ADMIN_PASSWORD, 'admin', 'Administrador do Sistema', CLIENT_ID, null);
    
    // Criar usuário de gateway
    console.log('   🔧 Configurando usuário gateway...');
    await createUser(GATEWAY_EMAIL, GATEWAY_PASSWORD, 'gateway_user', 'Usuário Gateway Asset', CLIENT_ID, GATEWAY_ID);
    
  } catch (error) {
    throw new Error(`Falha na configuração de autenticação: ${error.message}`);
  }
}

async function createUser(email, password, role, fullName, clientId, gatewayId) {
  try {
    let userId;
    let userExists = false;

    // Verificar se usuário já existe
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) {
      throw new Error(`Erro ao listar usuários: ${listError.message}`);
    }

    const existingUser = users.find(u => u.email === email);

    if (existingUser) {
      console.log(`      ⚠️  ${email} já existe`);
      userId = existingUser.id;
      userExists = true;
    } else {
      // Criar usuário
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

      if (authError) {
        throw new Error(`Erro ao criar ${email}: ${authError.message}`);
      }
      
      userId = authData.user.id;
      console.log(`      ✅ ${email} criado`);
    }

    // Criar/atualizar perfil
    const profileData = {
      id: userId,
      role,
      client_id: clientId,
      full_name: fullName,
      updated_at: new Date().toISOString()
    };

    if (gatewayId) {
      profileData.gateway_id = gatewayId;
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .upsert(profileData);

    if (profileError) {
      throw new Error(`Erro ao criar perfil para ${email}: ${profileError.message}`);
    }

    console.log(`      ✅ Perfil ${role} configurado`);

  } catch (error) {
    throw new Error(`Falha ao criar usuário ${email}: ${error.message}`);
  }
}

async function finalVerification() {
  try {
    // Verificar cliente
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, name')
      .eq('id', '0ec3137d-ee68-4aba-82de-143b3c61516a')
      .single();

    if (!clientError && client) {
      console.log(`   ✅ Cliente: ${client.name}`);
    }

    // Verificar gateway
    const { data: gateway, error: gatewayError } = await supabase
      .from('gateways')
      .select('id, name, type')
      .eq('id', '7e7e93d9-fc1a-4ae0-b7ab-775494d57cad')
      .single();

    if (!gatewayError && gateway) {
      console.log(`   ✅ Gateway: ${gateway.name} (${gateway.type})`);
    }

    // Verificar usuários
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('role, full_name')
      .in('role', ['admin', 'gateway_user']);

    if (!profilesError && profiles) {
      console.log(`   ✅ ${profiles.length} usuários configurados`);
    }

  } catch (error) {
    console.log(`   ⚠️  Erro na verificação: ${error.message}`);
  }
}

function showFinalSummary() {
  console.log('\n' + '=' .repeat(50));
  console.log('📋 CREDENCIAIS DE ACESSO');
  console.log('=' .repeat(50));
  console.log('');
  console.log('👑 ADMINISTRADOR:');
  console.log('   📧 Email: admin@rapidtransporte.com');
  console.log('   🔑 Senha: admin123456');
  console.log('   🔗 Acesso: /admin');
  console.log('');
  console.log('🔧 USUÁRIO GATEWAY:');
  console.log('   📧 Email: gateway@rapidtransporte.com');
  console.log('   🔑 Senha: gateway123456');
  console.log('   🔗 Acesso: /gateway/dashboard');
  console.log('');
  console.log('📦 PRÓXIMOS PASSOS:');
  console.log('   1. Execute: npm run devall');
  console.log('   2. Acesse: http://localhost:5173/login');
  console.log('   3. Teste o webhook: http://localhost:3001/webhook/asset');
  console.log('');
  console.log('=' .repeat(50));
  console.log('✨ SISTEMA PRONTO PARA USO!');
  console.log('=' .repeat(50));
}

// Executar se chamado diretamente
if (require.main === module) {
  setupSimple().catch(error => {
    console.error('💥 Falha na configuração:', error);
    process.exit(1);
  });
}

module.exports = { setupSimple };