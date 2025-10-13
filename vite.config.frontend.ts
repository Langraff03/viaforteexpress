import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
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
      },
      // Excluir arquivos do backend do build
      external: [
        'bullmq',
        'ioredis',
        'express',
        'nodemailer',
        'puppeteer',
        'redis'
      ]
    }
  },
  server: {
    // Desabilita os avisos de source map
    hmr: {
      overlay: false
    }
  },
  resolve: {
    alias: [
      {
        // mapeia @/ → src/
        find: '@',
        replacement: path.resolve(__dirname, 'src')
      }
    ]
  },
  define: {
    'process.env.NODE_ENV': '"production"',
    'process.env': {}
  }
});