import { expect, test } from '@playwright/test'
import { loginAs } from './helpers.js'

test('navigue entre les routes sans recharger le document', async ({ page }) => {
  await loginAs(page)
  const documentMarker = await page.evaluate(() => {
    window.__moxtSpaMarker = crypto.randomUUID()
    return window.__moxtSpaMarker
  })

  await page
    .getByRole('navigation', { name: 'Navigation principale' })
    .getByRole('link', { name: 'Transfert', exact: true })
    .click()

  await expect(page).toHaveURL(/\/transfers$/)
  await expect(page.getByRole('heading', { name: 'Créer un transfert', level: 1 })).toBeVisible()
  await expect.poll(() => page.evaluate(() => window.__moxtSpaMarker)).toBe(documentMarker)

  await page
    .getByRole('navigation', { name: 'Navigation principale' })
    .getByRole('link', { name: 'Marketplace', exact: true })
    .click()

  await expect(page).toHaveURL(/\/marketplace$/)
  await expect.poll(() => page.evaluate(() => window.__moxtSpaMarker)).toBe(documentMarker)
})

test('conserve le theme et accepte une route directe', async ({ page }) => {
  await loginAs(page)
  await page.getByRole('button', { name: 'Activer le thème sombre' }).click()
  await expect(page.locator('html')).toHaveClass(/dark/)

  await page.reload()
  await expect(page.locator('html')).toHaveClass(/dark/)

  await page.goto('/marketplace')
  await expect(page.getByRole('heading', { name: 'Marketplace', level: 1 })).toBeVisible()
  await expect(page).toHaveURL(/\/marketplace$/)
})
