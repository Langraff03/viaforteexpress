// Teste específico para extração de dados do Asset
// Execute: node scripts/testar-extracao-asset.js

const { GatewayUtils } = require('../src/lib/gateways/GatewayUtils');

// Payload real do Asset fornecido pelo usuário
const payloadAsset = {
  "id": 229574178,
  "type": "transaction",
  "objectId": "120210506",
  "url": "https://fastlogexpress.ngrok.app/webhook/asset",
  "data": {
    "id": 120210506,
    "customer": {
      "id": 78820177,
      "name": "diego teste",
      "email": "dolirosbr@gmail.com",
      "phone": null,
      "address": null,
      "document": {
        "id": 78295738,
        "type": "cpf",
        "number": "14942809657"
      }
    }
  }
};

console.log('🧪 TESTANDO EXTRAÇÃO DE DADOS DO ASSET\n');

// Testar extração
console.log('📋 Payload do Asset:');
console.log(JSON.stringify(payloadAsset, null, 2));
console.log('');

try {
  const dadosExtraidos = GatewayUtils.extractCustomerInfo(payloadAsset.data);
  console.log('✅ Dados extraídos:');
  console.log(JSON.stringify(dadosExtraidos, null, 2));
  console.log('');

  if (dadosExtraidos?.document) {
    console.log('🎉 SUCESSO! CPF foi extraído corretamente:', dadosExtraidos.document);
  } else {
    console.log('❌ FALHA! CPF não foi extraído');
  }

  if (dadosExtraidos?.phone) {
    console.log('📞 Telefone encontrado:', dadosExtraidos.phone);
  } else {
    console.log('📞 Telefone não encontrado (esperado, pois está null no payload)');
  }

} catch (error) {
  console.log('❌ ERRO na extração:', error.message);
}

console.log('\n💡 RESULTADO ESPERADO:');
console.log('- CPF: "14942809657"');
console.log('- Telefone: null (não informado)');