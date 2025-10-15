const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://kbcaltiiworfgdqocofu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtiY2FsdGlpd29yZmdkcW9jb2Z1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTM1NDA4MSwiZXhwIjoyMDY0OTMwMDgxfQ.DpsIBE9g4BSFHIkijb4NAP5F5bhMxpuiDwxZDP5FkH0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function findRealInvoice() {
  try {
    console.log('🔍 Buscando pedidos reais no banco de dados...');
    
    // Buscar os últimos 5 pedidos
    const { data: orders, error } = await supabase
      .from('orders')
      .select('id, customer_name, customer_email, amount, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('❌ Erro ao buscar pedidos:', error);
      return;
    }

    if (!orders || orders.length === 0) {
      console.log('⚠️ Nenhum pedido encontrado no banco de dados');
      return;
    }

    console.log(`✅ Encontrados ${orders.length} pedidos:`);
    console.log('');

    orders.forEach((order, index) => {
      console.log(`📦 Pedido ${index + 1}:`);
      console.log(`   ID: ${order.id}`);
      console.log(`   Cliente: ${order.customer_name}`);
      console.log(`   Email: ${order.customer_email}`);
      console.log(`   Valor: R$ ${(order.amount / 100).toFixed(2)}`);
      console.log(`   Data: ${new Date(order.created_at).toLocaleString('pt-BR')}`);
      console.log(`   URL da Nota Fiscal: https://rastreio.logfastexpress.com/invoice/${order.id}`);
      console.log('');
    });

    // Testar o primeiro pedido
    const firstOrder = orders[0];
    console.log(`🧾 Testando nota fiscal do pedido: ${firstOrder.id}`);
    
    const response = await fetch(`https://fastlogexpress.ngrok.app/api/invoice/${firstOrder.id}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API da nota fiscal funcionando!');
      console.log('📄 Dados da nota fiscal:', JSON.stringify(data, null, 2));
    } else {
      console.log('❌ Erro na API da nota fiscal:', response.status, response.statusText);
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

findRealInvoice();