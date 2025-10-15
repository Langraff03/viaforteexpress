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

// Credenciais padrão
const ADMIN_EMAIL = 'admin@rapidtransporte.com';
const ADMIN_PASSWORD = 'admin123456';
const ADMIN_NAME = 'Administrador do Sistema';

const GATEWAY_USER_EMAIL = 'gateway@rapidtransporte.com';
const GATEWAY_USER_PASSWORD = 'gateway123456';
const GATEWAY_USER_NAME = 'Usuário Gateway Asset';

// IDs fixos para consistência
const CLIENT_ID = '0ec3137d-ee68-4aba-82de-143b3c61516a';
const GATEWAY_ID = '7e7e93d9-fc1a-4ae0-b7ab-775494d57cad';

async function setupCompleteAuth() {
  console.log('🚀 Iniciando configuração completa de autenticação...\n');
  
  try {
    // 1. Criar usuário administrador
    console.log('👑 Configurando usuário administrador...');
    await createAdminUser();
    
    // 2. Criar usuário de gateway
    console.log('\n🔧 Configurando usuário de gateway...');
    await createGatewayUser();
    
    // 3. Verificar configurações
    console.log('\n🔍 Verificando configurações...');
    await verifySetup();
    
    console.log('\n🎉 Configuração de autenticação concluída com sucesso!');
    console.log('\n📋 CREDENCIAIS DE ACESSO:');
    console.log('=' .repeat(50));
    console.log('👑 ADMINISTRADOR:');
    console.log(`   Email: ${ADMIN_EMAIL}`);
    console.log(`   Senha: ${ADMIN_PASSWORD}`);
    console.log(`   Acesso: /admin`);
    console.log('');
    console.log('🔧 USUÁRIO GATEWAY:');
    console.log(`   Email: ${GATEWAY_USER_EMAIL}`);
    console.log(`   Senha: ${GATEWAY_USER_PASSWORD}`);
    console.log(`   Acesso: /gateway/dashboard`);
    console.log('=' .repeat(50));
    
  } catch (error) {
    console.error('💥 Erro durante a configuração:', error.message);
    process.exit(1);
  }
}

async function createAdminUser() {
  try {
    let userId;
    let userExists = false;

    // Verificar se o usuário já existe
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) {
      throw new Error(`Erro ao listar usuários: ${listError.message}`);
    }

    const existingUser = users.find(u => u.email === ADMIN_EMAIL);

    if (existingUser) {
      console.log(`   ⚠️  Usuário ${ADMIN_EMAIL} já existe na autenticação`);
      userId = existingUser.id;
      userExists = true;
    } else {
      // Criar usuário na autenticação
      console.log('   📝 Criando usuário na autenticação...');
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        email_confirm: true,
      });

      if (authError) {
        throw new Error(`Erro ao criar usuário na autenticação: ${authError.message}`);
      }
      
      userId = authData.user.id;
      console.log(`   ✅ Usuário criado na autenticação com ID: ${userId}`);
    }

    // Criar/atualizar perfil
    console.log('   📝 Configurando perfil de administrador...');
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        role: 'admin',
        client_id: CLIENT_ID,
        full_name: ADMIN_NAME,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (profileError) {
      throw new Error(`Erro ao criar/atualizar perfil: ${profileError.message}`);
    }

    console.log(`   ✅ Perfil de administrador configurado`);
    console.log(`   📧 Email: ${ADMIN_EMAIL}`);
    if (!userExists) {
      console.log(`   🔑 Senha: ${ADMIN_PASSWORD}`);
    } else {
      console.log(`   🔑 Senha: (usuário existente, senha não alterada)`);
    }
    console.log(`   👤 Nome: ${ADMIN_NAME}`);
    console.log(`   🎭 Role: ${profileData.role}`);

  } catch (error) {
    throw new Error(`Falha ao configurar administrador: ${error.message}`);
  }
}

async function createGatewayUser() {
  try {
    let userId;
    let userExists = false;

    // Verificar se o usuário já existe
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) {
      throw new Error(`Erro ao listar usuários: ${listError.message}`);
    }

    const existingUser = users.find(u => u.email === GATEWAY_USER_EMAIL);

    if (existingUser) {
      console.log(`   ⚠️  Usuário ${GATEWAY_USER_EMAIL} já existe na autenticação`);
      userId = existingUser.id;
      userExists = true;
    } else {
      // Criar usuário na autenticação
      console.log('   📝 Criando usuário na autenticação...');
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: GATEWAY_USER_EMAIL,
        password: GATEWAY_USER_PASSWORD,
        email_confirm: true,
      });

      if (authError) {
        throw new Error(`Erro ao criar usuário na autenticação: ${authError.message}`);
      }
      
      userId = authData.user.id;
      console.log(`   ✅ Usuário criado na autenticação com ID: ${userId}`);
    }

    // Criar/atualizar perfil
    console.log('   📝 Configurando perfil de usuário gateway...');
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        role: 'gateway_user',
        client_id: CLIENT_ID,
        gateway_id: GATEWAY_ID,
        full_name: GATEWAY_USER_NAME,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (profileError) {
      throw new Error(`Erro ao criar/atualizar perfil: ${profileError.message}`);
    }

    console.log(`   ✅ Perfil de usuário gateway configurado`);
    console.log(`   📧 Email: ${GATEWAY_USER_EMAIL}`);
    if (!userExists) {
      console.log(`   🔑 Senha: ${GATEWAY_USER_PASSWORD}`);
    } else {
      console.log(`   🔑 Senha: (usuário existente, senha não alterada)`);
    }
    console.log(`   👤 Nome: ${GATEWAY_USER_NAME}`);
    console.log(`   🎭 Role: ${profileData.role}`);
    console.log(`   🏢 Cliente ID: ${profileData.client_id}`);
    console.log(`   🔌 Gateway ID: ${profileData.gateway_id}`);

  } catch (error) {
    throw new Error(`Falha ao configurar usuário gateway: ${error.message}`);
  }
}

async function verifySetup() {
  try {
    // Verificar cliente
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, name')
      .eq('id', CLIENT_ID)
      .single();

    if (clientError || !client) {
      console.log('   ❌ Cliente padrão não encontrado');
    } else {
      console.log(`   ✅ Cliente: ${client.name} (${client.id})`);
    }

    // Verificar gateway
    const { data: gateway, error: gatewayError } = await supabase
      .from('gateways')
      .select('id, name, type, is_active')
      .eq('id', GATEWAY_ID)
      .single();

    if (gatewayError || !gateway) {
      console.log('   ❌ Gateway padrão não encontrado');
    } else {
      console.log(`   ✅ Gateway: ${gateway.name} (${gateway.type}) - ${gateway.is_active ? 'Ativo' : 'Inativo'}`);
    }

    // Verificar perfis
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, role, full_name, client_id, gateway_id')
      .in('role', ['admin', 'gateway_user']);

    if (profilesError) {
      console.log('   ❌ Erro ao verificar perfis');
    } else {
      console.log(`   ✅ Perfis configurados: ${profiles.length}`);
      profiles.forEach(profile => {
        console.log(`      - ${profile.full_name} (${profile.role})`);
      });
    }

    // Verificar autenticação
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
    if (usersError) {
      console.log('   ❌ Erro ao verificar usuários de autenticação');
    } else {
      const authUsers = users.filter(u => 
        u.email === ADMIN_EMAIL || u.email === GATEWAY_USER_EMAIL
      );
      console.log(`   ✅ Usuários na autenticação: ${authUsers.length}`);
      authUsers.forEach(user => {
        console.log(`      - ${user.email} (${user.email_confirmed_at ? 'Confirmado' : 'Não confirmado'})`);
      });
    }

  } catch (error) {
    console.log(`   ❌ Erro durante verificação: ${error.message}`);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  setupCompleteAuth().catch(error => {
    console.error('💥 Falha na configuração:', error);
    process.exit(1);
  });
}

module.exports = { setupCompleteAuth };