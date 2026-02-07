import { defineConfig } from '@playwright/test';

export default defineConfig({
  webServer: {
    command: 'npm run preview',
    port: 4321,
    timeout: 120000,
    reuseExistingServer: !process.env.CI,
  },
  use: {
    baseURL: 'http://localhost:4321',
  },
  testDir: 'tests/e2e',
});
