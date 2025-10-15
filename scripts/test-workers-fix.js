#!/usr/bin/env node

// Script para testar se as correções dos workers funcionaram
// Executa verificações básicas de saúde

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 Testando correções dos workers...\n');

// Verificar se os arquivos de correção existem
const checks = [
  {
    name: 'Tratamento de erros globais',
    check: () => fs.existsSync('src/workers/index.ts') &&
             fs.readFileSync('src/workers/index.ts', 'utf8').includes('uncaughtException')
  },
  {
    name: 'Configuração Redis melhorada',
    check: () => fs.existsSync('src/lib/queue.ts') &&
             fs.readFileSync('src/lib/queue.ts', 'utf8').includes('maxRetriesPerRequest: 3')
  },
  {
    name: 'Script de monitoramento Windows',
    check: () => fs.existsSync('scripts/monitor-workers.bat')
  },
  {
    name: 'Script de monitoramento Linux/Mac',
    check: () => fs.existsSync('scripts/monitor-workers.sh')
  },
  {
    name: 'Comandos no package.json',
    check: () => {
      const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      return pkg.scripts['monitor:workers'] && pkg.scripts['devall:monitored'];
    }
  }
];

// Executar verificações
let passed = 0;
let failed = 0;

checks.forEach(({ name, check }) => {
  try {
    if (check()) {
      console.log(`✅ ${name}: OK`);
      passed++;
    } else {
      console.log(`❌ ${name}: FALHA`);
      failed++;
    }
  } catch (error) {
    console.log(`❌ ${name}: ERRO - ${error.message}`);
    failed++;
  }
});

console.log(`\n📊 Resultado: ${passed} passaram, ${failed} falharam`);

if (failed === 0) {
  console.log('\n🎉 Todas as correções foram aplicadas com sucesso!');
  console.log('\n📋 PRÓXIMOS PASSOS:');
  console.log('1. Execute: npm run devall:monitored (para desenvolvimento com monitoramento)');
  console.log('2. Ou execute: npm run devall + npm run monitor:workers:loop (separadamente)');
  console.log('3. Monitore os logs em: logs/workers-monitor.log');
  console.log('4. Verifique os logs individuais dos workers em: logs/*.log');
} else {
  console.log('\n⚠️ Algumas correções podem não ter sido aplicadas corretamente.');
  console.log('Verifique os arquivos mencionados acima.');
}

console.log('\n🔧 COMANDOS DISPONÍVEIS:');
console.log('- npm run monitor:workers: Executa verificação única');
console.log('- npm run monitor:workers:loop: Monitoramento contínuo (a cada 5 min)');
console.log('- npm run devall:monitored: Desenvolvimento com monitoramento automático');

console.log('\n📁 ARQUIVOS DE LOG:');
console.log('- logs/workers-monitor.log: Log do sistema de monitoramento');
console.log('- logs/*.log: Logs individuais dos workers');
console.log('- logs/pids/*.pid: Arquivos de PID dos processos');

console.log('\n💡 DICAS:');
console.log('- Se os workers ainda pararem, verifique os logs de erro');
console.log('- O monitoramento reinicia automaticamente workers parados');
console.log('- Mantenha o Redis rodando para o funcionamento correto');
console.log('- Evite deixar terminais rodando por dias sem supervisão');