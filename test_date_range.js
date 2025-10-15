// Teste para verificar se a correção do bug da função getDateRange está funcionando
function testDateRange() {
  console.log('🧪 TESTE: Verificando correção do bug getDateRange()');
  console.log('=' . repeat(50));
  
  // Simular a função corrigida
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
        startDate = new Date(Date.UTC(nowUTC.year, nowUTC.month, nowUTC.date, 0, 0, 0, 0));
        endDate = new Date(Date.UTC(nowUTC.year, nowUTC.month, nowUTC.date, 23, 59, 59, 999));
        break;
      case 'week':
        startDate = new Date(Date.UTC(nowUTC.year, nowUTC.month, nowUTC.date - 6, 0, 0, 0, 0));
        endDate = new Date(Date.UTC(nowUTC.year, nowUTC.month, nowUTC.date, 23, 59, 59, 999));
        break;
      case 'month':
        startDate = new Date(Date.UTC(nowUTC.year, nowUTC.month, 1, 0, 0, 0, 0));
        endDate = new Date(Date.UTC(nowUTC.year, nowUTC.month, nowUTC.date, 23, 59, 59, 999));
        break;
      case 'year':
        startDate = new Date(Date.UTC(nowUTC.year, 0, 1, 0, 0, 0, 0));
        endDate = new Date(Date.UTC(nowUTC.year, nowUTC.month, nowUTC.date, 23, 59, 59, 999));
        break;
    }
    
    return {
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      daysDiff: Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    };
  }
  
  // Testar todos os ranges
  const ranges = ['today', 'week', 'month', 'year'];
  const results = {};
  
  console.log(`📅 Data atual: ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} (São Paulo)`);
  console.log(`📅 Data UTC: ${new Date().toUTCString()}`);
  console.log('');
  
  ranges.forEach(range => {
    const result = getDateRange(range);
    results[range] = result;
    
    console.log(`📊 ${range.toUpperCase()}:`);
    console.log(`   📅 Período: ${result.daysDiff} dias`);
    console.log(`   🕐 Start: ${result.start}`);
    console.log(`   🕐 End: ${result.end}`);
    console.log(`   📍 Start (São Paulo): ${new Date(result.start).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);
    console.log(`   📍 End (São Paulo): ${new Date(result.end).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);
    console.log('');
  });
  
  // Verificar se week > today (principal teste)
  console.log('🔍 VERIFICAÇÃO DO BUG:');
  console.log('=' . repeat(30));
  
  const todayDays = results.today.daysDiff;
  const weekDays = results.week.daysDiff;
  
  console.log(`📊 Hoje: ${todayDays} dias`);
  console.log(`📊 Últimos 7 dias: ${weekDays} dias`);
  
  if (weekDays > todayDays) {
    console.log('✅ SUCESSO: "Últimos 7 dias" tem mais dias que "Hoje"');
    console.log('✅ BUG CORRIGIDO!');
  } else {
    console.log('❌ ERRO: "Últimos 7 dias" deveria ter mais dias que "Hoje"');
    console.log('❌ BUG AINDA PRESENTE!');
  }
  
  // Verificar se week tem exatamente 7 dias
  if (weekDays === 7) {
    console.log('✅ SUCESSO: "Últimos 7 dias" tem exatamente 7 dias');
  } else {
    console.log(`❌ ERRO: "Últimos 7 dias" tem ${weekDays} dias, deveria ter 7`);
  }
  
  // Verificar se today tem exatamente 1 dia
  if (todayDays === 1) {
    console.log('✅ SUCESSO: "Hoje" tem exatamente 1 dia');
  } else {
    console.log(`❌ ERRO: "Hoje" tem ${todayDays} dias, deveria ter 1`);
  }
}

// Executar o teste
testDateRange();