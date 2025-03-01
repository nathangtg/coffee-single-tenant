import { defineConfig } from '@playwright/test';

export default defineConfig({
  use: {
    headless: false,
    actionTimeout: 20000,
    navigationTimeout: 30000,
  },
  reporter: [['html', { outputFolder: 'playwright-report' }]],
});
