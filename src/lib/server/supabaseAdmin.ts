import { createClient } from '@supabase/supabase-js';

// ⚠️ ATENÇÃO: Este arquivo deve ser usado APENAS no backend!
// NÃO importar em componentes React, páginas ou hooks!
// Uso permitido: workers, webhook-server, scripts Node.js

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ CONFIGURAÇÃO BACKEND SUPABASE INCOMPLETA:');
  console.error('SUPABASE_URL:', supabaseUrl ? '✅ OK' : '❌ MISSING');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅ OK' : '❌ MISSING');
  throw new Error('SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY devem estar definidas para operações backend');
}

// Cliente admin com SERVICE_ROLE_KEY (ignora RLS)
// DEVE ser usado apenas em operações backend seguras
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Log de inicialização (apenas em desenvolvimento)
if (process.env.NODE_ENV !== 'production') {
  console.log('✅ supabaseAdmin inicializado (backend only)');
}