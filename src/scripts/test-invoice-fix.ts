// Script para testar a correção da nota fiscal
// Executa: npx tsx src/scripts/test-invoice-fix.ts

import { supabaseAdmin } from '../lib/server/supabaseAdmin'; // ✅ Backend seguro

async function testInvoiceFix() {
  console.log('🧪 Iniciando teste da correção da nota fiscal...\n');

  try {
    // 1. Buscar um pedido que tenha múltiplos itens
    console.log('1️⃣ Buscando pedidos com múltiplos itens...');
    
    const { data: ordersWithItems, error: ordersError } = await supabaseAdmin
      .from('orders')
      .select(`
        id,
        customer_name,
        customer_email,
        amount,
        payment_id,
        order_items (
          id,
          product_name,
          quantity,
          unit_price
        )
      `)
      .limit(5);

    if (ordersError) {
      console.error('❌ Erro ao buscar pedidos:', ordersError);
      return;
    }

    console.log(`✅ Encontrados ${ordersWithItems.length} pedidos`);
    
    // Filtrar pedidos que têm itens
    const ordersWithMultipleItems = ordersWithItems.filter(order => 
      order.order_items && order.order_items.length > 0
    );

    if (ordersWithMultipleItems.length === 0) {
      console.log('⚠️ Nenhum pedido com itens encontrado');
      return;
    }

    console.log(`✅ Encontrados ${ordersWithMultipleItems.length} pedidos com itens\n`);

    // 2. Testar com o primeiro pedido que tem itens
    const testOrder = ordersWithMultipleItems[0];
    console.log('2️⃣ Testando com pedido:', {
      id: testOrder.id,
      customer: testOrder.customer_name,
      amount: testOrder.amount,
      items_count: testOrder.order_items.length
    });

    console.log('\n📋 Itens do pedido:');
    testOrder.order_items.forEach((item: any, index: number) => {
      console.log(`   ${index + 1}. ${item.product_name}`);
      console.log(`      Quantidade: ${item.quantity}`);
      console.log(`      Preço unitário: ${item.unit_price} centavos`);
      console.log(`      Preço em reais: R$ ${(item.unit_price / 100).toFixed(2)}`);
      console.log(`      Total: R$ ${(item.quantity * item.unit_price / 100).toFixed(2)}`);
    });

    // 3. Testar a API de nota fiscal
    console.log('\n3️⃣ Testando API de nota fiscal...');
    
    const response = await fetch(`http://localhost:3001/api/invoice/${testOrder.id}`);
    
    if (!response.ok) {
      console.error(`❌ Erro na API: ${response.status} - ${response.statusText}`);
      const errorText = await response.text();
      console.error('Resposta:', errorText);
      return;
    }

    const invoiceData = await response.json();
    console.log('✅ API respondeu com sucesso');
    
    // 4. Verificar os dados da nota fiscal
    console.log('\n4️⃣ Verificando dados da nota fiscal...');
    console.log('Total da nota:', invoiceData.data.total);
    console.log('Número de itens:', invoiceData.data.itens.length);
    
    console.log('\n📋 Itens na nota fiscal:');
    invoiceData.data.itens.forEach((item: any, index: number) => {
      console.log(`   ${index + 1}. ${item.nome_item}`);
      console.log(`      Quantidade: ${item.quantidade}`);
      console.log(`      Preço: R$ ${item.preco_item.toFixed(2)}`);
      console.log(`      Total: R$ ${(item.quantidade * item.preco_item).toFixed(2)}`);
    });

    // 5. Verificar se há valores zerados
    const itemsWithZeroPrice = invoiceData.data.itens.filter((item: any) => item.preco_item === 0);
    
    if (itemsWithZeroPrice.length > 0) {
      console.log(`\n❌ PROBLEMA ENCONTRADO: ${itemsWithZeroPrice.length} itens com preço zero:`);
      itemsWithZeroPrice.forEach((item: any) => {
        console.log(`   - ${item.nome_item}: R$ ${item.preco_item}`);
      });
    } else {
      console.log('\n✅ SUCESSO: Todos os itens têm preços válidos!');
    }

    // 6. Verificar total
    const calculatedTotal = invoiceData.data.itens.reduce((sum: number, item: any) => 
      sum + (item.quantidade * item.preco_item), 0
    );
    
    console.log(`\n💰 Verificação de totais:`);
    console.log(`   Total calculado: R$ ${calculatedTotal.toFixed(2)}`);
    console.log(`   Total da nota: R$ ${invoiceData.data.total.toFixed(2)}`);
    console.log(`   Total do pedido: R$ ${(testOrder.amount / 100).toFixed(2)}`);
    
    if (Math.abs(calculatedTotal - invoiceData.data.total) < 0.01) {
      console.log('✅ Totais conferem!');
    } else {
      console.log('❌ Totais não conferem!');
    }

    // 7. Mostrar debug info se disponível
    if (invoiceData.debug) {
      console.log('\n🔍 Informações de debug:');
      console.log('   Valor original do pedido:', invoiceData.debug.originalAmount);
      console.log('   Valor convertido:', invoiceData.debug.convertedAmount);
      console.log('   Número de itens:', invoiceData.debug.itemsCount);
      if (invoiceData.debug.validationWarnings) {
        console.log('   Avisos:', invoiceData.debug.validationWarnings);
      }
    }

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

// Executar o teste
testInvoiceFix().then(() => {
  console.log('\n🏁 Teste concluído');
  process.exit(0);
}).catch(error => {
  console.error('💥 Erro fatal:', error);
  process.exit(1);
});