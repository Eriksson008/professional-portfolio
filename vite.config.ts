import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';

// Base path is env-driven so the same build works in two places:
//   • Docker / nginx and local dev  → served at "/"        (default)
//   • GitHub Pages project site     → served at "/professional-portfolio/"
// The Pages workflow sets VITE_BASE; nothing else has to change.
const base = process.env.VITE_BASE ?? '/';

// Private Ask-Fredrik admin dashboard. It ships as a separate entry
// (admin/ask-fredrik/index.html → /admin/ask-fredrik/) so none of its code is
// bundled into the public site and it's never linked from the public nav. It's
// safe to publish — access is gated server-side by the Worker's ADMIN_TOKEN and
// the page only shows a token prompt without it — but the build can still be
// excluded entirely with ENABLE_ASK_DASHBOARD=false. Default: included.
const enableAdmin = process.env.ENABLE_ASK_DASHBOARD !== 'false';
const input: Record<string, string> = { main: resolve(__dirname, 'index.html') };
if (enableAdmin) {
  input.admin = resolve(__dirname, 'admin/ask-fredrik/index.html');
}

// Dev/preview default to 8790 to match the Docker/production port (this app's family port).
export default defineConfig({
  base,
  plugins: [react()],
  build: { rollupOptions: { input } },
  server: { port: 8790, host: true },
  preview: { port: 8790, host: true },
});
