import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
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
      generateBundle() {
        const versionData = {
          version: currentBuildTime,
          builtAt: new Date().toISOString(),
        };
        this.emitFile({
          type: 'asset',
          fileName: 'version.json',
          source: JSON.stringify(versionData, null, 2),
        });
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
