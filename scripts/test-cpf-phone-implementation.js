// Script para testar se CPF e telefone estão sendo salvos na tabela orders
// Execute: node scripts/test-cpf-phone-implementation.js

const { createClient } = require('@supabase/supabase-js');

// Configurações do Supabase (usar as mesmas do projeto)
const supabaseUrl = process.env.SUPABASE_URL || 'sua-url-supabase';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'sua-chave-supabase';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testCpfPhoneImplementation() {
  console.log('🧪 Testando implementação de CPF e telefone...\n');

  try {
    // 1. Verificar se as colunas existem na tabela
    console.log('1️⃣ Verificando estrutura da tabela orders...');
    
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
      console.error('❌ Erro ao verificar colunas:', columnsError);
      return;
    }

    if (!columns || columns.length === 0) {
      console.log('❌ Colunas customer_phone e customer_cpf não encontradas!');
      console.log('🔧 Execute primeiro o SQL:');
      console.log('   ALTER TABLE public.orders ADD COLUMN customer_phone TEXT NULL;');
      console.log('   ALTER TABLE public.orders ADD COLUMN customer_cpf TEXT NULL;');
      return;
    }

    console.log('✅ Colunas encontradas:');
    columns.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'})`);
    });

    // 2. Buscar pedidos recentes para verificar se os dados estão sendo salvos
    console.log('\n2️⃣ Verificando pedidos recentes...');
    
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id, customer_name, customer_email, customer_phone, customer_cpf, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    if (ordersError) {
      console.error('❌ Erro ao buscar pedidos:', ordersError);
      return;
    }

    if (!orders || orders.length === 0) {
      console.log('⚠️ Nenhum pedido encontrado na tabela orders');
      return;
    }

    console.log(`✅ Encontrados ${orders.length} pedidos recentes:`);
    
    let pedidosComCpf = 0;
    let pedidosComTelefone = 0;
    
    orders.forEach((order, index) => {
      const temCpf = order.customer_cpf ? '✅' : '❌';
      const temTelefone = order.customer_phone ? '✅' : '❌';
      
      if (order.customer_cpf) pedidosComCpf++;
      if (order.customer_phone) pedidosComTelefone++;
      
      console.log(`   ${index + 1}. ID: ${order.id.substring(0, 8)}...`);
      console.log(`      Cliente: ${order.customer_name}`);
      console.log(`      Email: ${order.customer_email}`);
      console.log(`      CPF: ${temCpf} ${order.customer_cpf || 'NULL'}`);
      console.log(`      Telefone: ${temTelefone} ${order.customer_phone || 'NULL'}`);
      console.log(`      Data: ${new Date(order.created_at).toLocaleString('pt-BR')}`);
      console.log('');
    });

    // 3. Estatísticas
    console.log('📊 Estatísticas:');
    console.log(`   - Pedidos com CPF: ${pedidosComCpf}/${orders.length} (${((pedidosComCpf/orders.length)*100).toFixed(1)}%)`);
    console.log(`   - Pedidos com Telefone: ${pedidosComTelefone}/${orders.length} (${((pedidosComTelefone/orders.length)*100).toFixed(1)}%)`);

    if (pedidosComCpf === 0 && pedidosComTelefone === 0) {
      console.log('\n⚠️ ATENÇÃO: Nenhum pedido possui CPF ou telefone!');
      console.log('Isso pode significar que:');
      console.log('1. A implementação ainda não foi testada com webhooks reais');
      console.log('2. Os webhooks não estão enviando esses dados');
      console.log('3. A lógica de extração precisa ser ajustada');
    } else {
      console.log('\n🎉 SUCESSO: Implementação funcionando! CPF e/ou telefone estão sendo salvos.');
    }

  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

// Executar o teste
testCpfPhoneImplementation();