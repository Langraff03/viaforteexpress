// src/scripts/manualSend.ts
import { queueEmail } from '../lib/queue';
async function sendManualEmail() {
    try {
        await queueEmail({
            to: 'reyop135@gmail.com',
            subject: 'Pedido Confirmado – Seu Código de Rastreio',
            template: 'order_tracking', // ou ajuste se seu worker usa outro nome
            context: {
                order_id: 'manual-tonygabriih', // qualquer ID único
                customerName: 'Iae mlk',
                trackingCode: 'CL3ZSM',
                trackingUrl: 'https://rastreio.viaforteexpress.com/tracking/CL3ZSM',
                year: new Date().getFullYear(),
            }
        });
        console.log('✅ Email manual enfileirado com sucesso!');
    }
    catch (error) {
        console.error('❌ Erro ao enfileirar email manual:', error);
    }
}
sendManualEmail();
