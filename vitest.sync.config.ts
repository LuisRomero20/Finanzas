import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    include: ['src/utils/__tests__/settingsSync.test.tsx', 'src/utils/__tests__/settingsSnapshot.test.ts', 'src/utils/__tests__/budgetModes.test.tsx', 'src/utils/__tests__/transactionOutbox.test.ts', 'src/utils/__tests__/creditCardCycles.test.ts', 'src/utils/__tests__/creditCardInstallments.test.ts', 'src/utils/__tests__/pagesRender.test.tsx'],
    setupFiles: ['src/utils/__tests__/setupOfflineSync.ts'],
  },
});
