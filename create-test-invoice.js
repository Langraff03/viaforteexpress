// Script para criar um pedido de teste para nota fiscal
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://kbcaltiiworfgdqocofu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtiY2FsdGlpd29yZmdkcW9jb2Z1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTM1NDA4MSwiZXhwIjoyMDY0OTMwMDgxfQ.DpsIBE9g4BSFHIkijb4NAP5F5bhMxpuiDwxZDP5FkH0'
);

// Gerar UUID simples
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

async function createTestOrder() {
  try {
    const orderId = generateUUID();
    const testOrder = {
      id: orderId,
      customer_name: 'João Silva',
      customer_email: 'joao@teste.com',
      amount: 5000, // R$ 50,00 em centavos
      status: 'paid',
      payment_id: 'PAY_' + Date.now(),
      tracking_code: 'TR' + Math.random().toString(36).substr(2, 6).toUpperCase(),
      created_at: new Date().toISOString(),
      city: 'São Paulo',
      state: 'SP'
    };

    console.log('Criando pedido de teste...');
    
    const { data, error } = await supabase
      .from('orders')
      .insert(testOrder)
      .select()
      .single();

    if (error) {
      console.error('❌ Erro ao criar pedido:', error.message);
      return;
    }

    console.log('✅ Pedido de teste criado com sucesso!');
    console.log('📋 Detalhes:');
    console.log(`   ID: ${data.id}`);
    console.log(`   Cliente: ${data.customer_name}`);
    console.log(`   Email: ${data.customer_email}`);
    console.log(`   Valor: R$ ${(data.amount / 100).toFixed(2)}`);
    console.log(`   Status: ${data.status}`);
    console.log('');
    console.log('🔗 URLs para testar:');
    console.log(`   Nota Fiscal: http://localhost:5173/invoice/${data.id}`);
    console.log(`   Nota Fiscal Pública: http://localhost:5173/public-invoice/${data.id}`);
    console.log('');
    console.log('🧪 Teste da API:');
    console.log(`   curl "http://localhost:3001/api/invoice/${data.id}"`);

  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}

createTestOrder();