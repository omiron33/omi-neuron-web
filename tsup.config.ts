import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'visualization/index': 'src/visualization/index.ts',
    'api/index': 'src/api/index.ts',
    'cli/index': 'src/cli/index.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  splitting: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  external: ['react', 'react-dom', 'next', 'three'],
  esbuildOptions(options) {
    options.banner = {
      js: '"use client";',
    };
  },
});

