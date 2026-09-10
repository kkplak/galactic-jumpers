import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import { offlineBuild } from './scripts/offline-build.mjs';

export default defineConfig({
  base: '/',
  plugins: [react(), offlineBuild()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  server: { port: 5173, strictPort: true },
  preview: { port: 4173, strictPort: true },
  build: { outDir: 'dist', emptyOutDir: true, target: 'es2022' },
});
