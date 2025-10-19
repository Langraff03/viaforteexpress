#!/usr/bin/env node
// Script rápido para verificar se a tabela campaign_progress existe

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis SUPABASE não configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTable() {
  try {
    console.log('🔍 Verificando tabela campaign_progress...');
    
    const { data, error } = await supabase
      .from('campaign_progress')
      .select('id')
      .limit(1);

    if (error) {
      console.log('❌ Tabela campaign_progress NÃO existe');
      console.log('🔧 Execute: node scripts/create-campaign-progress-table.sql no Supabase');
      console.log('   OU use o Supabase Dashboard > SQL Editor');
    } else {
      console.log('✅ Tabela campaign_progress existe e está acessível!');
    }
  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
  
  process.exit(0);
}

checkTable();