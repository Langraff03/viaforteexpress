// scripts/debug-domain-system.js
// Script para diagnosticar se sistema multi-domínio está funcionando

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

async function debugSystem() {
  console.log('🔍 DIAGNÓSTICO DO SISTEMA MULTI-DOMÍNIO\n');

  // 1. Verificar se tabela existe
  console.log('1️⃣ Verificando tabela email_domains...');
  try {
    const { data: domains, error } = await supabaseAdmin
      .from('email_domains')
      .select('*');

    if (error && error.code === '42P01') {
      console.log('❌ PROBLEMA: Tabela email_domains NÃO EXISTE');
      console.log('💡 SOLUÇÃO: Execute scripts/create-email-domains-table.sql');
      return;
    }

    if (error) {
      console.log('❌ ERRO ao acessar tabela:', error.message);
      return;
    }

    console.log(`✅ Tabela existe com ${domains.length} domínios:`);
    domains.forEach(domain => {
      console.log(`   - ${domain.domain_name} | ${domain.from_name} | ${domain.is_active ? 'ATIVO' : 'INATIVO'} | ${domain.is_default ? 'PADRÃO' : 'PERSONALIZADO'}`);
    });

  } catch (err) {
    console.log('❌ EXCEÇÃO ao verificar tabela:', err.message);
    return;
  }

  // 2. Buscar domínio "rastreamento sedex"
  console.log('\n2️⃣ Procurando domínio "rastreamento sedex"...');
  try {
    const { data: sedexDomain, error } = await supabaseAdmin
      .from('email_domains')
      .select('*')
      .ilike('from_name', '%sedex%')
      .or('from_name.ilike.%rastreamento%');

    if (error) {
      console.log('❌ ERRO ao buscar domínio sedex:', error.message);
      return;
    }

    if (sedexDomain && sedexDomain.length > 0) {
      console.log(`✅ Domínio encontrado: ${sedexDomain[0].from_name}`);
      console.log(`   - ID: ${sedexDomain[0].id}`);
      console.log(`   - Email: ${sedexDomain[0].from_email}`);
      console.log(`   - Ativo: ${sedexDomain[0].is_active}`);
    } else {
      console.log('❌ PROBLEMA: Domínio "rastreamento sedex" NÃO ENCONTRADO');
      console.log('💡 SOLUÇÃO: Criar domínio via /admin/email-domains');
    }

  } catch (err) {
    console.log('❌ EXCEÇÃO ao buscar sedex:', err.message);
  }

  // 3. Verificar configuração padrão
  console.log('\n3️⃣ Verificando configuração padrão...');
  try {
    const { data: defaultDomain, error } = await supabaseAdmin
      .from('email_domains')
      .select('*')
      .eq('is_default', true)
      .single();

    if (error) {
      console.log('❌ ERRO: Nenhum domínio padrão encontrado');
      return;
    }

    console.log(`✅ Domínio padrão: ${defaultDomain.from_name} <${defaultDomain.from_email}>`);

  } catch (err) {
    console.log('❌ EXCEÇÃO ao verificar padrão:', err.message);
  }

  console.log('\n📋 PRÓXIMOS PASSOS:');
  console.log('1. Se tabela não existe → Execute migration SQL');
  console.log('2. Se domínio não existe → Crie via interface');
  console.log('3. Se tudo existe → Problema é no código (leadCampaignRoutes.ts)');
}

debugSystem().catch(console.error);