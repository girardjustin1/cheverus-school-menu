import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { realpathSync } from 'node:fs';

const root = dirname(fileURLToPath(import.meta.url));
const mocks = new Map([
  [resolve(root, 'src/lib/repository'), resolve(root, 'prototype/mocks/repository.ts')],
  [resolve(root, 'src/lib/api'), resolve(root, 'prototype/mocks/api.ts')],
  [resolve(root, 'src/features/auth/AuthProvider'), resolve(root, 'prototype/mocks/auth.tsx')],
  [resolve(root, 'src/features/email/actions'), resolve(root, 'prototype/mocks/email-actions.ts')],
]);

export default defineConfig({
  root: resolve(root, 'prototype'),
  cacheDir: resolve(root, '.cache/prototype-vite'),
  envDir: resolve(root, 'prototype'),
  envPrefix: 'LOCAL_PROTOTYPE_',
  publicDir: resolve(root, 'public'),
  plugins: [
    {
      name: 'cheverus-local-prototype-only',
      enforce: 'pre',
      resolveId(source, importer) {
        if (source === '@netlify/identity') return resolve(root, 'prototype/mocks/identity.ts');
        if (source.startsWith('@netlify/'))
          throw new Error('Cloud services cannot be imported into the local prototype.');
        if (!importer || !source.startsWith('.')) return;
        return mocks.get(
          resolve(dirname(importer.split('?')[0]), source).replace(/\.[jt]sx?$/, ''),
        );
      },
      configureServer(server) {
        server.middlewares.use((request, response, next) => {
          if (/^\/(api|\.netlify)(\/|$)/.test(request.url || '')) {
            response.statusCode = 403;
            response.setHeader('Content-Type', 'application/json');
            response.end(JSON.stringify({ error: 'This prototype has no backend connection.' }));
            return;
          }
          next();
        });
      },
    },
    react(),
  ],
  server: {
    host: '0.0.0.0',
    port: 5175,
    strictPort: true,
    fs: { allow: [root, realpathSync(resolve(root, 'node_modules'))] },
  },
  build: { outDir: resolve(root, 'dist-prototype'), emptyOutDir: true, chunkSizeWarningLimit: 650 },
});
