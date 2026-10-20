import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
export default defineConfig({
  // Three already ships browser ESM. Avoid ancestor-directory scanning by the prebundler.
  optimizeDeps: { exclude: ['three'], noDiscovery: true },
  build: { rollupOptions: { input: {
    main: fileURLToPath(new URL('./index.html', import.meta.url)),
    situations: fileURLToPath(new URL('./p61.html', import.meta.url)),
    physics: fileURLToPath(new URL('./physics.html', import.meta.url)),
    force: fileURLToPath(new URL('./ver.force.html', import.meta.url)),
    noforce: fileURLToPath(new URL('./ver.noforce.html', import.meta.url)),
  } } },
});
