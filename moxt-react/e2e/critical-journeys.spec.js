import { expect, test } from '@playwright/test'

async function login(page, email = 'user@demo.com') {
  await page.goto('/login')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await page.getByLabel(/email/i).fill(email)
  await page.getByLabel(/mot de passe/i).fill('123456')
  await page.getByRole('button', { name: 'Se connecter' }).click()
}

test('ouvre l assistant MOXT et obtient une action locale', async ({ page }) => {
  await login(page)
  await page.goto('/messages')
  await expect(page.getByRole('heading', { name: 'Assistant MOXT' })).toBeVisible()
  await page.getByPlaceholder(/Demandez quelque chose/i).fill('Je cherche une annonce')
  await page.getByRole('button', { name: /Envoyer à l.assistant/i }).click()
  await expect(
    page.getByRole('link', { name: /Ouvrir la rubrique|Recherche globale/ }),
  ).toBeVisible()
})

test('accède aux outils de communauté sans rechargement', async ({ page }) => {
  await login(page)
  await page.goto('/jobs')
  await page.getByRole('button', { name: 'Gérer les demandes de job' }).click()
  await expect(page).toHaveURL(/\/jobs\/applications$/)
  await expect(page.getByRole('heading', { name: 'Demandes de job' })).toBeVisible()
  await page.goto('/events')
  await page.getByRole('button', { name: 'Gérer les inscriptions' }).click()
  await expect(page.getByRole('heading', { name: 'Participants inscrits' })).toBeVisible()
})

test('ouvre les formulaires de publication dans des modales', async ({ page }) => {
  await login(page)
  await page.goto('/marketplace')
  await page.getByRole('button', { name: 'Publier une annonce' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Publier une annonce' })).toBeVisible()
})

test('recherche dans les catalogues et ouvre les filtres avances', async ({ page }) => {
  await login(page)
  await page.goto('/marketplace')
  await page.getByLabel('Rechercher', { exact: true }).fill('Smartphone')
  await expect(page.getByRole('heading', { name: 'Smartphone double SIM' })).toBeVisible()
  await page.getByRole('button', { name: 'Recherche avancée' }).click()
  await expect(page.getByLabel('Prix minimum')).toBeVisible()
})

test('affiche une fiche détaillée enrichie', async ({ page }) => {
  await login(page)
  await page.goto('/marketplace/ANN-DEMO-1')
  await expect(page.getByRole('tab', { name: 'Livraison et garantie' })).toBeVisible()
  await page.getByRole('tab', { name: 'Caractéristiques' }).click()
  await expect(page.getByText('Dual Connect 5G')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Faire une offre' })).toBeVisible()
  await expect(page.getByText(/consultations/i)).toBeVisible()
})

test('un administrateur ouvre les files de contrôle', async ({ page }) => {
  await login(page, 'admin@demo.com')
  await page.goto('/admin')
  await expect(page.getByRole('heading', { name: /Centre d'administration/ })).toBeVisible()
  await page.getByRole('button', { name: /Files de contrôle/ }).click()
  await expect(page.getByRole('heading', { name: 'Vérifications' })).toBeVisible()
})
