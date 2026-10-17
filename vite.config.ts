import { defineConfig } from 'vite';
export default defineConfig({
  // Three already ships browser ESM. Avoid ancestor-directory scanning by the prebundler.
  optimizeDeps: { exclude: ['three'], noDiscovery: true },
});
