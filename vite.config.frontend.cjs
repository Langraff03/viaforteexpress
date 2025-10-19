const { defineConfig } = require('vite');
const react = require('@vitejs/plugin-react');
const path = require('path');

// https://vitejs.dev/config/
module.exports = defineConfig({
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