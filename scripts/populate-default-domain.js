// scripts/populate-default-domain.js
// Script para popular tabela email_domains com domínio padrão viaforteexpress.com

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase Admin
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente necessárias:');
  console.error('- VITE_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function populateDefaultDomain() {
  try {
    console.log('🚀 Iniciando população do domínio padrão...');

    // Verificar se a tabela existe
    const { data: tableExists, error: tableError } = await supabaseAdmin
      .from('email_domains')
      .select('id')
      .limit(1);

    if (tableError && tableError.code === '42P01') {
      console.error('❌ Tabela email_domains não existe!');
      console.log('💡 Execute primeiro: scripts/create-email-domains-table.sql');
      process.exit(1);
    }

    // Verificar se já existe domínio padrão
    const { data: existingDefault, error: checkError } = await supabaseAdmin
      .from('email_domains')
      .select('*')
      .eq('is_default', true)
      .maybeSingle();

    if (checkError) {
      console.error('❌ Erro ao verificar domínio padrão existente:', checkError);
      process.exit(1);
    }

    if (existingDefault) {
      console.log('✅ Domínio padrão já existe:');
      console.log(`   - ID: ${existingDefault.id}`);
      console.log(`   - Domínio: ${existingDefault.domain_name}`);
      console.log(`   - Remetente: ${existingDefault.from_name} <${existingDefault.from_email}>`);
      console.log('🎯 Nenhuma ação necessária.');
      return;
    }

    // Obter API key do Resend das variáveis de ambiente
    const resendApiKey = process.env.VITE_RESEND_API_KEY || process.env.RESEND_API_KEY;
    
    if (!resendApiKey) {
      console.warn('⚠️ RESEND_API_KEY não encontrada nas variáveis de ambiente');
      console.log('💡 Será necessário atualizar a API key manualmente depois');
    }

    // Dados do domínio padrão
    const defaultDomainData = {
      domain_name: 'viaforteexpress.com',
      from_name: 'VIA FORTE EXPRESS',
      from_email: process.env.VITE_FROM_EMAIL || 'contato@viaforteexpress.com',
      reply_to_email: process.env.VITE_SUPPORT_EMAIL || 'suporte@viaforteexpress.com',
      resend_api_key: resendApiKey || 'YOUR_RESEND_API_KEY_HERE',
      is_default: true,
      is_active: true
    };

    console.log('📧 Inserindo domínio padrão com dados:');
    console.log(`   - Domínio: ${defaultDomainData.domain_name}`);
    console.log(`   - Remetente: ${defaultDomainData.from_name} <${defaultDomainData.from_email}>`);
    console.log(`   - Resposta: ${defaultDomainData.reply_to_email}`);
    console.log(`   - API Key: ${resendApiKey ? 'Configurada' : 'NECESSITA CONFIGURAÇÃO MANUAL'}`);

    // Inserir domínio padrão
    const { data: insertedDomain, error: insertError } = await supabaseAdmin
      .from('email_domains')
      .insert([defaultDomainData])
      .select()
      .single();

    if (insertError) {
      console.error('❌ Erro ao inserir domínio padrão:', insertError);
      process.exit(1);
    }

    console.log('✅ Domínio padrão criado com sucesso!');
    console.log(`   - ID: ${insertedDomain.id}`);
    console.log(`   - Status: ${insertedDomain.is_active ? 'Ativo' : 'Inativo'}`);

    // Verificar se precisa de configuração manual da API key
    if (!resendApiKey || resendApiKey === 'YOUR_RESEND_API_KEY_HERE') {
      console.log('\n🔧 AÇÃO NECESSÁRIA:');
      console.log('1. Acesse /admin/email-domains no painel');
      console.log('2. Edite o domínio viaforteexpress.com');
      console.log('3. Configure sua API key real do Resend');
      console.log('4. Teste a configuração');
    } else {
      console.log('\n🎉 Sistema pronto para uso!');
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
    process.exit(1);
  }
}

// Executar se foi chamado diretamente
if (require.main === module) {
  populateDefaultDomain()
    .then(() => {
      console.log('\n✨ Script executado com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Script falhou:', error);
      process.exit(1);
    });
}

module.exports = { populateDefaultDomain };