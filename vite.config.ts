import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const apiKey = process.env.GEMINI_API_KEY || '';

export default defineConfig({
  server: {
    port: 5000,
    host: '0.0.0.0',
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      }
    }
  },
  plugins: [react()],
  define: {
    'process.env.API_KEY': JSON.stringify(apiKey),
    'process.env.GEMINI_API_KEY': JSON.stringify(apiKey),
    'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(apiKey),
    'import.meta.env.VITE_API_KEY': JSON.stringify(apiKey)
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    }
  }
});
