import { defineConfig, devices } from '@playwright/test'
import { resolve } from 'node:path'

process.env.PLAYWRIGHT_BROWSERS_PATH ||= resolve('.playwright-browsers')

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:4180',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'set PORT=4180&& node scripts/serve-dist.mjs',
    url: 'http://127.0.0.1:4180',
    reuseExistingServer: false,
  },
})
