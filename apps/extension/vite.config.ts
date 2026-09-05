import path from 'node:path';
import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const extensionRoot = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
    root: extensionRoot,
    plugins: [react(), tailwindcss()],
    build: {
        emptyOutDir: true,
        outDir: 'dist',
        rollupOptions: {
            input: {
                sidepanel: path.resolve(extensionRoot, 'sidepanel.html'),
                'service-worker': path.resolve(
                    extensionRoot,
                    'src/background/service-worker.ts',
                ),
            },
            output: {
                entryFileNames: (chunk) =>
                    chunk.name === 'service-worker'
                        ? 'service-worker.js'
                        : 'assets/[name]-[hash].js',
                chunkFileNames: 'assets/[name]-[hash].js',
                assetFileNames: 'assets/[name]-[hash][extname]',
            },
        },
    },
});
