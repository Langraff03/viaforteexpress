// Teste simples da lógica de extração (sem imports complexos)
// Execute: node scripts/testar-extracao-simples.js

// Simulando a lógica de extração do GatewayUtils
function extractCustomerInfo(payload) {
  const customer = payload.customer || payload.payer || payload.billing_details || payload;

  if (!customer) return null;

  // Extração específica para diferentes estruturas de documento
  let document = customer.document || customer.cpf || customer.cnpj || customer.tax_id;

  // Tratamento específico para Asset (estrutura: customer.document.number)
  if (customer.document && typeof customer.document === 'object' && customer.document.number) {
    document = customer.document.number;
  }

  return {
    name: customer.name || customer.first_name || customer.full_name || customer.nome,
    email: customer.email || customer.email_address,
    phone: customer.phone || customer.phone_number || customer.mobile_phone || customer.telefone,
    document: document
  };
}

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
console.log('📋 Payload do Asset (customer.document.number):');
console.log(JSON.stringify(payloadAsset.data.customer.document, null, 2));
console.log('');

try {
  const dadosExtraidos = extractCustomerInfo(payloadAsset.data);
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

console.log('\n🔧 PRÓXIMO PASSO:');
console.log('Agora que a lógica está corrigida, reinicie o sistema e teste com um webhook real.');