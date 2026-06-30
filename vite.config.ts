import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Dev/preview default to 8790 to match the Docker/production port (this app's family port).
export default defineConfig({
  plugins: [react()],
  server: { port: 8790, host: true },
  preview: { port: 8790, host: true },
});
