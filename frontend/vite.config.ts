import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/hotelapp/',
  server: {
    port: 5173,
    host: '0.0.0.0', // Allow external connections
    allowedHosts: true, // Allow all hosts (CloudFront, localhost, etc.)
    hmr: {
      clientPort: 5173, // Use clientPort for better CloudFront compatibility
    },
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