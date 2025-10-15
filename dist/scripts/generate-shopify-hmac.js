"use strict";
/**
 * Script para gerar HMAC correto para teste Shopify
 * Execute: node src/scripts/generate-shopify-hmac.js
 */
const crypto = require('crypto');
// Configuração de teste (mesmos valores do banco)
const WEBHOOK_SECRET = 'meu_secret_shopify_teste_123';
// Payload exato do teste (IMPORTANTE: deve ser idêntico ao enviado)
const testPayload = {
    "id": 450789469,
    "financial_status": "paid",
    "email": "cliente@teste.com",
    "total_price": "149.99",
    "shipping_address": {
        "address1": "Rua das Flores, 123",
        "city": "São Paulo",
        "province": "SP"
    },
    "customer": {
        "first_name": "João",
        "last_name": "Silva"
    },
    "line_items": [
        {
            "title": "Produto Teste",
            "quantity": 1,
            "price": "149.99"
        }
    ]
};
function generateHMAC() {
    try {
        // Converter payload para string (SEM espaços, como o Postman envia)
        const payloadString = JSON.stringify(testPayload);
        console.log('🔐 Gerando HMAC para teste Shopify...\n');
        console.log('📋 Dados de entrada:');
        console.log(`   Secret: ${WEBHOOK_SECRET}`);
        console.log(`   Payload: ${payloadString.substring(0, 100)}...`);
        console.log(`   Tamanho: ${payloadString.length} caracteres\n`);
        // Calcular HMAC SHA256
        const hmac = crypto
            .createHmac('sha256', WEBHOOK_SECRET)
            .update(payloadString, 'utf8')
            .digest('base64');
        console.log('✅ HMAC gerado com sucesso!');
        console.log(`🔑 X-Shopify-Hmac-Sha256: ${hmac}\n`);
        console.log('📋 Para usar no Postman:');
        console.log('   1. Aba Headers');
        console.log('   2. Key: X-Shopify-Hmac-Sha256');
        console.log(`   3. Value: ${hmac}`);
        console.log('\n🎯 Com este HMAC, o teste deve passar com sucesso!');
        return hmac;
    }
    catch (error) {
        console.error('❌ Erro ao gerar HMAC:', error);
        return null;
    }
}
// Executar se chamado diretamente
if (require.main === module) {
    generateHMAC();
}
module.exports = { generateHMAC, WEBHOOK_SECRET, testPayload };
