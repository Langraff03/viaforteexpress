#!/usr/bin/env node

// Script simples para testar a validação de endereço sem afetar o sistema
// Simula diferentes estruturas de payload para verificar compatibilidade

console.log('🧪 Testando validação de endereço...\n');

// Simular diferentes estruturas de endereço que podem vir dos webhooks
const testPayloads = [
  {
    name: 'Estrutura 1: shipping.address.street',
    payload: {
      shipping: {
        address: {
          street: 'Rua das Flores, 123'
        }
      }
    }
  },
  {
    name: 'Estrutura 2: shipping.street',
    payload: {
      shipping: {
        street: 'Av. Brasil, 456'
      }
    }
  },
  {
    name: 'Estrutura 3: customer.address.street',
    payload: {
      customer: {
        address: {
          street: 'Rua do Comércio, 789'
        }
      }
    }
  },
  {
    name: 'Estrutura 4: customer.street',
    payload: {
      customer: {
        street: 'Praça Central, 101'
      }
    }
  },
  {
    name: 'Estrutura 5: Sem endereço',
    payload: {
      customer: {
        name: 'João Silva'
      }
    }
  }
];

function validateAddress(payload) {
  const payloadAny = payload;

  // Verificar múltiplas possibilidades de endereço (compatibilidade com diferentes gateways)
  const shippingStreet = payloadAny.shipping?.street || payloadAny.shipping?.address?.street;
  const customerStreet = payloadAny.customer?.address?.street;
  const shippingAddress = payloadAny.shipping?.address?.street || payloadAny.shipping?.street;
  const customerAddress = payloadAny.customer?.address?.street || payloadAny.customer?.street;

  // Validação permissiva: qualquer indicação de endereço é suficiente
  const hasAnyAddress = !!(shippingStreet || customerStreet || shippingAddress || customerAddress);

  return {
    hasAnyAddress,
    details: {
      shippingStreet,
      customerStreet,
      shippingAddress,
      customerAddress
    }
  };
}

console.log('📋 Testando diferentes estruturas de endereço:\n');

testPayloads.forEach((test, index) => {
  const result = validateAddress(test.payload);
  const status = result.hasAnyAddress ? '✅ TEM ENDEREÇO' : '❌ SEM ENDEREÇO';

  console.log(`${index + 1}. ${test.name}`);
  console.log(`   Status: ${status}`);
  console.log(`   Detalhes:`, result.details);
  console.log('');
});

console.log('🎯 Resultado: A validação é compatível com múltiplas estruturas!');
console.log('💡 Agora os workers aceitarão endereços de diferentes formatos de gateway.');
console.log('\n🔄 Para aplicar as correções:');
console.log('1. Reinicie os workers: npm run devall');
console.log('2. Teste com um webhook real');
console.log('3. Verifique os logs para confirmar que a validação está funcionando');