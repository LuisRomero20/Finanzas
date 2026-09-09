import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
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
