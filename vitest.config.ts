import { defineConfig, configDefaults } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['src/utils/__tests__/setupOfflineSync.ts'],
    exclude: [...configDefaults.exclude, '**/*.integration.test.ts'],
  },
});
