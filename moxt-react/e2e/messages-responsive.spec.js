import { expect, test } from '@playwright/test'

async function login(page) {
  await page.goto('/login')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await page.getByLabel(/email/i).fill('user@demo.com')
  await page.getByLabel(/mot de passe/i).fill('123456')
  await page.getByRole('button', { name: 'Se connecter' }).click()
  await page.waitForURL('**/dashboard')
}

test('garde la messagerie integree sur un ecran mobile bas', async ({ page }) => {
  await login(page)
  await page.setViewportSize({ width: 390, height: 600 })
  await page.goto('/messages')

  await expect(page.getByTestId('messages-list')).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Navigation mobile rapide' })).toBeVisible()
  expect(
    await page.evaluate(() => document.documentElement.scrollHeight <= window.innerHeight),
  ).toBe(true)

  await page.getByRole('button', { name: /Assistant MOXT/ }).click()

  await expect(page.getByTestId('message-thread')).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Navigation mobile rapide' })).toHaveCount(0)
  await expect(page.locator('header.app-top-header')).toHaveCount(0)
  await expect(page.locator('.message-thread-header')).toBeVisible()
  expect(
    await page.evaluate(() => document.documentElement.scrollHeight <= window.innerHeight),
  ).toBe(true)

  const regions = await page.evaluate(() => {
    const scroll = document.querySelector('[data-testid="message-scroll-region"]')
    const composer = document.querySelector('[data-testid="message-composer"]')
    const scrollRect = scroll.getBoundingClientRect()
    const composerRect = composer.getBoundingClientRect()
    return {
      composerVisible: composerRect.bottom <= window.innerHeight && composerRect.top >= 0,
      scrollInsideThread: scrollRect.top >= 0 && scrollRect.bottom <= composerRect.top,
      scrollOverflow: getComputedStyle(scroll).overflowY,
    }
  })

  expect(regions).toEqual({
    composerVisible: true,
    scrollInsideThread: true,
    scrollOverflow: 'auto',
  })
})
