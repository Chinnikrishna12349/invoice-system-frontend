import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

export default defineConfig(({ mode }) => {
  // Load environment variables
  const env = loadEnv(mode, process.cwd(), '');

  return {
    server: {
      port: 3006,
      host: '0.0.0.0',
      strictPort: true,
      // Configure proxy for API requests
      proxy: {
        // Proxy API requests to the backend
        '^/api': {
          target: 'http://localhost:8081',
          changeOrigin: true
        },
        // Serve uploaded files
        '^/uploads': {
          target: 'http://localhost:8081',
          changeOrigin: true,
          rewrite: (path) => path
        }
      }
    },
    plugins: [react()],
    define: {
      'process.env': {
        VITE_API_URL: JSON.stringify(env.VITE_API_URL || 'http://localhost:8081/api/invoices'),
        VITE_UPLOAD_URL: JSON.stringify(env.VITE_UPLOAD_URL || 'http://localhost:8081/uploads'),
        GEMINI_API_KEY: JSON.stringify(env.GEMINI_API_KEY || ''),
        NODE_ENV: JSON.stringify(mode)
      }
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      }
    }
  };
});
