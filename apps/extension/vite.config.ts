import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

const extensionRoot = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(extensionRoot, '../..');
export default defineConfig(({ mode }) => {
    const env = { ...loadEnv(mode, repositoryRoot, 'VITE_'), ...loadEnv(mode, extensionRoot, 'VITE_'), ...process.env };
    const origin = new URL(env.VITE_SIDEWIRE_APP_URL ?? 'http://localhost:8000');
    if (origin.username || origin.password || origin.pathname !== '/' || origin.search || origin.hash || (origin.protocol !== 'https:' && !(origin.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(origin.hostname)))) throw new Error('VITE_SIDEWIRE_APP_URL must be an HTTPS origin (HTTP is permitted only for localhost development).');
    return {
        root: extensionRoot,
        envDir: repositoryRoot,
        define: { 'import.meta.env.VITE_SIDEWIRE_APP_URL': JSON.stringify(origin.origin) },
        plugins: [react(), tailwindcss(), { name: 'sidewire-api-permission', writeBundle() {
            const manifest = JSON.parse(fs.readFileSync(path.join(extensionRoot, 'public/manifest.json'), 'utf8')) as { host_permissions: string[] };
            manifest.host_permissions = [`${origin.origin}/*`];
            fs.writeFileSync(path.join(extensionRoot, 'dist/manifest.json'), `${JSON.stringify(manifest, null, 4)}\n`);
        } }],
        build: { emptyOutDir: true, outDir: 'dist', rollupOptions: {
            input: { sidepanel: path.join(extensionRoot, 'sidepanel.html'), 'service-worker': path.join(extensionRoot, 'src/background/service-worker.ts') },
            output: { entryFileNames: (chunk) => chunk.name === 'service-worker' ? 'service-worker.js' : 'assets/[name]-[hash].js', chunkFileNames: 'assets/[name]-[hash].js', assetFileNames: 'assets/[name]-[hash][extname]' },
        } },
    };
});
