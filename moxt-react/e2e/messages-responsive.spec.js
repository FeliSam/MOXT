import { expect, test } from '@playwright/test'
import { loginAs } from './helpers.js'

test('garde la messagerie integree sur un ecran mobile bas', async ({ page }) => {
  await loginAs(page)
  await page.setViewportSize({ width: 390, height: 600 })
  await page.goto('/messages')

  await expect(page.getByTestId('messages-list')).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Navigation mobile rapide' })).toBeVisible()
  expect(
    await page.evaluate(() => document.documentElement.scrollHeight <= window.innerHeight + 80),
  ).toBe(true)
})
