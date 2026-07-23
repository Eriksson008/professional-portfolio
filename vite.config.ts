import { defineConfig } from 'vite';
import { cpSync } from 'node:fs';
import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';

// Base path is env-driven so the same build works in two places:
//   • Docker / nginx and local dev  → served at "/"        (default)
//   • GitHub Pages project site     → served at "/professional-portfolio/"
// The Pages workflow sets VITE_BASE; nothing else has to change.
const base = process.env.VITE_BASE ?? '/';

// Dev/preview default to 8790 to match the Docker/production port (this app's family port).
const server = { port: 8790, host: true };

export default defineConfig(({ mode }) => {
  // Private Ask-Fredrik admin dashboard (`npm run build:admin`): built as its
  // own artifact into the Worker's assets directory, where the Worker serves
  // it at /admin/ask-fredrik/ behind Cloudflare Access. It is deliberately NOT
  // part of the public build/Pages artifact; `vite dev` still serves the page
  // at /admin/ask-fredrik/ for local work (multi-page dev needs no input).
  if (mode === 'admin-worker') {
    const outDir = resolve(__dirname, 'cloudflare/ask-fredrik-worker/public');
    const input: Record<string, string> = {
      admin: resolve(__dirname, 'admin/ask-fredrik/index.html'),
    };
    return {
      base: '/',
      // The Worker-hosted dashboard is ALWAYS same-origin with its API. Force
      // both admin-related env vars empty so a local-dev value lingering in
      // .env (e.g. VITE_ASK_FREDRIK_ADMIN_URL=http://127.0.0.1:8787) can never
      // be baked into the deployed bundle.
      define: {
        'import.meta.env.VITE_ASK_FREDRIK_ADMIN_URL': '""',
        'import.meta.env.VITE_ASK_FREDRIK_API_URL': '""',
      },
      // Don't copy the whole public/ dir (site media, résumé, …) into the
      // Worker assets — just the admin icon set the admin page references.
      publicDir: false,
      plugins: [
        react(),
        {
          name: 'copy-admin-icons',
          closeBundle() {
            cpSync(resolve(__dirname, 'public/admin-icons'), resolve(outDir, 'admin-icons'), {
              recursive: true,
            });
            cpSync(
              resolve(__dirname, 'public/admin.webmanifest'),
              resolve(outDir, 'admin.webmanifest')
            );
          },
        },
      ],
      build: { outDir, emptyOutDir: true, rollupOptions: { input } },
      server,
      preview: server,
    };
  }

  const input: Record<string, string> = { main: resolve(__dirname, 'index.html') };
  return {
    base,
    plugins: [react()],
    build: { rollupOptions: { input } },
    server,
    preview: server,
  };
});
