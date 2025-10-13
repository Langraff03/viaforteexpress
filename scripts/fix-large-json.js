// Script para corrigir arquivo leads.json grande
// Remove NaN, emails inválidos e cria arquivo limpo

const fs = require('fs');

console.log('🔄 Iniciando correção do arquivo leads.json...');

try {
  // Ler arquivo como texto primeiro para corrigir NaN
  let rawText = fs.readFileSync('scripts/leads.json', 'utf8');
  
  // Corrigir valores NaN inválidos
  rawText = rawText.replace(/"cpf":\s*NaN/g, '"cpf": ""');
  rawText = rawText.replace(/NaN/g, '""');
  
  // Agora fazer parse do JSON corrigido
  const leads = JSON.parse(rawText);
  
  console.log(`📊 Total de leads no arquivo original: ${leads.length}`);
  
  // Filtrar apenas leads válidos
  const validLeads = leads.filter(lead => {
    // Remover emails inválidos
    if (!lead.email || lead.email.includes('@emailcliente.placeholder')) {
      return false;
    }
    
    // Verificar email básico
    if (!lead.email.includes('@') || !lead.email.includes('.')) {
      return false;
    }
    
    // Verificar se tem nome
    if (!lead.nome || lead.nome.length < 2) {
      return false;
    }
    
    return true;
  });
  
  // Limpar dados
  const cleanedLeads = validLeads.map(lead => ({
    nome: lead.nome.trim(),
    email: lead.email.trim(),
    cpf: (lead.cpf || '').toString().replace(/[.\-\s]/g, '')
  }));
  
  console.log(`✅ Leads válidos: ${cleanedLeads.length}`);
  console.log(`❌ Leads removidos: ${leads.length - cleanedLeads.length}`);
  
  // Salvar arquivo final
  fs.writeFileSync('leads-completos-limpos.json', JSON.stringify(cleanedLeads, null, 2), 'utf8');
  
  const stats = fs.statSync('leads-completos-limpos.json');
  const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
  
  console.log(`\n🎉 SUCESSO!`);
  console.log(`📄 Arquivo criado: leads-completos-limpos.json`);
  console.log(`📊 Total de leads: ${cleanedLeads.length}`);
  console.log(`📏 Tamanho: ${fileSizeMB}MB`);
  
  console.log('\n📝 AMOSTRA DOS PRIMEIROS 3 LEADS:');
  cleanedLeads.slice(0, 3).forEach((lead, index) => {
    console.log(`${index + 1}. ${lead.nome} - ${lead.email} - CPF: ${lead.cpf}`);
  });
  
} catch (error) {
  console.error('❌ Erro:', error.message);
  console.log('\n💡 O problema era: valores NaN no JSON (inválido)');
  console.log('🔧 Solução: Use o arquivo leads-limpos.json que já funciona');
}