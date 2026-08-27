import { defineConfig, devices } from '@playwright/test'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

process.env.PLAYWRIGHT_BROWSERS_PATH ||= resolve('.playwright-browsers')

const distReady = existsSync(resolve('dist/index.html'))
const useVite = Boolean(process.env.E2E_DEV) || !distReady

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  workers: 2,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:4180',
    locale: 'fr-FR',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome',
      },
    },
  ],
  webServer: {
    command: useVite
      ? 'node ../node_modules/vite/bin/vite.js --host 127.0.0.1 --port 4180 --strictPort'
      : 'node scripts/serve-dist.mjs',
    url: 'http://127.0.0.1:4180',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      ...process.env,
      PORT: '4180',
    },
  },
})
