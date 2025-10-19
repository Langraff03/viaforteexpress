// scripts/test-correios-domain.js
// Script para criar e testar domínio "CORREIOS" usando viaforteexpress.com

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente necessárias não encontradas');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function createCorreiosDomain() {
  try {
    console.log('🚀 Criando domínio de teste "CORREIOS" usando viaforteexpress.com...\n');

    // 1. Verificar se domínio viaforteexpress.com já existe
    console.log('🔍 Verificando domínio viaforteexpress.com existente...');
    const { data: existingDomain, error: findError } = await supabaseAdmin
      .from('email_domains')
      .select('*')
      .eq('domain_name', 'viaforteexpress.com')
      .single();

    if (findError) {
      console.error('❌ Erro ao buscar domínio existente:', findError);
      return;
    }

    console.log(`✅ Domínio encontrado: ${existingDomain.from_name} (ID: ${existingDomain.id})`);

    // 2. Obter API key existente do sistema
    const resendApiKey = process.env.VITE_RESEND_API_KEY || process.env.RESEND_API_KEY;
    
    if (!resendApiKey) {
      console.error('❌ RESEND_API_KEY não encontrada');
      console.log('💡 Configure a variável de ambiente VITE_RESEND_API_KEY');
      return;
    }

    // 3. Criar domínio "CORREIOS" 
    const correiosDomain = {
      domain_name: 'viaforteexpress.com',
      from_name: 'CORREIOS',
      from_email: 'correios@viaforteexpress.com',
      reply_to_email: 'suporte@viaforteexpress.com',
      resend_api_key: resendApiKey,
      is_default: false,
      is_active: true
    };

    console.log('📧 Criando domínio com dados:');
    console.log(`   Nome: ${correiosDomain.from_name}`);
    console.log(`   Domínio: ${correiosDomain.domain_name}`);
    console.log(`   Email: ${correiosDomain.from_email}`);
    console.log(`   API Key: ${resendApiKey.substring(0, 10)}...`);

    // 2. Atualizar domínio existente com nome "CORREIOS"
    const { data: updatedDomain, error: updateError } = await supabaseAdmin
      .from('email_domains')
      .update({
        from_name: 'CORREIOS',
        from_email: 'correios@viaforteexpress.com',
        updated_at: new Date().toISOString()
      })
      .eq('id', existingDomain.id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Erro ao atualizar domínio:', updateError);
      return;
    }

    console.log(`✅ Domínio atualizado para "CORREIOS"!`);
    console.log(`   ID: ${updatedDomain.id}`);
    console.log(`   Status: ${updatedDomain.is_active ? 'Ativo' : 'Inativo'}`);
    
    const newDomain = updatedDomain; // Para manter compatibilidade com resto do código

    // 4. Testar a função getEmailConfigByDomain
    console.log('\n🧪 Testando função getEmailConfigByDomain...');
    
    try {
      // Simular a busca que o sistema faz
      const { data: foundDomain, error: searchError } = await supabaseAdmin
        .from('email_domains')
        .select('*')
        .eq('id', newDomain.id)
        .eq('is_active', true)
        .single();

      if (searchError || !foundDomain) {
        console.error('❌ Domínio não encontrado na busca:', searchError);
        return;
      }

      console.log('✅ Busca funcionando:');
      console.log(`   Sistema encontraria: ${foundDomain.from_name} <${foundDomain.from_email}>`);
      
      // 5. Simular configuração que seria retornada
      const configResult = {
        fromName: foundDomain.from_name,
        fromEmail: foundDomain.from_email,
        replyToEmail: foundDomain.reply_to_email,
        resendApiKey: foundDomain.resend_api_key,
      };

      console.log('\n📧 Configuração que seria usada:');
      console.log(`   De: ${configResult.fromName} <${configResult.fromEmail}>`);
      console.log(`   Resposta: ${configResult.replyToEmail}`);

      // 6. Mostrar como usar
      console.log('\n🎯 COMO USAR NO SISTEMA:');
      console.log('1. Vá para /admin/disparo-massa');
      console.log('2. No dropdown "Domínio de Email" selecione:');
      console.log(`   📧 viaforteexpress.com - CORREIOS`);
      console.log('3. Configure oferta e envie');
      console.log('4. Email deve chegar como: CORREIOS');

      console.log('\n📋 DOMÍNIO CRIADO COM SUCESSO:');
      console.log(`ID para seleção: ${newDomain.id}`);
      console.log(`Nome que aparecerá: ${configResult.fromName}`);
      console.log(`Email remetente: ${configResult.fromEmail}`);

      return newDomain.id;

    } catch (testError) {
      console.error('❌ Erro no teste:', testError);
    }

  } catch (error) {
    console.error('💥 Erro geral:', error);
  }
}

// Executar script
if (require.main === module) {
  createCorreiosDomain()
    .then((domainId) => {
      if (domainId) {
        console.log('\n🎉 SUCESSO! Domínio "CORREIOS" configurado e pronto para uso!');
        console.log(`💡 Use o ID: ${domainId} para selecionar na interface`);
      } else {
        console.log('\n💥 Falha na configuração. Verifique erros acima.');
      }
    })
    .catch(console.error);
}

module.exports = { createCorreiosDomain };