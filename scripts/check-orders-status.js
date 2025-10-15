#!/usr/bin/env node

// Script simples para verificar o status dos pedidos no banco
// Mostra quantos pedidos têm endereços mas não estão marcados corretamente

console.log('🔍 Verificando status dos pedidos no banco de dados...\n');

// Simulação dos dados que viriam do banco (substitua pelos dados reais)
const mockOrdersData = [
  { id: 'order-1', customer_name: 'João Silva', city: 'São Paulo', state: 'SP', has_shipping_address: null },
  { id: 'order-2', customer_name: 'Maria Santos', city: 'Rio de Janeiro', state: 'RJ', has_shipping_address: false },
  { id: 'order-3', customer_name: 'Pedro Oliveira', city: null, state: null, has_shipping_address: null },
  { id: 'order-4', customer_name: 'Ana Costa', city: 'Belo Horizonte', state: 'MG', has_shipping_address: true },
  { id: 'order-5', customer_name: 'Carlos Lima', city: 'Porto Alegre', state: 'RS', has_shipping_address: null },
];

console.log('📊 ANÁLISE DOS PEDIDOS EXISTENTES:\n');

let totalPedidos = mockOrdersData.length;
let comEnderecoMasNaoMarcado = 0;
let semEndereco = 0;
let corretamenteMarcado = 0;
let naoValidado = 0;

mockOrdersData.forEach(order => {
  const temEndereco = !!(order.city || order.state);
  const marcadoComEndereco = order.has_shipping_address === true;
  const marcadoSemEndereco = order.has_shipping_address === false;
  const naoValidadoCampo = order.has_shipping_address === null;

  if (temEndereco && !marcadoComEndereco) {
    comEnderecoMasNaoMarcado++;
    console.log(`❌ ${order.id} - ${order.customer_name}: Tem endereço (${order.city || 'cidade não informada'}) mas não está marcado`);
  } else if (!temEndereco && marcadoSemEndereco) {
    semEndereco++;
    console.log(`✅ ${order.id} - ${order.customer_name}: Sem endereço, marcado corretamente`);
  } else if (temEndereco && marcadoComEndereco) {
    corretamenteMarcado++;
    console.log(`✅ ${order.id} - ${order.customer_name}: Endereço marcado corretamente`);
  } else if (naoValidadoCampo) {
    naoValidado++;
    console.log(`⚠️  ${order.id} - ${order.customer_name}: Campo não validado`);
  }
});

console.log('\n📈 RESUMO:');
console.log(`Total de pedidos: ${totalPedidos}`);
console.log(`Com endereço mas não marcado: ${comEnderecoMasNaoMarcado}`);
console.log(`Sem endereço: ${semEndereco}`);
console.log(`Corretamente marcado: ${corretamenteMarcado}`);
console.log(`Não validado: ${naoValidado}`);

if (comEnderecoMasNaoMarcado > 0) {
  console.log('\n🔧 SOLUÇÃO:');
  console.log('Execute o script SQL em: scripts/fix-address-validation.sql');
  console.log('Ou configure as variáveis SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY e execute:');
  console.log('npm run fix:address-validation');
} else {
  console.log('\n✅ Tudo parece estar correto!');
}

console.log('\n💡 DICAS:');
console.log('- Novos pedidos serão validados automaticamente pelos workers');
console.log('- O frontend agora mostra "Não Validado" para pedidos pendentes');
console.log('- Execute a correção SQL para pedidos existentes');