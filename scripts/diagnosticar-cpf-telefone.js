// Script para diagnosticar por que CPF e telefone não estão sendo salvos
// Execute: node scripts/diagnosticar-cpf-telefone.js

const { GatewayUtils } = require('../src/lib/gateways/GatewayUtils');

console.log('🔍 DIAGNÓSTICO: CPF e Telefone não estão sendo salvos\n');

// 1. Testar extração de dados com payload de exemplo
console.log('1️⃣ Testando extração de dados com payload de exemplo...\n');

// Payload de exemplo que pode estar chegando
const exemploPayload = {
  customer: {
    name: 'João Silva',
    email: 'joao@teste.com',
    phone: '11999999999',
    cpf: '123.456.789-00'
  },
  shipping: {
    address: {
      street: 'Rua das Flores, 123'
    }
  }
};

console.log('📋 Payload de exemplo:');
console.log(JSON.stringify(exemploPayload, null, 2));
console.log('');

try {
  const dadosExtraidos = GatewayUtils.extractCustomerInfo(exemploPayload);
  console.log('✅ Dados extraídos:');
  console.log(JSON.stringify(dadosExtraidos, null, 2));
  console.log('');

  if (dadosExtraidos?.phone && dadosExtraidos?.document) {
    console.log('🎉 EXTRAÇÃO FUNCIONANDO! Dados foram extraídos corretamente.');
  } else {
    console.log('❌ EXTRAÇÃO FALHANDO! Dados não foram extraídos.');
  }
} catch (error) {
  console.log('❌ ERRO na extração:', error.message);
}

console.log('\n' + '='.repeat(50) + '\n');

// 2. Verificar se os campos existem no banco
console.log('2️⃣ Verificando campos no banco...\n');

const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.SUPABASE_URL || 'sua-url-supabase';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'sua-chave-supabase';

if (supabaseUrl === 'sua-url-supabase') {
  console.log('⚠️ Configure as variáveis SUPABASE_URL e SUPABASE_ANON_KEY no .env');
  console.log('Para testar a conexão com o banco.');
} else {
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Verificar campos
  (async () => {
    try {
      const { data: columns, error } = await supabase
        .rpc('sql', {
          query: `
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'orders'
              AND column_name IN ('customer_phone', 'customer_cpf')
            ORDER BY column_name;
          `
        });

      if (error) {
        console.log('❌ Erro ao verificar campos:', error.message);
      } else if (!columns || columns.length === 0) {
        console.log('❌ Campos customer_phone e customer_cpf NÃO existem!');
        console.log('🔧 Execute o SQL: ALTER TABLE public.orders ADD COLUMN customer_phone TEXT NULL;');
        console.log('🔧 Execute o SQL: ALTER TABLE public.orders ADD COLUMN customer_cpf TEXT NULL;');
      } else {
        console.log('✅ Campos existem no banco:');
        columns.forEach(col => {
          console.log(`   - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'})`);
        });
      }

      // Verificar pedidos recentes
      console.log('\n3️⃣ Verificando pedidos recentes...\n');

      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id, customer_name, customer_email, customer_phone, customer_cpf, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      if (ordersError) {
        console.log('❌ Erro ao buscar pedidos:', ordersError.message);
      } else if (!orders || orders.length === 0) {
        console.log('⚠️ Nenhum pedido encontrado na tabela orders');
      } else {
        console.log(`✅ Últimos ${orders.length} pedidos:`);
        orders.forEach((order, index) => {
          console.log(`${index + 1}. ${order.customer_name} (${order.customer_email})`);
          console.log(`   CPF: ${order.customer_cpf || 'NULL'}`);
          console.log(`   Telefone: ${order.customer_phone || 'NULL'}`);
          console.log(`   Data: ${new Date(order.created_at).toLocaleString('pt-BR')}`);
          console.log('');
        });
      }

    } catch (err) {
      console.log('❌ Erro geral:', err.message);
    }
  })();
}

console.log('\n📋 POSSÍVEIS CAUSAS DO PROBLEMA:');
console.log('1. Webhooks não estão enviando dados de CPF/telefone');
console.log('2. Lógica de extração não está funcionando');
console.log('3. Campos não foram criados no banco');
console.log('4. Sistema não foi reiniciado após mudanças');
console.log('5. Erro nos logs do sistema');

console.log('\n🔧 PRÓXIMOS PASSOS:');
console.log('1. Verifique logs do sistema quando webhook chega');
console.log('2. Compartilhe um exemplo de payload real');
console.log('3. Execute este script para diagnóstico completo');