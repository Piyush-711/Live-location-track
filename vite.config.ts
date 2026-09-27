import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/v1': {
        target: 'http://localhost:8080',
        changeOrigin: true
      }
    }
  }
});
