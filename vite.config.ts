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
            // The admin page's og:image. It has to land at the Worker's root
            // rather than beside the page, because the URL in the tag is
            // absolute and points there â€” see admin/ask-fredrik/index.html.
            // Copied explicitly for the same reason the two above are:
            // publicDir is false, so nothing from public/ arrives on its own.
            //
            // The share wrapper travels with it. It is a public page that
            // previews the dashboard and bounces a person to /admin/ask-fredrik/;
            // Access is scoped to /admin, so /share is reachable as shipped and
            // nothing had to be exempted for it. All three files are plain
            // assets â€” they never enter the Vite graph, so a typo in a path
            // here is the only way they can go missing. Keep them together.
            for (const asset of ['og-ask-fredrik.png', 'share.html', 'share.css', 'share.js']) {
              cpSync(resolve(__dirname, `public/${asset}`), resolve(outDir, asset));
            }
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
