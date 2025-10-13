import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tkrqqwihozqfzmaulego.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRrcnFxd2lob3pxZnptYXVsZWdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5MTA2NjMsImV4cCI6MjA2MDQ4NjY2M30.1qN0aNsnPjxiX0Jlk9yxmZNEj-jPwVStmEo0BQqQ5-E';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testUpdate() {
  const trackingCode = 'PCWDTB'; // Ajuste para o código que quer testar

  // Verifica se existe pedido com trackingCode
  const { data: existing, error: fetchError } = await supabase
    .from('orders')
    .select('*')
    .eq('tracking_code', trackingCode);

  console.log('Pedidos encontrados:', existing, 'Erro:', fetchError);

  if (fetchError) {
    console.error('Erro ao buscar pedido:', fetchError);
    return;
  }

  if (!existing || existing.length === 0) {
    console.log('Código de rastreio não encontrado.');
    return;
  }

  // Se existir pedido, atualiza
  const { error } = await supabase
    .from('orders')
    .update({
      redelivery_requested: true,
      redelivery_date: new Date().toISOString(),
      status: 'redelivery_scheduled',
    })
    .eq('tracking_code', trackingCode);

  if (error) {
    console.error('Erro ao atualizar:', error);
  } else {
    console.log('Update realizado com sucesso');
  }
}

testUpdate();
