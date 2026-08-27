import { expect, test } from '@playwright/test'
import { expectAxeSerious, expectNoHorizontalOverflow, installE2eHarness } from './helpers.js'

test.describe('Connexion publique', () => {
  test('affiche le formulaire, passe en mode e-mail et reste accessible', async ({ page }) => {
    await installE2eHarness(page)
    await page.goto('/login')
    await expect(page.locator('.moxt-app-loading')).toHaveCount(0, { timeout: 20_000 })
    await expect(page.getByRole('heading', { name: 'Connexion', level: 1 })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Se connecter' })).toBeVisible()

    await page.getByRole('button', { name: 'E-mail' }).click()
    await expect(page.getByLabel(/adresse e-mail/i)).toBeVisible()
    await expect(page.locator('#login-password')).toBeVisible()

    await expectNoHorizontalOverflow(page)
    await expectAxeSerious(page)
    await page.screenshot({ path: 'test-results/login-light.png', fullPage: true })
  })

  test('le lien Aller au contenu mène au main au clavier', async ({ page }) => {
    await installE2eHarness(page)
    await page.goto('/login')
    await expect(page.locator('.moxt-app-loading')).toHaveCount(0, { timeout: 20_000 })
    const skip = page.getByRole('link', { name: 'Aller au contenu' })
    await skip.focus()
    await expect(skip).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page.locator('#main-content')).toBeVisible()
  })
})
