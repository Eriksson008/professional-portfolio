import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Dev/preview default to 8789 to match the Docker/production port.
export default defineConfig({
  plugins: [react()],
  server: { port: 8789, host: true },
  preview: { port: 8789, host: true },
});
