// Debug script para verificar se a campanha foi enfileirada corretamente
const Redis = require('ioredis');

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT) || 6379,
});

async function debugCampaign() {
  console.log('🔍 Verificando filas Redis...');
  
  try {
    // Verificar fila mass-email
    const massEmailJobs = await redis.llen('bull:mass-email:waiting');
    const massEmailActive = await redis.llen('bull:mass-email:active');
    const massEmailCompleted = await redis.llen('bull:mass-email:completed');
    const massEmailFailed = await redis.llen('bull:mass-email:failed');
    
    console.log('\n📊 FILA MASS-EMAIL:');
    console.log(`⏳ Waiting: ${massEmailJobs}`);
    console.log(`🔄 Active: ${massEmailActive}`);
    console.log(`✅ Completed: ${massEmailCompleted}`);
    console.log(`❌ Failed: ${massEmailFailed}`);
    
    // Verificar outros jobs enfileirados
    const allKeys = await redis.keys('bull:mass-email:*');
    console.log('\n🔑 Chaves mass-email encontradas:');
    allKeys.forEach(key => console.log(`  - ${key}`));
    
    // Verificar se há jobs esperando
    if (massEmailJobs > 0) {
      console.log('\n✅ HÁ JOBS ENFILEIRADOS! Worker deve processar em breve...');
    } else {
      console.log('\n❌ NENHUM JOB ENFILEIRADO - Problema na criação do job!');
      
      // Verificar fila email normal
      const emailJobs = await redis.llen('bull:email:waiting');
      console.log(`📧 Email queue waiting: ${emailJobs}`);
    }
    
    redis.disconnect();
    
  } catch (error) {
    console.error('❌ Erro:', error);
    redis.disconnect();
  }
}

debugCampaign();