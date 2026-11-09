import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: { entry: 'src/family-hub.ts', formats: ['es'], fileName: () => 'family-hub.js' },
    outDir: 'dist',
    emptyOutDir: true,
    assetsInlineLimit: 1_000_000,
    target: 'es2021',
    minify: 'esbuild'
  }
});
