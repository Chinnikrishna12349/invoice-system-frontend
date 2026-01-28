import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

export default defineConfig(({ mode }) => {
  // Load environment variables
  const env = loadEnv(mode, process.cwd(), '');

  return {
    server: {
      port: 3005,
      host: '0.0.0.0',
      strictPort: true,
      // Configure proxy for API requests
      proxy: {
        // Proxy API requests to the backend
        '^/api': {
          target: 'http://localhost:8080',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, '')
        },
        // Serve uploaded files
        '^/uploads': {
          target: 'http://localhost:8080',
          changeOrigin: true,
          rewrite: (path) => path
        }
      }
    },
    plugins: [react()],
    define: {
      'process.env': {
        VITE_API_URL: JSON.stringify(env.VITE_API_URL || 'http://localhost:8080/api/invoices'),
        VITE_UPLOAD_URL: JSON.stringify(env.VITE_UPLOAD_URL || 'http://localhost:8080/uploads'),
        GEMINI_API_KEY: JSON.stringify(env.GEMINI_API_KEY || ''),
        NODE_ENV: JSON.stringify(mode)
      }
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      }
    },
    // Add middleware to handle file uploads in development
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        // Handle file uploads in development
        if (req.url?.startsWith('/uploads/')) {
          const filePath = path.join(__dirname, req.url);
          return fs.readFile(filePath, (err, data) => {
            if (err) {
              res.statusCode = 404;
              res.end('Not found');
              return;
            }
            // Set appropriate content type based on file extension
            if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) {
              res.setHeader('Content-Type', 'image/jpeg');
            } else if (filePath.endsWith('.png')) {
              res.setHeader('Content-Type', 'image/png');
            }
            res.end(data);
          });
        }
        next();
      });
    }
  };
});
