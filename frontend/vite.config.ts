import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Workshop: Always use /app/ base path (behind nginx proxy)
  // Production: Override with --base flag during build: vite build --base=/
  base: '/app/',
  server: {
    port: 5173,
    host: '0.0.0.0', // Allow external connections
    allowedHosts: true, // Allow all hosts (CloudFront, localhost, etc.)
    hmr: false, // Disable HMR - doesn't work through CloudFront/nginx proxy
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});