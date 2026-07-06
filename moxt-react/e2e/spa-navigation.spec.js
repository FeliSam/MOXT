import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/login')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await page.getByRole('button', { name: 'Se connecter' }).click()
  await expect(page).toHaveURL(/\/dashboard$/)
})

test('navigue entre les routes sans recharger le document', async ({ page }) => {
  const documentMarker = await page.evaluate(() => {
    window.__moxtSpaMarker = crypto.randomUUID()
    return window.__moxtSpaMarker
  })

  await page.getByRole('link', { name: 'Transferts', exact: true }).click()

  await expect(page).toHaveURL(/\/transfers$/)
  await expect(page.getByRole('heading', { name: 'Transferts', level: 1 })).toBeVisible()
  await expect.poll(() => page.evaluate(() => window.__moxtSpaMarker)).toBe(documentMarker)

  await page.getByRole('link', { name: 'Marché', exact: true }).click()

  await expect(page).toHaveURL(/\/marketplace$/)
  await expect.poll(() => page.evaluate(() => window.__moxtSpaMarker)).toBe(documentMarker)
})

test('conserve le theme et accepte une route directe', async ({ page }) => {
  await page.getByRole('button', { name: 'Activer le theme sombre' }).click()
  await expect(page.locator('html')).toHaveClass(/dark/)

  await page.reload()
  await expect(page.locator('html')).toHaveClass(/dark/)

  await page.goto('/marketplace')
  await expect(page.getByRole('heading', { name: 'Marketplace' })).toBeVisible()
  await expect(page).toHaveURL(/\/marketplace$/)
})
