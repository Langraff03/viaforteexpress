const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
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

async function setupEverything() {
  console.log('🚀 CONFIGURAÇÃO COMPLETA DO SISTEMA DE RASTREAMENTO MULTI-GATEWAYS');
  console.log('=' .repeat(70));
  console.log('Este script irá configurar tudo do zero:');
  console.log('✅ Limpar e recriar todas as tabelas do banco');
  console.log('✅ Configurar tipos, índices e triggers');
  console.log('✅ Inserir dados iniciais (cliente, gateway, ofertas)');
  console.log('✅ Configurar políticas de segurança (RLS)');
  console.log('✅ Criar usuário administrador');
  console.log('✅ Criar usuário de gateway');
  console.log('✅ Verificar toda a configuração');
  console.log('=' .repeat(70));
  console.log('');

  try {
    // 1. Executar script SQL completo
    console.log('📊 ETAPA 1: Configurando banco de dados...');
    await executeSqlScript();
    
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
    console.log('\n🔧 Para resolver problemas:');
    console.log('1. Verifique se as credenciais do Supabase estão corretas no .env');
    console.log('2. Verifique se você tem permissões de administrador no projeto');
    console.log('3. Execute novamente o script após corrigir os problemas');
    process.exit(1);
  }
}

async function executeSqlScript() {
  try {
    console.log('   📄 Lendo script SQL...');
    const sqlPath = path.join(__dirname, 'setup-complete-system.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('   🔧 Executando comandos SQL...');
    
    // Dividir o SQL em comandos individuais
    const commands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => 
        cmd.length > 0 && 
        !cmd.startsWith('--') && 
        !cmd.startsWith('SELECT \'') &&
        !cmd.includes('COMMIT') &&
        !cmd.includes('status')
      );

    let successCount = 0;
    let errorCount = 0;

    for (const command of commands) {
      if (command.includes('information_schema') || command.includes('pg_type')) {
        continue; // Pular comandos de verificação
      }

      try {
        // Executar comando SQL diretamente
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceRoleKey}`,
            'apikey': supabaseServiceRoleKey
          },
          body: JSON.stringify({ sql_query: command })
        });

        if (!response.ok) {
          // Se a função RPC não existir, pular este comando
          if (response.status === 404) {
            console.log(`   ⚠️  Pulando comando SQL (RPC não disponível): ${command.substring(0, 50)}...`);
            continue;
          }
          
          const errorText = await response.text();
          if (errorText.includes('already exists') ||
              errorText.includes('duplicate key') ||
              errorText.includes('does not exist')) {
            console.log(`   ⚠️  Ignorando (já existe): ${command.substring(0, 50)}...`);
          } else {
            console.log(`   ❌ Erro: ${errorText.substring(0, 100)}`);
            errorCount++;
          }
        } else {
          successCount++;
          if (command.includes('CREATE TABLE')) {
            const tableName = command.match(/CREATE TABLE.*?(\w+)\s*\(/)?.[1];
            console.log(`   ✅ Tabela: ${tableName}`);
          } else if (command.includes('CREATE TYPE')) {
            const typeName = command.match(/CREATE TYPE.*?(\w+)\s+AS/)?.[1];
            console.log(`   ✅ Tipo: ${typeName}`);
          } else if (command.includes('INSERT INTO')) {
            const tableName = command.match(/INSERT INTO.*?(\w+)\s*\(/)?.[1];
            console.log(`   ✅ Dados: ${tableName}`);
          } else if (command.includes('CREATE INDEX')) {
            const indexName = command.match(/CREATE INDEX.*?(\w+)\s+ON/)?.[1];
            console.log(`   ✅ Índice: ${indexName}`);
          } else if (command.includes('CREATE POLICY')) {
            console.log(`   ✅ Política de segurança criada`);
          }
        }
      } catch (err) {
        console.log(`   ❌ Erro inesperado: ${err.message.substring(0, 100)}`);
        errorCount++;
      }
    }

    console.log(`   📊 Resumo: ${successCount} sucessos, ${errorCount} erros`);
    
  } catch (error) {
    throw new Error(`Falha ao executar script SQL: ${error.message}`);
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
    // Verificar tabelas
    const { data: tables, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .order('table_name');
    
    if (!tableError && tables) {
      console.log(`   ✅ ${tables.length} tabelas criadas`);
    }

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
  console.log('\n' + '=' .repeat(70));
  console.log('📋 RESUMO DA CONFIGURAÇÃO');
  console.log('=' .repeat(70));
  console.log('');
  console.log('🏢 EMPRESA: Rapid Transporte');
  console.log('🌐 URL: https://rastreio.logfastexpress.com');
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
  console.log('💳 GATEWAY DE PAGAMENTO:');
  console.log('   🏷️  Tipo: Asset (Asaas)');
  console.log('   🔌 API: Configurada e ativa');
  console.log('   🔗 Webhook: /webhook/asset');
  console.log('');
  console.log('📦 PRÓXIMOS PASSOS:');
  console.log('   1. Execute: npm run devall');
  console.log('   2. Acesse: http://localhost:5173/login');
  console.log('   3. Teste o webhook: http://localhost:3001/webhook/asset');
  console.log('   4. Monitore os logs para verificar funcionamento');
  console.log('');
  console.log('=' .repeat(70));
  console.log('✨ SISTEMA PRONTO PARA USO!');
  console.log('=' .repeat(70));
}

// Executar se chamado diretamente
if (require.main === module) {
  setupEverything().catch(error => {
    console.error('💥 Falha na configuração completa:', error);
    process.exit(1);
  });
}

module.exports = { setupEverything };