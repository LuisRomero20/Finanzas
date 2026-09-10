import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

const currentBuildTime = Date.now().toString();

// https://vite.dev/config/
export default defineConfig({
  define: {
    __APP_BUILD_TIME__: JSON.stringify(currentBuildTime),
  },
  plugins: [
    react(),
    {
      name: 'generate-version-json',
      buildStart() {
        const versionData = {
          version: currentBuildTime,
          builtAt: new Date().toISOString(),
        };
        const publicDir = path.resolve(__dirname, 'public');
        if (!fs.existsSync(publicDir)) {
          fs.mkdirSync(publicDir, { recursive: true });
        }
        fs.writeFileSync(
          path.resolve(publicDir, 'version.json'),
          JSON.stringify(versionData, null, 2)
        );
      },
    },
  ],
  server: {
    host: true,
    port: 5173,
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'zustand', 'lucide-react'],
          'vendor-charts': ['recharts'],
          'vendor-excel': ['xlsx'],
          'vendor-pdf': ['pdfjs-dist'],
          'vendor-supabase': ['@supabase/supabase-js'],
        },
      },
    },
  },
});
