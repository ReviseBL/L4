import { defineConfig } from 'vite';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectDirectory = fileURLToPath(new URL('.', import.meta.url));
const titleKeyArtPath = resolve(projectDirectory, 'public/assets/branding/title-key-art.png');

export default defineConfig({
  base: './',
  define: {
    __TITLE_KEY_ART_AVAILABLE__: JSON.stringify(existsSync(titleKeyArtPath)),
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    // Phaser 3 is a complete game runtime; its production chunk is expected
    // to be larger than Vite's general-purpose 500 kB advisory threshold.
    chunkSizeWarningLimit: 1300,
  },
});
