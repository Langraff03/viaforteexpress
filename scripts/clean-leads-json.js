// Script para limpar arquivo leads.json grande removendo emails inválidos
const fs = require('fs');

console.log('🔄 Iniciando limpeza do arquivo leads.json...');

// Ler arquivo original
const rawData = fs.readFileSync('scripts/leads.json', 'utf8');
const leads = JSON.parse(rawData);

console.log(`📊 Total de leads no arquivo original: ${leads.length}`);

// Filtrar leads válidos
const validLeads = leads.filter(lead => {
  // Remover emails inválidos
  if (!lead.email || lead.email.includes('@emailcliente.placeholder')) {
    return false;
  }
  
  // Verificar se tem nome e email válidos
  if (!lead.nome || !lead.email.includes('@')) {
    return false;
  }
  
  return true;
});

// Limpar nomes (remover caracteres especiais problemáticos)
const cleanedLeads = validLeads.map(lead => ({
  nome: lead.nome
    .replace(/[àáâãäå]/g, 'a')
    .replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i')
    .replace(/[òóôõö]/g, 'o')
    .replace(/[ùúûü]/g, 'u')
    .replace(/[ç]/g, 'c')
    .replace(/[ñ]/g, 'n')
    .trim(),
  email: lead.email.trim(),
  cpf: lead.cpf || ''
}));

console.log(`✅ Leads válidos após limpeza: ${cleanedLeads.length}`);
console.log(`❌ Leads removidos (emails inválidos): ${leads.length - cleanedLeads.length}`);

// Salvar arquivo limpo
fs.writeFileSync('leads-finais-limpos.json', JSON.stringify(cleanedLeads, null, 2), 'utf8');

const stats = fs.statSync('leads-finais-limpos.json');
const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);

console.log(`\n🎉 Arquivo limpo criado: leads-finais-limpos.json`);
console.log(`📊 Total de leads válidos: ${cleanedLeads.length}`);
console.log(`📏 Tamanho do arquivo: ${fileSizeMB}MB`);

// Mostrar amostra
console.log('\n📝 AMOSTRA DOS PRIMEIROS 3 LEADS LIMPOS:');
cleanedLeads.slice(0, 3).forEach((lead, index) => {
  console.log(`${index + 1}. ${lead.nome} - ${lead.email} - CPF: ${lead.cpf}`);
});

console.log('\n✅ Arquivo pronto para upload! Use: leads-finais-limpos.json');