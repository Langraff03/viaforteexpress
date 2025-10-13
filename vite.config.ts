import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['bullmq', 'ioredis'],
    exclude: ['events'],
    esbuildOptions: {
      sourcemap: false
    }
  },
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        sourcemapExcludeSources: true
      }
    }
  },
  server: {
    // Desabilita os avisos de source map
    hmr: {
      overlay: false
    },
    // Proxy para redirecionar /api/* para o servidor webhook
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  resolve: {
    alias: [
      {
        // necessária para evitar erro no ioredis
        find: /^ioredis\/built\/utils$/,
        replacement: path.resolve(
          __dirname,
          'node_modules/ioredis/built/utils/index.js'
        )
      },
      {
        // mapeia @/ → src/
        find: '@',
        replacement: path.resolve(__dirname, 'src')
      }
    ]
  },
  // O bloco 'define' foi removido pois estava impedindo o carregamento
  // correto das variáveis de ambiente do Vite.
  // O Vite gerencia 'import.meta.env' automaticamente.
});
