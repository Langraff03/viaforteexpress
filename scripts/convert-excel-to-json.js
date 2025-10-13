// Script para converter arquivo Excel de leads para formato JSON
// Remove emails inválidos e normaliza CPFs
// Processa TODOS os dados do arquivo Excel fornecido

const fs = require('fs');
const path = require('path');

// TODOS os dados extraídos do Excel (dados completos do arquivo)
const rawExcelData = [
  ["Kaimi Suyá", "kaimi.suya674@folha.com.br", "06140731119"],
  ["Carlos Barbosa Ferreira", "carlosbarbosaferreira463@yahoo.com.br", "17115361487"],
  ["Pedro Roberto Silveira", "26361115739@gmail.com", "88680819204"],
  ["KARINA LUIZA ALVES VIEIRA", "karina.luiza31@r7.com", "04256105603"],
  ["Lara Kurimori", "larakurimorii@gmail.com", "06567252146"],
  ["Rafael Pereira Barbosa", "rafaelpereirabarbosa376@uol.com.br", "95803975893"],
  ["Renata Bomfim Polli", "renata.bomfim933@mandic.com.br", "85672670725"],
  ["Valentina Santos Gomes", "valentinasantosgomes866@yahoo.com.br", "47705028506"],
  ["Manuela Fernandes Ferreira", "manuelafernandesferreira904@uol.com.br", "97684620436"],
  ["Arthur Gomes Oliveira", "arthurgomesoliveira39@hotmail.com", "73164214529"],
  ["Julia Costa Alves", "juliacostaalves129@uol.com.br", "44495261126"],
  ["João Rodrigues Carvalho", "joaorodriguescarvalho949@uol.com.br", "94955489508"],
  ["Thiago Fernandes Lopes", "thiagofernandeslopes796@outlook.com", "25350562320"],
  ["Helena Fernandes Martins", "helenafernandesmartins98@uol.com.br", "56988717102"],
  ["Vitória Fari", "vitoria.fari926@yahoo.com.br", "46654489810"],
  ["Maria Barbosa Silva", "mariabarbosasilva948@outlook.com", "65019268666"],
  ["Luiza Vieira Rodrigues", "luizavieirarodrigues292@yahoo.com.br", "38463828841"],
  ["Carla Silva", "carla.silva572@gmail.com", "38027383498"],
  ["Gabriel Ribeiro Rodrigues", "gabrielribeirorodrigues292@gmail.com", "23540367446"],
  ["Rafael Alves da Silva", "rs5233416@gmail.com", "09441331341"],
  ["João Mota", "jane.rodriguez23@icloud.com", "11711485349"],
  ["Anielle Rabelo Bezerra Bruzaca", "anielerabelo97@gmail.com", "60455249342"],
  ["Lucas Ribeiro Fernandes", "lucasribeirofernandes654@gmail.com", "79236202373"],
  ["Lucas Silva Costa", "lucassilvacosta969@hotmail.com", "08482120700"],
  ["OSVALDO FERREIRA MACIEL JUNIOR", "junior123gym@outlook.com", "12376034639"],
  ["Julia Soares Ferreira", "juliasoaresferreira612@yahoo.com.br", "65651670955"],
  ["Mariana Rodrigues Souza", "marianarodriguessouza565@yahoo.com.br", "89277527919"],
  ["Eduardo Diego Alexandre da Paz", "36372643316@gmail.com", "51176890204"],
  ["Felipe Soares Lima", "felipesoareslima90@gmail.com", "04614239951"],
  ["Luiza Barbosa Lima", "luizabarbosalima511@uol.com.br", "77332433605"],
  ["Lucas De Melo Paulino", "paulinofilho154@gmail.com", "13308796864"],
  ["Maria Rodrigues Oliveira", "mariarodriguesoliveira918@yahoo.com.br", "88710682112"],
  ["Carlos Lima Vieira", "carloslimavieira803@hotmail.com", "86479287410"]

// Função para limpar e normalizar CPF
function normalizeCPF(cpf) {
  if (!cpf) return '';
  
  // Remove pontos, traços e espaços
  const cleanCPF = cpf.toString().replace(/[.\-\s]/g, '');
  
  // Valida se tem 11 dígitos numéricos
  if (cleanCPF.length === 11 && /^\d+$/.test(cleanCPF)) {
    return cleanCPF;
  }
  
  return cpf.toString(); // Retorna original se não conseguir normalizar
}

// Função para validar email
function isValidEmail(email) {
  if (!email) return false;
  
  // Remove emails placeholder
  if (email.includes('@emailcliente.placeholder')) return false;
  
  // Validação básica de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Função para limpar nome
function cleanName(name) {
  if (!name) return '';
  
  return name.trim()
    .replace(/\s+/g, ' ') // Remove espaços extras
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

// Processar dados
function convertExcelToJSON() {
  console.log('🔄 Processando dados do Excel...');
  
  const lines = excelData.trim().split('\n');
  const leads = [];
  let validCount = 0;
  let invalidEmails = 0;
  let invalidCPFs = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Split por tab (dados do Excel)
    const parts = line.split('\t');
    if (parts.length < 3) continue;
    
    const nome = cleanName(parts[0]);
    const email = parts[1]?.trim();
    const cpf = parts[2]?.trim();
    
    // Validar email
    if (!isValidEmail(email)) {
      invalidEmails++;
      console.log(`❌ Email inválido: ${email} (linha ${i + 1})`);
      continue;
    }
    
    // Normalizar CPF
    const normalizedCPF = normalizeCPF(cpf);
    
    // Criar objeto lead
    const lead = {
      nome: nome,
      email: email,
      cpf: normalizedCPF
    };
    
    leads.push(lead);
    validCount++;
    
    if (validCount % 100 === 0) {
      console.log(`✅ Processados: ${validCount} leads válidos`);
    }
  }
  
  console.log('\n📊 RESUMO DO PROCESSAMENTO:');
  console.log(`✅ Leads válidos: ${validCount}`);
  console.log(`❌ Emails inválidos: ${invalidEmails}`);
  console.log(`📝 Total de linhas processadas: ${lines.length}`);
  
  return leads;
}

// Executar conversão
const leads = convertExcelToJSON();

// Salvar arquivo JSON
const outputPath = 'leads-convertidos.json';
fs.writeFileSync(outputPath, JSON.stringify(leads, null, 2), 'utf8');

console.log(`\n🎉 Arquivo JSON gerado: ${outputPath}`);
console.log(`📊 Total de leads válidos: ${leads.length}`);

// Mostrar amostra dos primeiros 5 leads
console.log('\n📝 AMOSTRA DOS LEADS CONVERTIDOS:');
console.log(JSON.stringify(leads.slice(0, 5), null, 2));

console.log('\n✅ Conversão concluída! O arquivo está pronto para upload no sistema.');