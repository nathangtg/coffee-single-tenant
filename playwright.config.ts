import { defineConfig } from '@playwright/test';

/**
 * Playwright configuration optimized for application demos
 * 
 * Features:
 * - Visible browser with reasonable viewport size
 * - Controlled execution speed for better visibility
 * - Video recording of test runs
 * - Screenshot on failure
 * - Comprehensive reporting
 */
export default defineConfig({
  testDir: './tests',
  timeout: 60000,
  expect: {
    timeout: 10000,
  },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [
    ['html', { open: 'never', outputFolder: 'demo-report' }],
    ['list'] // Shows progress in console
  ],
  use: {
    // Browser settings
    headless: false,
    viewport: { width: 1280, height: 800 },

    // Execution control
    actionTimeout: 15000,
    navigationTimeout: 30000,
    launchOptions: {
      slowMo: 300, // Slow enough to see actions but not too slow
    },

    // Demo enhancements
    video: { mode: 'on', size: { width: 1280, height: 800 } },
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',

    // User experience improvements
    ignoreHTTPSErrors: true,
    colorScheme: 'light', // Better for demos/presentations

  },
  // Demo-specific projects
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],
});