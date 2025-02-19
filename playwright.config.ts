import { defineConfig } from '@playwright/test';

export default defineConfig({
  use: {
    headless: true,
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },
  reporter: [['html', { outputFolder: 'playwright-report' }]], 
});
