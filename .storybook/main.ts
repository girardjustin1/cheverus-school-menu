import type { StorybookConfig } from '@storybook/react-vite';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const mocks = new Map([
  [resolve(root, 'src/lib/repository'), resolve(root, '.storybook/mocks/repository.ts')],
  [resolve(root, 'src/features/auth/AuthProvider'), resolve(root, '.storybook/mocks/auth.tsx')],
]);

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.tsx'],
  framework: '@storybook/react-vite',
  staticDirs: ['../public'],
  viteFinal: (config) => {
    if (process.env.STORYBOOK_BASE_PATH) config.base = process.env.STORYBOOK_BASE_PATH;
    config.cacheDir = resolve(root, '.cache/storybook-vite');
    config.plugins = [
      ...(config.plugins || []),
      {
        name: 'cheverus-storybook-prototype',
        enforce: 'pre',
        resolveId(source, importer) {
          if (source === '@netlify/identity') return resolve(root, '.storybook/mocks/identity.ts');
          if (!importer || !source.startsWith('.')) return;
          return mocks.get(
            resolve(dirname(importer.split('?')[0]), source).replace(/\.[jt]sx?$/, ''),
          );
        },
      },
    ];
    return config;
  },
};
export default config;
