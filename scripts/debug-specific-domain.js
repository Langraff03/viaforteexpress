// scripts/debug-specific-domain.js
// Debug específico para descobrir por que domínio não está mudando

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function debugSpecificDomain() {
  console.log('🔍 DEBUG ESPECÍFICO - Por que nome não muda?\n');

  // 1. Verificar TODOS os domínios
  console.log('1️⃣ TODOS OS DOMÍNIOS CADASTRADOS:');
  const { data: allDomains, error } = await supabaseAdmin
    .from('email_domains')
    .select('*')
    .order('created_at');

  if (error) {
    console.log('❌ Erro ao buscar domínios:', error);
    return;
  }

  allDomains.forEach((domain, index) => {
    console.log(`   ${index + 1}. ID: ${domain.id}`);
    console.log(`      Nome: ${domain.from_name}`);
    console.log(`      Domínio: ${domain.domain_name}`);
    console.log(`      Email: ${domain.from_email}`);
    console.log(`      Padrão: ${domain.is_default ? 'SIM' : 'NÃO'}`);
    console.log(`      Ativo: ${domain.is_active ? 'SIM' : 'NÃO'}`);
    console.log('');
  });

  // 2. Verificar domínio específico usado no teste (do log anterior)
  const testDomainId = 'd2c0a55b-a0c2-49c3-9694-e37d778f9fcc';
  console.log(`2️⃣ VERIFICANDO DOMÍNIO USADO NO TESTE: ${testDomainId}`);
  
  const { data: testDomain, error: testError } = await supabaseAdmin
    .from('email_domains')
    .select('*')
    .eq('id', testDomainId)
    .single();

  if (testError || !testDomain) {
    console.log('❌ PROBLEMA: Domínio do teste não encontrado!');
    console.log('💡 Isso explica por que está usando fallback (VIA FORTE EXPRESS)');
    return;
  }

  console.log('✅ Domínio do teste encontrado:');
  console.log(`   Nome atual: ${testDomain.from_name}`);
  console.log(`   Email atual: ${testDomain.from_email}`);
  console.log(`   Ativo: ${testDomain.is_active}`);
  console.log(`   Última atualização: ${testDomain.updated_at}`);

  // 3. Verificar domínio padrão
  console.log('\n3️⃣ VERIFICANDO DOMÍNIO PADRÃO:');
  const { data: defaultDomain } = await supabaseAdmin
    .from('email_domains')
    .select('*')
    .eq('is_default', true)
    .single();

  if (defaultDomain) {
    console.log(`   Nome padrão: ${defaultDomain.from_name}`);
    console.log(`   Email padrão: ${defaultDomain.from_email}`);
  }

  // 4. Simular busca como o sistema faz
  console.log('\n4️⃣ SIMULANDO BUSCA DO SISTEMA:');
  try {
    const { data: simulatedSearch, error: simError } = await supabaseAdmin
      .from('email_domains')
      .select('*')
      .eq('id', testDomainId)
      .eq('is_active', true)
      .single();

    if (simError || !simulatedSearch) {
      console.log('❌ PROBLEMA: Sistema não consegue encontrar o domínio!');
      console.log('   Motivos possíveis:');
      console.log('   - Domínio foi desativado');
      console.log('   - ID não confere');
      console.log('   - Erro na query');
    } else {
      console.log('✅ Sistema encontraria:');
      console.log(`   Nome: ${simulatedSearch.from_name}`);
      console.log(`   Email: ${simulatedSearch.from_email}`);
    }
  } catch (err) {
    console.log('❌ Exceção na simulação:', err.message);
  }

  console.log('\n📋 RESUMO:');
  console.log(`Total de domínios: ${allDomains.length}`);
  console.log(`Domínio do teste existe: ${testDomain ? 'SIM' : 'NÃO'}`);
  console.log(`Nome atual no banco: ${testDomain?.from_name || 'N/A'}`);
}

debugSpecificDomain().catch(console.error);