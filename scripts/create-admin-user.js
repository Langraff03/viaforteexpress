require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Configuração do cliente Supabase com a chave de serviço (service_role)
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Erro: VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY devem estar definidos no arquivo .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Dados do administrador a serem criados
const adminEmail = 'lucasadmin@gmail.com';
const adminPassword = 'admin123';

async function createAdminUser() {
  try {
    console.log(`Iniciando configuração do usuário admin: ${adminEmail}...`);

    let userId;
    let userExists = false;

    // 1. Tenta encontrar o usuário listando todos e filtrando.
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) {
        throw new Error(`Erro ao listar usuários: ${listError.message}`);
    }

    const existingUser = users.find(u => u.email === adminEmail);

    if (existingUser) {
        console.warn(`Usuário ${adminEmail} já existe na autenticação.`);
        userId = existingUser.id;
        userExists = true;
    } else {
        // 2. Se não existir, cria o usuário.
        console.log('Usuário não encontrado, criando um novo...');
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: adminEmail,
            password: adminPassword,
            email_confirm: true,
        });

        if (authError) {
            throw new Error(`Erro ao criar usuário na autenticação: ${authError.message}`);
        }
        userId = authData.user.id;
        console.log(`Usuário criado na autenticação com ID: ${userId}`);
    }

    // 3. Inserir ou atualizar o perfil na tabela `public.profiles` (Upsert)
    console.log(`Garantindo que o perfil para o usuário ${userId} esteja correto...`);
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        role: 'admin',
      })
      .select()
      .single();

    if (profileError) {
      throw new Error(`Erro ao criar/atualizar perfil do usuário: ${profileError.message}`);
    }

    console.log('---');
    console.log('✅ Usuário administrador configurado com sucesso!');
    console.log('Email:', adminEmail);
    if (!userExists) {
        console.log('Senha:', adminPassword);
    } else {
        console.log('Senha: (usuário já existente, senha não alterada)');
    }
    console.log('Role:', profileData.role);
    console.log('---');

  } catch (error) {
    console.error('❌ Erro durante a configuração do usuário administrador:', error.message);
    process.exit(1);
  }
}

createAdminUser();