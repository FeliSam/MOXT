import { expect, test } from '@playwright/test'
import { E2E_LISTING_ID } from './fixtures.js'
import { expectAxeSerious, expectNoHorizontalOverflow, loginAs } from './helpers.js'

test.describe('Parcours métier', () => {
  test('navigue sans recharger le document', async ({ page }) => {
    await loginAs(page)
    const marker = await page.evaluate(() => {
      window.__moxtSpaMarker = crypto.randomUUID()
      return window.__moxtSpaMarker
    })

    await page
      .getByRole('navigation', { name: 'Navigation principale' })
      .getByRole('link', { name: 'Transfert', exact: true })
      .click()
    await expect(page).toHaveURL(/\/transfers$/)
    await expect(page.getByRole('heading', { name: 'Créer un transfert', level: 1 })).toBeVisible()
    await expect.poll(() => page.evaluate(() => window.__moxtSpaMarker)).toBe(marker)

    await page
      .getByRole('navigation', { name: 'Navigation principale' })
      .getByRole('link', { name: 'Marketplace', exact: true })
      .click()
    await expect(page).toHaveURL(/\/marketplace$/)
    await expect.poll(() => page.evaluate(() => window.__moxtSpaMarker)).toBe(marker)
  })

  test('conserve le thème sombre après rechargement', async ({ page }) => {
    await loginAs(page)
    await page.getByRole('button', { name: 'Activer le thème sombre' }).click()
    await expect(page.locator('html')).toHaveClass(/dark/)
    await page.reload()
    await expect(page.locator('html')).toHaveClass(/dark/)
    await page.screenshot({ path: 'test-results/dashboard-dark.png', fullPage: false })
  })

  test('recherche une annonce, ouvre les filtres et la fiche', async ({ page }) => {
    await loginAs(page)
    await page.goto('/marketplace')
    await expect(page.getByRole('heading', { name: 'Marketplace', level: 1 })).toBeVisible()
    await page.getByLabel('Rechercher', { exact: true }).fill('Smartphone')
    await expect(page.getByText('Smartphone double SIM').first()).toBeVisible()
    await page.getByRole('button', { name: 'Filtres' }).click()
    await expect(page.getByText('Filtres avancés')).toBeVisible()

    await page.goto(`/marketplace/${E2E_LISTING_ID}`)
    await expect(page.getByRole('heading', { name: 'Smartphone double SIM', level: 1 })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Livraison et garantie' })).toBeVisible()
    await page.getByRole('tab', { name: 'Livraison et garantie' }).click()
    await expectNoHorizontalOverflow(page)
  })

  test('ouvre la publication d’annonce', async ({ page }) => {
    await loginAs(page)
    await page.goto('/marketplace')
    await page.getByRole('button', { name: 'Publier une annonce' }).click()
    await expect(page).toHaveURL(/\/marketplace\/publish/)
    await expect(page.getByRole('heading', { name: 'Publier une annonce', level: 1 })).toBeVisible()
  })

  test('masque les catégories de favoris à zéro', async ({ page }) => {
    await loginAs(page)
    await page.goto('/favorites')
    await expect(page.getByRole('heading', { name: /favoris/i, level: 1 })).toBeVisible()
    const chips = page.getByRole('tablist')
    await expect(chips.getByRole('tab', { name: /Tous \(2\)/ })).toBeVisible()
    await expect(chips.getByRole('tab', { name: /Annonces \(1\)/ })).toBeVisible()
    await expect(chips.getByRole('tab', { name: /Autres \(1\)/ })).toBeVisible()
    await expect(chips.getByRole('tab', { name: /Colis/ })).toHaveCount(0)
    await expect(chips.getByRole('tab', { name: /Jobs/ })).toHaveCount(0)
  })

  test('un administrateur ouvre les files et la couverture fonctionnelle', async ({ page }) => {
    await loginAs(page, 'admin')
    await page.goto('/admin')
    await expect(page.getByRole('heading', { name: /Centre de controle/i, level: 1 })).toBeVisible()
    await page.getByRole('button', { name: /Files d'action/ }).click()
    await expect(page).toHaveURL(/view=queues/)

    await page.goto('/feature-matrix')
    await expect(page.getByRole('heading', { name: 'Couverture fonctionnelle', level: 1 })).toBeVisible()
    await expect(page.getByText('Partiel', { exact: true })).toHaveCount(0)
    await expect(page.getByText('Planifié', { exact: true })).toHaveCount(0)
    const qualityRow = page.locator('div.flex.items-center.justify-between').filter({
      hasText: 'Validation automatisée et E2E métier',
    })
    await expect(qualityRow.getByText('Complet', { exact: true })).toBeVisible()
  })

  test('dashboard authentifié : a11y et pas de débordement', async ({ page }) => {
    await loginAs(page)
    await expectAxeSerious(page)
    await expectNoHorizontalOverflow(page)
    await page.screenshot({ path: 'test-results/dashboard-light.png', fullPage: false })
  })
})
