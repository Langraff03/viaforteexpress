#!/usr/bin/env node
// Script para debugar a fila mass-email e verificar se está funcionando
// Executa verificações específicas para campanhas enterprise

const Redis = require('ioredis');

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT) || 6379,
  maxRetriesPerRequest: 3,
});

async function checkMassEmailQueue() {
  console.log('🔍 [DEBUG] Verificando fila mass-email...\n');

  try {
    // Verificar conectividade Redis
    const ping = await redis.ping();
    console.log(`📡 Redis Status: ${ping === 'PONG' ? '✅ CONECTADO' : '❌ FALHOU'}`);
    
    if (ping !== 'PONG') {
      console.log('❌ Redis não está acessível. Verifique se o Redis está rodando.');
      process.exit(1);
    }

    // Verificar filas mass-email
    const massEmailWaiting = await redis.llen('bull:mass-email:waiting');
    const massEmailActive = await redis.llen('bull:mass-email:active');
    const massEmailCompleted = await redis.llen('bull:mass-email:completed');
    const massEmailFailed = await redis.llen('bull:mass-email:failed');
    const massEmailDelayed = await redis.llen('bull:mass-email:delayed');
    
    console.log('\n📊 ESTATÍSTICAS FILA MASS-EMAIL:');
    console.log(`├─ 🔄 Aguardando: ${massEmailWaiting}`);
    console.log(`├─ 🚀 Ativos: ${massEmailActive}`);
    console.log(`├─ ⏰ Atrasados: ${massEmailDelayed}`);
    console.log(`├─ ✅ Concluídos: ${massEmailCompleted}`);
    console.log(`└─ ❌ Falharam: ${massEmailFailed}`);

    // Verificar jobs específicos na fila waiting
    if (massEmailWaiting > 0) {
      console.log('\n📦 JOBS EM ESPERA:');
      const waitingJobs = await redis.lrange('bull:mass-email:waiting', 0, 4); // Primeiros 5
      waitingJobs.forEach((jobData, index) => {
        try {
          const job = JSON.parse(jobData);
          console.log(`├─ Job ${index + 1}: ${job.name || 'sem nome'} (ID: ${job.id || 'N/A'})`);
        } catch (e) {
          console.log(`├─ Job ${index + 1}: Erro ao parsear dados`);
        }
      });
      if (massEmailWaiting > 5) {
        console.log(`└─ ... e mais ${massEmailWaiting - 5} jobs`);
      }
    }

    // Verificar jobs ativos
    if (massEmailActive > 0) {
      console.log('\n🔥 JOBS ATIVOS:');
      const activeJobs = await redis.lrange('bull:mass-email:active', 0, 2);
      activeJobs.forEach((jobData, index) => {
        try {
          const job = JSON.parse(jobData);
          console.log(`├─ Job ${index + 1}: ${job.name || 'sem nome'} (ID: ${job.id || 'N/A'})`);
        } catch (e) {
          console.log(`├─ Job ${index + 1}: Erro ao parsear dados`);
        }
      });
    }

    // Verificar campanhas em progresso
    console.log('\n🎯 ANÁLISE DE CAMPANHAS:');
    const allKeys = await redis.keys('bull:mass-email:*');
    const campaignKeys = allKeys.filter(key => 
      key.includes('mass-campaign') || key.includes('mass-batch')
    );
    
    if (campaignKeys.length > 0) {
      console.log(`├─ 📊 ${campaignKeys.length} chaves relacionadas a campanhas encontradas`);
      campaignKeys.slice(0, 5).forEach(key => {
        console.log(`├─ 🔑 ${key}`);
      });
      if (campaignKeys.length > 5) {
        console.log(`└─ ... e mais ${campaignKeys.length - 5} chaves`);
      }
    } else {
      console.log('└─ ℹ️  Nenhuma chave de campanha encontrada');
    }

    // Status geral
    const totalJobs = massEmailWaiting + massEmailActive + massEmailDelayed;
    console.log('\n📈 RESUMO GERAL:');
    if (totalJobs === 0) {
      console.log('└─ ✅ Fila mass-email está vazia e funcionando');
    } else {
      console.log(`└─ 📊 Total de ${totalJobs} jobs na fila mass-email`);
    }

    console.log('\n💡 DIAGNÓSTICO:');
    
    if (massEmailWaiting > 0 && massEmailActive === 0) {
      console.log('⚠️  PROBLEMA DETECTADO: Há jobs aguardando mas nenhum sendo processado!');
      console.log('🔧 SOLUÇÃO: Verifique se o mass-email.worker está rodando:');
      console.log('   npm run dev:mass-email');
      console.log('   OU');
      console.log('   npm run devall');
    } else if (massEmailActive > 0) {
      console.log('✅ Sistema funcionando: Jobs estão sendo processados');
    } else if (totalJobs === 0) {
      console.log('ℹ️  Nenhuma campanha em andamento no momento');
    }

    console.log('\n🚀 COMANDOS ÚTEIS:');
    console.log('├─ Testar worker: npm run dev:mass-email');
    console.log('├─ Todos workers: npm run devall');
    console.log('├─ Monitorar logs: tail -f logs/mass-email.log');
    console.log('└─ Debug Redis: redis-cli monitor');

  } catch (error) {
    console.error('❌ Erro ao verificar fila mass-email:', error);
    process.exit(1);
  } finally {
    redis.disconnect();
  }
}

// Executar verificação
checkMassEmailQueue();