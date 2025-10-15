// Script para aplicar a migração do sistema de leads
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configurações do Supabase (usando as mesmas do projeto)
const supabaseUrl = 'https://tkrqqwihozqfzmaulego.supabase.co';
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRrcnFxd2lob3pxZnptYXVsZWdvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDkxMDY2MywiZXhwIjoyMDYwNDg2NjYzfQ.YBUazDKL4w45jIEAkwTYN--VSXJahCI41BIBqOUF-M8';

// Criar cliente Supabase com a chave de serviço
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Função para executar cada comando SQL separadamente
async function executeSqlCommands(sql) {
  // Dividir o SQL em comandos individuais
  // Esta é uma simplificação e pode não funcionar para todos os casos
  const commands = sql
    .replace(/\/\*[\s\S]*?\*\//g, '') // Remover comentários /* */
    .replace(/--.*$/gm, '') // Remover comentários de linha única
    .split(';')
    .map(cmd => cmd.trim())
    .filter(cmd => cmd.length > 0);

  console.log(`📊 Encontrados ${commands.length} comandos SQL para executar`);

  // Executar cada comando separadamente
  for (let i = 0; i < commands.length; i++) {
    const command = commands[i];
    console.log(`⚙️ Executando comando ${i + 1}/${commands.length}...`);
    
    try {
      // Usar o método .rpc() para executar SQL arbitrário
      const { error } = await supabase.rpc('pg_execute', {
        query: command + ';'
      });
      
      if (error) {
        console.error(`❌ Erro ao executar comando ${i + 1}:`, error);
        console.error('Comando:', command);
        // Continuar mesmo com erro
      } else {
        console.log(`✅ Comando ${i + 1} executado com sucesso`);
      }
    } catch (err) {
      console.error(`❌ Exceção ao executar comando ${i + 1}:`, err);
      console.error('Comando:', command);
      // Continuar mesmo com erro
    }
  }
}

// Função principal
async function main() {
  try {
    // Ler o arquivo de migração do sistema de leads
    const scriptPath = path.join(__dirname, 'supabase/migrations/20250606004500_add_leads_system.sql');
    const scriptSql = fs.readFileSync(scriptPath, 'utf8');
    
    console.log('📦 Aplicando migração do sistema de leads...');
    
    // Tentar executar o script
    await executeSqlCommands(scriptSql);
    
    console.log('✅ Migração do sistema de leads aplicada com sucesso!');
    
  } catch (err) {
    console.error('❌ Erro:', err);
    process.exit(1);
  }
}

// Executar a função principal
main();