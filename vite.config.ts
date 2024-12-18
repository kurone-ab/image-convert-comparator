import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react-swc';

const viteServerConfig: Plugin = {
  name: 'log-request-middleware',
  configureServer(server) {
    server.middlewares.use((_req, res, next) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET');
      res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
      res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
      next();
    });
  }
};

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), viteServerConfig],
  optimizeDeps: {
    exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util'],
  },
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
    fs: {
      allow: ['../..'],
    },
  },
});
