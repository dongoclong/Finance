import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

// GitHub Pages serves the site from /<repo>/, so assets need that prefix there —
// but only there. Local dev and any root-domain host stay on '/'.
const base = process.env.GITHUB_PAGES === 'true' ? '/Finance/' : '/';

export default defineConfig({
  base,
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  server: { port: 5173, open: false },
});
