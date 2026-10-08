import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@shared': fileURLToPath(new URL('../shared', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    proxy: { '/api': 'http://localhost:5050' },
    fs: { allow: ['..'] },
  },
  preview: {
    proxy: { '/api': 'http://localhost:5050' },
  },
  css: {
    preprocessorOptions: { scss: { api: 'modern-compiler' } },
  },
});
