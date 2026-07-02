import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Base path is env-driven so the same build works in two places:
//   • Docker / nginx and local dev  → served at "/"        (default)
//   • GitHub Pages project site     → served at "/professional-portfolio/"
// The Pages workflow sets VITE_BASE; nothing else has to change.
const base = process.env.VITE_BASE ?? '/';

// Dev/preview default to 8790 to match the Docker/production port (this app's family port).
export default defineConfig({
  base,
  plugins: [react()],
  server: { port: 8790, host: true },
  preview: { port: 8790, host: true },
  build: {
    // The WebGL backdrop chunk (three + R3F) is intentionally large and lazy —
    // it is only fetched on capable desktops after idle. Keep the warning
    // threshold above it so genuine main-bundle regressions still surface.
    chunkSizeWarningLimit: 950,
  },
});
