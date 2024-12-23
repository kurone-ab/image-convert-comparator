import tailwindcss from '@tailwindcss/vite';
import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tsconfigPaths from 'vite-tsconfig-paths';

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
  },
};

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tsconfigPaths(), tailwindcss(), viteServerConfig],
  build: {
    rollupOptions: {
      input: {
        main: './index.html',
        jxl: 'wasm-vips/vips-jxl.wasm?init',
        heif: 'wasm-vips/vips-heif.wasm?init',
      },
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.names[0].endsWith('.wasm')) {
            return 'assets/[name][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        },
      },
    },
  },
  optimizeDeps: {
    exclude: ['wasm-vips'],
  },
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
});
