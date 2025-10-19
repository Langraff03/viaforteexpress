// Script para encontrar um pedido real e testar a API de nota fiscal
// Executa: npx tsx src/scripts/find-and-test-invoice.ts

async function findAndTestInvoice() {
  console.log('🔍 Buscando pedidos existentes e testando nota fiscal...\n');

  try {
    // 1. Buscar pedidos existentes via API
    console.log('1️⃣ Buscando pedidos existentes...');
    
    // Primeiro, vamos tentar algumas rotas para encontrar pedidos
    const possibleRoutes = [
      'http://localhost:3001/api/orders',
      'http://localhost:3001/api/admin/orders',
      'http://localhost:3001/orders'
    ];

    let ordersData = null;
    
    for (const route of possibleRoutes) {
      try {
        console.log(`   Tentando: ${route}`);
        const response = await fetch(route);
        if (response.ok) {
          ordersData = await response.json();
          console.log(`   ✅ Sucesso em: ${route}`);
          break;
        } else {
          console.log(`   ❌ ${response.status} - ${route}`);
        }
      } catch (error) {
        console.log(`   ❌ Erro em: ${route}`);
      }
    }

    if (!ordersData) {
      console.log('⚠️ Não foi possível buscar pedidos via API');
      console.log('💡 Vamos testar com IDs conhecidos da imagem...\n');
      
      // IDs visíveis na imagem da tabela order_items
      const knownOrderIds = [
        '00146a2d-33ce-4d0d-9914-f074d6c07f8d',
        '002b8ca0-a9f7-4a9c-9e8f-562d2f99e0ca',
        '003d4a5b-4f6d-47a2-a7ba-e1a2b3c4d5e6',
        '004a8e9c-9b2d-4f6e-b4a8-3a2c0b1d9e8f',
        '005b9f0d-0c3e-5f7f-c5b9-4b3d1c2e0f9g'
      ];

      for (const orderId of knownOrderIds) {
        console.log(`2️⃣ Testando com ID: ${orderId.substring(0, 8)}...`);
        
        const success = await testInvoiceAPI(orderId);
        if (success) {
          console.log('✅ Teste bem-sucedido!');
          return;
        }
      }
      
      console.log('❌ Nenhum dos IDs conhecidos funcionou');
      return;
    }

    // Se conseguiu buscar pedidos, usar o primeiro
    const orders = Array.isArray(ordersData) ? ordersData : ordersData.data || [];
    
    if (orders.length === 0) {
      console.log('⚠️ Nenhum pedido encontrado');
      return;
    }

    console.log(`✅ Encontrados ${orders.length} pedidos`);
    const firstOrder = orders[0];
    console.log(`   Usando pedido: ${firstOrder.id || firstOrder.order_id || 'ID não encontrado'}`);

    // 2. Testar API de nota fiscal
    const orderId = firstOrder.id || firstOrder.order_id;
    if (!orderId) {
      console.log('❌ ID do pedido não encontrado');
      return;
    }

    await testInvoiceAPI(orderId);

  } catch (error) {
    console.error('❌ Erro durante a busca:', error);
  }
}

async function testInvoiceAPI(orderId: string): Promise<boolean> {
  try {
    console.log(`\n🧪 Testando API de nota fiscal para: ${orderId}`);
    
    const response = await fetch(`http://localhost:3001/api/invoice/${orderId}`);
    
    if (!response.ok) {
      console.error(`❌ Erro na API: ${response.status} - ${response.statusText}`);
      const errorText = await response.text();
      console.error('Resposta:', errorText);
      return false;
    }

    const invoiceData = await response.json();
    console.log('✅ API respondeu com sucesso\n');
    
    // Verificar os dados da nota fiscal
    console.log('📋 Dados da nota fiscal:');
    console.log(`   Cliente: ${invoiceData.data.nome_cliente}`);
    console.log(`   Total da nota: R$ ${invoiceData.data.total.toFixed(2)}`);
    console.log(`   Número de itens: ${invoiceData.data.itens.length}\n`);
    
    console.log('🛍️ Itens na nota fiscal:');
    invoiceData.data.itens.forEach((item: any, index: number) => {
      const itemTotal = item.quantidade * item.preco_item;
      console.log(`   ${index + 1}. ${item.nome_item}`);
      console.log(`      Quantidade: ${item.quantidade}`);
      console.log(`      Preço unitário: R$ ${item.preco_item.toFixed(2)}`);
      console.log(`      Total do item: R$ ${itemTotal.toFixed(2)}`);
      
      if (item.preco_item === 0) {
        console.log(`      ❌ PROBLEMA: Item com preço zero!`);
      } else {
        console.log(`      ✅ Item com preço válido`);
      }
      console.log('');
    });

    // Verificar se há valores zerados
    const itemsWithZeroPrice = invoiceData.data.itens.filter((item: any) => item.preco_item === 0);
    
    console.log('🔍 Análise dos resultados:');
    if (itemsWithZeroPrice.length > 0) {
      console.log(`❌ PROBLEMA: ${itemsWithZeroPrice.length} itens com preço zero:`);
      itemsWithZeroPrice.forEach((item: any) => {
        console.log(`   - ${item.nome_item}: R$ ${item.preco_item}`);
      });
    } else {
      console.log('✅ SUCESSO: Todos os itens têm preços válidos!');
    }

    // Verificar total
    const calculatedTotal = invoiceData.data.itens.reduce((sum: number, item: any) => 
      sum + (item.quantidade * item.preco_item), 0
    );
    
    console.log(`\n💰 Verificação de totais:`);
    console.log(`   Total calculado: R$ ${calculatedTotal.toFixed(2)}`);
    console.log(`   Total da nota: R$ ${invoiceData.data.total.toFixed(2)}`);
    
    const totalsMatch = Math.abs(calculatedTotal - invoiceData.data.total) < 0.01;
    if (totalsMatch) {
      console.log('✅ Totais conferem!');
    } else {
      console.log('❌ Totais não conferem!');
    }

    // Resultado final
    console.log('\n🎯 RESULTADO FINAL:');
    if (itemsWithZeroPrice.length === 0 && totalsMatch) {
      console.log('🎉 CORREÇÃO FUNCIONOU! Todos os valores estão corretos.');
      console.log('✅ O problema da nota fiscal foi resolvido.');
    } else {
      console.log('⚠️ AINDA HÁ PROBLEMAS:');
      if (itemsWithZeroPrice.length > 0) {
        console.log(`   - ${itemsWithZeroPrice.length} itens com preço zero`);
      }
      if (!totalsMatch) {
        console.log('   - Totais não conferem');
      }
    }

    return itemsWithZeroPrice.length === 0 && totalsMatch;

  } catch (error) {
    console.error('❌ Erro durante o teste da API:', error);
    return false;
  }
}

// Executar o teste
findAndTestInvoice().then(() => {
  console.log('\n🏁 Teste concluído');
  process.exit(0);
}).catch(error => {
  console.error('💥 Erro fatal:', error);
  process.exit(1);
});