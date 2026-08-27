import { expect } from '@playwright/test'
import {
  E2E_ADMIN,
  E2E_EVENT,
  E2E_LISTING,
  E2E_USER,
  e2eAccountState,
  e2eSession,
} from './fixtures.js'

/** Keep in sync with `MOXT_CACHE_VERSION` in src/services/clearClientCache.js */
const E2E_CACHE_VERSION = '2026-08-03-auth-email-unblock'

export async function installE2eHarness(page, { user = null } = {}) {
  const session = user ? e2eSession(user) : null
  const account = user ? e2eAccountState(user.id) : e2eAccountState(E2E_USER.id)

  await page.addInitScript(
    ({ session, listing, event, account, cacheVersion }) => {
      window.__MOXT_E2E__ = true
      window.__MOXT_E2E_SESSION__ = session
      localStorage.setItem('MOXT_CACHE_VERSION', cacheVersion)
      localStorage.setItem('moxt-language', 'fr')
      if (!localStorage.getItem('moxt-theme')) {
        localStorage.setItem('moxt-theme', 'light')
      }
      if (session) {
        localStorage.setItem('moxt-listings-v1', JSON.stringify([listing]))
        localStorage.setItem('moxt-events-v1', JSON.stringify([event]))
        localStorage.setItem('moxt-account-v1', JSON.stringify(account))
      }
    },
    {
      session,
      listing: E2E_LISTING,
      event: E2E_EVENT,
      account,
      cacheVersion: E2E_CACHE_VERSION,
    },
  )
}

export async function loginAs(page, role = 'user') {
  const user = role === 'admin' ? E2E_ADMIN : E2E_USER
  await installE2eHarness(page, { user })
  await page.goto('/dashboard')
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 20_000 })
  await expect(page.locator('.moxt-app-loading')).toHaveCount(0, { timeout: 30_000 })
  await expect(page.locator('#main-content')).toBeVisible({ timeout: 20_000 })
}

export async function expectNoHorizontalOverflow(page) {
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1))
    .toBe(true)
}

export async function expectAxeSerious(page) {
  const { AxeBuilder } = await import('@axe-core/playwright')
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    // Contraste des libellés 10px muted : dette design-system, pas un trou de parcours.
    .disableRules(['color-contrast'])
    .analyze()
  const blocking = results.violations.filter(
    (item) => item.impact === 'critical' || item.impact === 'serious',
  )
  expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([])
}
