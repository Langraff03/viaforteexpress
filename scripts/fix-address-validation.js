#!/usr/bin/env node

// Script para corrigir a validação de endereço em pedidos existentes
// Atualiza o campo has_shipping_address baseado nos dados de endereço disponíveis

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são necessárias');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixAddressValidation() {
  console.log('🔧 Iniciando correção da validação de endereço...\n');

  try {
    // Buscar pedidos que podem ter endereços mas não têm has_shipping_address definido
    const { data: orders, error } = await supabase
      .from('orders')
      .select('id, city, state, has_shipping_address')
      .or('has_shipping_address.is.null,has_shipping_address.eq.false')
      .not('city', 'is', null)
      .limit(1000); // Processar em lotes para não sobrecarregar

    if (error) {
      console.error('❌ Erro ao buscar pedidos:', error);
      return;
    }

    if (!orders || orders.length === 0) {
      console.log('✅ Nenhum pedido encontrado para correção');
      return;
    }

    console.log(`📊 Encontrados ${orders.length} pedidos para análise\n`);

    let corrected = 0;
    let skipped = 0;

    for (const order of orders) {
      // Verificar se o pedido tem informações de endereço
      const hasAddressInfo = !!(order.city || order.state);

      if (hasAddressInfo && !order.has_shipping_address) {
        // Atualizar o pedido para marcar que tem endereço
        const { error: updateError } = await supabase
          .from('orders')
          .update({
            has_shipping_address: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', order.id);

        if (updateError) {
          console.error(`❌ Erro ao atualizar pedido ${order.id}:`, updateError);
        } else {
          console.log(`✅ Pedido ${order.id} corrigido - endereço detectado`);
          corrected++;
        }
      } else {
        console.log(`⏭️ Pedido ${order.id} pulado - sem informações de endereço ou já corrigido`);
        skipped++;
      }
    }

    console.log(`\n📊 Resumo da correção:`);
    console.log(`- Pedidos corrigidos: ${corrected}`);
    console.log(`- Pedidos pulados: ${skipped}`);
    console.log(`- Total processado: ${orders.length}`);

    if (corrected > 0) {
      console.log('\n🎉 Correção concluída! Os pedidos agora terão a validação de endereço correta.');
    }

  } catch (error) {
    console.error('❌ Erro durante a correção:', error);
  }
}

// Executar a correção
fixAddressValidation().then(() => {
  console.log('\n🏁 Processo finalizado');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});