import { createClient } from '@supabase/supabase-js';

// ✅ CLIENTE FRONTEND SEGURO - Usa apenas ANON_KEY
// Este arquivo é bundled pelo Vite e exposto publicamente

<<<<<<< HEAD
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
=======
const supabaseUrl = (import.meta.env?.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL) as string;
const supabaseAnonKey = (import.meta.env?.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY) as string;
>>>>>>> 0f9b6501e96622621ca16e4187b05cd412977242

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ CONFIGURAÇÃO FRONTEND SUPABASE INCOMPLETA:');
  console.error('VITE_SUPABASE_URL:', supabaseUrl ? '✅ OK' : '❌ MISSING');
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ OK' : '❌ MISSING');
  throw new Error('VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY devem estar definidas');
}

// ✅ Exportar apenas cliente com ANON_KEY (seguro para frontend)
// Row Level Security (RLS) controlará o acesso aos dados
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ❌ NÃO exportar supabaseAdmin aqui!
// Para operações admin, use: src/lib/server/supabaseAdmin.ts (apenas backend)

// Log de inicialização (apenas em desenvolvimento)
if (import.meta.env.DEV) {
  console.log('✅ supabase inicializado (frontend com ANON_KEY)');
}