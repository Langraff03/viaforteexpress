// Script para testar a função getDateRange corrigida
console.log('🔍 Testando função getDateRange corrigida...');

// Simular a função getDateRange corrigida
function getDateRange(range) {
  const now = new Date();
  
  // Obter valores UTC da data atual
  const nowUTC = {
    year: now.getUTCFullYear(),
    month: now.getUTCMonth(),
    date: now.getUTCDate()
  };
  
  let startDate;
  let endDate;
  
  switch (range) {
    case 'today':
      // Início do dia atual em UTC (00:00:00.000 UTC)
      startDate = new Date(Date.UTC(nowUTC.year, nowUTC.month, nowUTC.date, 0, 0, 0, 0));
      // Fim do dia atual em UTC (23:59:59.999 UTC)
      endDate = new Date(Date.UTC(nowUTC.year, nowUTC.month, nowUTC.date, 23, 59, 59, 999));
      break;
    case 'week':
      // Últimos 7 dias completos em UTC (hoje + 6 dias anteriores)
      startDate = new Date(Date.UTC(nowUTC.year, nowUTC.month, nowUTC.date - 6, 0, 0, 0, 0));
      // Fim do dia atual em UTC
      endDate = new Date(Date.UTC(nowUTC.year, nowUTC.month, nowUTC.date, 23, 59, 59, 999));
      break;
    case 'month':
      // Primeiro dia do mês atual em UTC
      startDate = new Date(Date.UTC(nowUTC.year, nowUTC.month, 1, 0, 0, 0, 0));
      // Fim do dia atual em UTC
      endDate = new Date(Date.UTC(nowUTC.year, nowUTC.month, nowUTC.date, 23, 59, 59, 999));
      break;
    case 'year':
      // Primeiro dia do ano atual em UTC
      startDate = new Date(Date.UTC(nowUTC.year, 0, 1, 0, 0, 0, 0));
      // Fim do dia atual em UTC
      endDate = new Date(Date.UTC(nowUTC.year, nowUTC.month, nowUTC.date, 23, 59, 59, 999));
      break;
    default:
      // Fallback para 'today'
      startDate = new Date(Date.UTC(nowUTC.year, nowUTC.month, nowUTC.date, 0, 0, 0, 0));
      endDate = new Date(Date.UTC(nowUTC.year, nowUTC.month, nowUTC.date, 23, 59, 59, 999));
  }
  
  const result = {
    start: startDate.toISOString(),
    end: endDate.toISOString()
  };
  
  // Calcular quantos dias o range abrange
  const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  
  console.log(`📅 [DATE RANGE] ${range} (${daysDiff} days):`, {
    'Local Time': {
      start: startDate.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
      end: endDate.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
    },
    'UTC Time': {
      start: startDate.toUTCString(),
      end: endDate.toUTCString()
    },
    'ISO Strings': {
      start: result.start,
      end: result.end
    }
  });
  
  return result;
}

// Testar todos os períodos
console.log('\n=== TESTE DE TODOS OS PERÍODOS ===');
const periods = ['today', 'week', 'month', 'year'];

periods.forEach(period => {
  console.log(`\n--- Testando período: ${period} ---`);
  getDateRange(period);
});

// Verificar se week > today
console.log('\n=== VERIFICAÇÃO DE LÓGICA ===');
const todayRange = getDateRange('today');
const weekRange = getDateRange('week');

console.log('Comparação de períodos:');
console.log('Today start:', todayRange.start);
console.log('Today end:', todayRange.end);
console.log('Week start:', weekRange.start);
console.log('Week end:', weekRange.end);

// Calcular quantos dias cada período tem
const todayDays = Math.ceil((new Date(todayRange.end).getTime() - new Date(todayRange.start).getTime()) / (1000 * 60 * 60 * 24));
const weekDays = Math.ceil((new Date(weekRange.end).getTime() - new Date(weekRange.start).getTime()) / (1000 * 60 * 60 * 24));

console.log(`\n📊 Dias em cada período:`);
console.log(`Today: ${todayDays} dias`);
console.log(`Week: ${weekDays} dias`);

if (weekDays > todayDays) {
  console.log('✅ CORRETO: Week tem mais dias que Today');
} else {
  console.log('❌ ERRO: Week deveria ter mais dias que Today');
}

// Simular dados de exemplo para testar filtros
console.log('\n=== SIMULAÇÃO DE DADOS ===');

// Dados de exemplo com diferentes datas
const sampleOrders = [
  { id: 1, amount: 10000, created_at: '2025-07-15T12:00:00.000Z' }, // Hoje
  { id: 2, amount: 5000, created_at: '2025-07-14T12:00:00.000Z' },  // Ontem
  { id: 3, amount: 7500, created_at: '2025-07-13T12:00:00.000Z' },  // 2 dias atrás
  { id: 4, amount: 3000, created_at: '2025-07-10T12:00:00.000Z' },  // 5 dias atrás
  { id: 5, amount: 8000, created_at: '2025-07-01T12:00:00.000Z' },  // Início do mês
  { id: 6, amount: 2000, created_at: '2025-06-15T12:00:00.000Z' },  // Mês passado
];

// Testar filtros com dados de exemplo
function testFilterWithData(range, orders) {
  const { start, end } = getDateRange(range);
  
  const filteredOrders = orders.filter(order => {
    const orderDate = order.created_at;
    return orderDate >= start && orderDate <= end;
  });
  
  const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.amount, 0);
  
  console.log(`\n📈 Filtro ${range}:`);
  console.log(`  Pedidos encontrados: ${filteredOrders.length}`);
  console.log(`  Receita total: R$ ${(totalRevenue / 100).toFixed(2)}`);
  console.log(`  Pedidos: ${filteredOrders.map(o => o.id).join(', ')}`);
  
  return { count: filteredOrders.length, revenue: totalRevenue };
}

// Testar todos os filtros
const results = {};
periods.forEach(period => {
  results[period] = testFilterWithData(period, sampleOrders);
});

// Verificar se a lógica está correta
console.log('\n=== VERIFICAÇÃO FINAL ===');
console.log('Resultados por período:');
Object.entries(results).forEach(([period, data]) => {
  console.log(`${period}: ${data.count} pedidos, R$ ${(data.revenue / 100).toFixed(2)}`);
});

if (results.week.revenue > results.today.revenue) {
  console.log('✅ CORRETO: Week tem mais receita que Today');
} else {
  console.log('❌ POTENCIAL PROBLEMA: Week deveria ter mais receita que Today');
}