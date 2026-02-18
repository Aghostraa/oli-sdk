import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/react.ts', 'src/attest.entry.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  splitting: false,
  // Bundle js-yaml for browser compatibility
  noExternal: ['js-yaml'],
  platform: 'browser',
  target: 'es2020',
  minify: false,
  treeshake: true,
});
