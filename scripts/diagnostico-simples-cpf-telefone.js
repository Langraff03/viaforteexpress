// Diagnóstico simples para CPF e telefone
// Execute: node scripts/diagnostico-simples-cpf-telefone.js

console.log('🔍 DIAGNÓSTICO SIMPLES: CPF e Telefone\n');

// 1. Verificar se campos existem no banco
console.log('1️⃣ Verificando campos no banco...\n');

const { createClient } = require('@supabase/supabase-js');

// Configurar Supabase (ajuste se necessário)
const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key';

if (supabaseUrl.includes('your-project') || supabaseKey.includes('your-anon-key')) {
  console.log('⚠️ Configure SUPABASE_URL e SUPABASE_ANON_KEY no .env primeiro');
  console.log('Ou edite este script com suas credenciais.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnosticar() {
  try {
    // Verificar campos
    console.log('📋 Verificando estrutura da tabela orders...');
    const { data: columns, error: columnsError } = await supabase
      .rpc('sql', {
        query: `
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns
          WHERE table_name = 'orders'
            AND column_name IN ('customer_phone', 'customer_cpf')
          ORDER BY column_name;
        `
      });

    if (columnsError) {
      console.log('❌ Erro ao verificar campos:', columnsError.message);
      console.log('🔧 Execute no Supabase SQL Editor:');
      console.log('   ALTER TABLE public.orders ADD COLUMN customer_phone TEXT NULL;');
      console.log('   ALTER TABLE public.orders ADD COLUMN customer_cpf TEXT NULL;');
      return;
    }

    if (!columns || columns.length === 0) {
      console.log('❌ CAMPOS NÃO EXISTEM!');
      console.log('🔧 Execute o SQL para adicionar os campos.');
      return;
    }

    console.log('✅ Campos existem:');
    columns.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'})`);
    });

    // Verificar pedidos recentes
    console.log('\n📋 Verificando pedidos recentes...');
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id, customer_name, customer_email, customer_phone, customer_cpf, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    if (ordersError) {
      console.log('❌ Erro ao buscar pedidos:', ordersError.message);
      return;
    }

    if (!orders || orders.length === 0) {
      console.log('⚠️ Nenhum pedido encontrado');
      return;
    }

    console.log(`✅ Últimos ${orders.length} pedidos:`);

    let comCpf = 0;
    let comTelefone = 0;

    orders.forEach((order, index) => {
      const temCpf = order.customer_cpf ? '✅' : '❌';
      const temTelefone = order.customer_phone ? '✅' : '❌';

      if (order.customer_cpf) comCpf++;
      if (order.customer_phone) comTelefone++;

      console.log(`${index + 1}. ${order.customer_name}`);
      console.log(`   Email: ${order.customer_email}`);
      console.log(`   CPF: ${temCpf} ${order.customer_cpf || 'NULL'}`);
      console.log(`   Telefone: ${temTelefone} ${order.customer_phone || 'NULL'}`);
      console.log(`   Data: ${new Date(order.created_at).toLocaleString('pt-BR')}`);
      console.log('');
    });

    console.log('📊 Estatísticas:');
    console.log(`   - Pedidos com CPF: ${comCpf}/${orders.length}`);
    console.log(`   - Pedidos com Telefone: ${comTelefone}/${orders.length}`);

    if (comCpf === 0 && comTelefone === 0) {
      console.log('\n❌ PROBLEMA IDENTIFICADO:');
      console.log('   Nenhum pedido tem CPF ou telefone!');
      console.log('   Possíveis causas:');
      console.log('   1. Webhooks não estão enviando esses dados');
      console.log('   2. Sistema não foi reiniciado após mudanças');
      console.log('   3. Lógica de extração não está funcionando');
      console.log('   4. Erros nos logs do sistema');
    } else {
      console.log('\n✅ FUNCIONANDO: Alguns pedidos têm CPF/telefone!');
    }

  } catch (error) {
    console.log('❌ Erro geral:', error.message);
  }
}

diagnosticar();