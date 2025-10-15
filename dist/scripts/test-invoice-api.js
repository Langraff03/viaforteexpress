"use strict";
// Script simplificado para testar apenas a API de nota fiscal
// Executa: npx tsx src/scripts/test-invoice-api.ts
async function runInvoiceAPITest() {
    console.log('🧪 Testando API de nota fiscal...\n');
    try {
        // Usar um ID de pedido de exemplo (você pode substituir por um ID real)
        const testOrderId = '00146a2d-33ce-4d0d-9914-f074d6c07f8d'; // Exemplo da imagem
        console.log(`1️⃣ Testando API com pedido: ${testOrderId}`);
        const response = await fetch(`http://localhost:3001/api/invoice/${testOrderId}`);
        if (!response.ok) {
            console.error(`❌ Erro na API: ${response.status} - ${response.statusText}`);
            const errorText = await response.text();
            console.error('Resposta:', errorText);
            return;
        }
        const invoiceData = await response.json();
        console.log('✅ API respondeu com sucesso\n');
        // Verificar os dados da nota fiscal
        console.log('3️⃣ Verificando dados da nota fiscal...');
        console.log(`Cliente: ${invoiceData.data.nome_cliente}`);
        console.log(`Total da nota: R$ ${invoiceData.data.total.toFixed(2)}`);
        console.log(`Número de itens: ${invoiceData.data.itens.length}\n`);
        console.log('📋 Itens na nota fiscal:');
        invoiceData.data.itens.forEach((item, index) => {
            console.log(`   ${index + 1}. ${item.nome_item}`);
            console.log(`      Quantidade: ${item.quantidade}`);
            console.log(`      Preço unitário: R$ ${item.preco_item.toFixed(2)}`);
            console.log(`      Total do item: R$ ${(item.quantidade * item.preco_item).toFixed(2)}`);
            if (item.preco_item === 0) {
                console.log(`      ❌ PROBLEMA: Item com preço zero!`);
            }
            else {
                console.log(`      ✅ Item com preço válido`);
            }
            console.log('');
        });
        // Verificar se há valores zerados
        const itemsWithZeroPrice = invoiceData.data.itens.filter((item) => item.preco_item === 0);
        if (itemsWithZeroPrice.length > 0) {
            console.log(`❌ PROBLEMA ENCONTRADO: ${itemsWithZeroPrice.length} itens com preço zero:`);
            itemsWithZeroPrice.forEach((item) => {
                console.log(`   - ${item.nome_item}: R$ ${item.preco_item}`);
            });
        }
        else {
            console.log('✅ SUCESSO: Todos os itens têm preços válidos!');
        }
        // Verificar total
        const calculatedTotal = invoiceData.data.itens.reduce((sum, item) => sum + (item.quantidade * item.preco_item), 0);
        console.log(`\n💰 Verificação de totais:`);
        console.log(`   Total calculado: R$ ${calculatedTotal.toFixed(2)}`);
        console.log(`   Total da nota: R$ ${invoiceData.data.total.toFixed(2)}`);
        if (Math.abs(calculatedTotal - invoiceData.data.total) < 0.01) {
            console.log('✅ Totais conferem!');
        }
        else {
            console.log('❌ Totais não conferem!');
        }
        // Mostrar debug info se disponível
        if (invoiceData.debug) {
            console.log('\n🔍 Informações de debug:');
            console.log('   Valor original do pedido:', invoiceData.debug.originalAmount);
            console.log('   Valor convertido:', invoiceData.debug.convertedAmount);
            console.log('   Número de itens:', invoiceData.debug.itemsCount);
            if (invoiceData.debug.validationWarnings) {
                console.log('   Avisos:', invoiceData.debug.validationWarnings);
            }
        }
        console.log('\n🎯 RESULTADO:');
        if (itemsWithZeroPrice.length === 0 && Math.abs(calculatedTotal - invoiceData.data.total) < 0.01) {
            console.log('✅ CORREÇÃO FUNCIONOU! Todos os valores estão corretos.');
        }
        else {
            console.log('❌ AINDA HÁ PROBLEMAS. Verifique os logs acima.');
        }
    }
    catch (error) {
        console.error('❌ Erro durante o teste:', error);
    }
}
// Executar o teste
runInvoiceAPITest().then(() => {
    console.log('\n🏁 Teste concluído');
    process.exit(0);
}).catch(error => {
    console.error('💥 Erro fatal:', error);
    process.exit(1);
});
