import assert from 'node:assert/strict'
import { createReadStream, existsSync, statSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join, normalize } from 'node:path'
import { chromium } from 'playwright'

const root = normalize(join(import.meta.dirname, '..', 'dist'))
const port = 4181
const baseURL = `http://127.0.0.1:${port}`
const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
}

const server = createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, baseURL).pathname)
  const requestedPath = normalize(join(root, pathname))
  const safePath = requestedPath.startsWith(root) ? requestedPath : root
  const filePath =
    existsSync(safePath) && statSync(safePath).isFile() ? safePath : join(root, 'index.html')

  response.setHeader('Content-Type', mimeTypes[extname(filePath)] || 'application/octet-stream')
  createReadStream(filePath).pipe(response)
})

await new Promise((resolve) => server.listen(port, '127.0.0.1', resolve))
async function launchBrowser() {
  try {
    return await chromium.launch({ headless: true })
  } catch (error) {
    const message = String(error?.message || error)
    if (!message.includes("Executable doesn't exist")) throw error
    return chromium.launch({ channel: 'chrome', headless: true })
  }
}

const browser = await launchBrowser()

async function login(page, email = 'user@demo.com') {
  await page.goto(`${baseURL}/login`)
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await page.getByLabel(/email/i).fill(email)
  await page.getByLabel(/mot de passe/i).fill('123456')
  await page.getByRole('button', { name: 'Se connecter' }).click()
  await page.waitForURL('**/dashboard')
}

try {
  const page = await browser.newPage()
  await login(page)
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.waitForTimeout(250)
  await page.getByLabel('Recherche rapide').fill('Smartphone')
  await page
    .locator('section')
    .filter({ has: page.getByLabel('Recherche rapide') })
    .getByRole('link', { name: /Smartphone double SIM/ })
    .waitFor()
  await page.screenshot({ path: 'test-results/dashboard-search-overlay.png', fullPage: false })
  await page.getByRole('button', { name: 'Effacer la recherche' }).click()
  assert.equal(await page.getByLabel('Recherche globale').count(), 0)
  assert.equal(
    await page.locator('header').evaluate((node) => getComputedStyle(node).position),
    'sticky',
  )
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await page.waitForFunction(() =>
    document.querySelector('header')?.className.includes('-translate-y-'),
  )
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.waitForFunction(
    () => !document.querySelector('header')?.className.includes('-translate-y-'),
  )
  await page.getByRole('button', { name: 'Plus', exact: true }).click()
  await page.getByRole('heading', { name: 'Tous les services' }).waitFor()
  await page.getByRole('button', { name: 'Fermer', exact: true }).click()
  await page.screenshot({ path: 'test-results/dashboard-light.png', fullPage: true })
  const marker = await page.evaluate(() => {
    window.__moxtSpaMarker = crypto.randomUUID()
    return window.__moxtSpaMarker
  })

  await page
    .getByRole('navigation', { name: 'Navigation principale' })
    .getByRole('link', { name: 'Transferts', exact: true })
    .click()
  await page.waitForURL('**/transfers')
  await page.getByRole('heading', { name: /Créer un transfert/, level: 1 }).waitFor()
  assert.equal(await page.evaluate(() => window.__moxtSpaMarker), marker)

  await page.getByRole('button', { name: 'Calculatrice' }).click()
  await page
    .getByRole('dialog')
    .getByRole('heading', { name: /Calculatrice/ })
    .waitFor()
  await page.getByRole('button', { name: 'Fermer', exact: true }).click()

  await page.goto(`${baseURL}/profile`)
  await page.getByRole('link', { name: /Données locales/ }).click()
  await page.waitForURL('**/local-data')
  await page.getByRole('heading', { name: 'Données locales', level: 1 }).waitFor()
  await page.getByText('Version du schéma').waitFor()
  await page.goto(`${baseURL}/profile`)
  await page.getByRole('link', { name: /Informations personnelles/ }).click()
  await page.waitForURL('**/profile/information')
  await page.getByRole('heading', { name: 'Informations personnelles', level: 1 }).waitFor()

  await page.goto(`${baseURL}/favorites`)
  await page.getByRole('button', { name: 'Ajouter un profil de transfert' }).click()
  await page.getByLabel('Prénom', { exact: true }).fill('Nadia')
  await page.getByLabel('Nom', { exact: true }).fill('Demo')
  await page.getByLabel('Numéro de téléphone').fill('+2290190000004')
  await page.getByLabel('Réseau mobile').selectOption('MTN MoMo')
  await page.getByRole('button', { name: 'Enregistrer le profil' }).click()
  await page.getByText('Nadia Demo').waitFor()

  await page.goto(`${baseURL}/transfers/new`)
  await page.getByLabel('Montant envoyé en XOF').fill('50000')
  await page.getByLabel('Entreprise partenaire').selectOption({ index: 1 })
  await page.getByText('Total à payer', { exact: true }).waitFor()
  await page.getByRole('button', { name: 'Continuer' }).click()
  await page.getByRole('button', { name: /Nadia Demo/ }).waitFor()

  await page.goto(`${baseURL}/transfers`)
  await page
    .getByRole('navigation', { name: 'Navigation principale' })
    .getByRole('link', { name: 'Marketplace', exact: true })
    .click()
  await page.waitForURL('**/marketplace')

  await page.getByRole('button', { name: 'Activer le thème sombre' }).click()
  await page.waitForFunction(() => document.documentElement.classList.contains('dark'))
  assert.match((await page.locator('html').getAttribute('class')) || '', /dark/)
  await page.waitForTimeout(250)
  await page.screenshot({ path: 'test-results/dashboard-dark.png', fullPage: true })
  await page.reload()
  await page.waitForFunction(() => document.documentElement.classList.contains('dark'))
  assert.match((await page.locator('html').getAttribute('class')) || '', /dark/)

  await page.goto(`${baseURL}/marketplace`)
  await page.getByRole('heading', { name: 'Marketplace', level: 1 }).waitFor()
  await page.getByLabel('Rechercher', { exact: true }).fill('Smartphone')
  await page.getByRole('heading', { name: 'Smartphone double SIM' }).waitFor()
  await page.getByRole('button', { name: 'Recherche avancée' }).click()
  await page.getByLabel('Ville').waitFor()
  await page.getByRole('button', { name: 'Tout effacer' }).click()
  await page.getByRole('button', { name: 'Publier une annonce' }).click()
  await page.getByRole('dialog').waitFor()
  await page.getByRole('button', { name: 'Fermer', exact: true }).click()
  await page.goto(`${baseURL}/marketplace/ANN-DEMO-1`)
  await page.getByRole('tab', { name: 'Caractéristiques' }).click()
  await page.getByText('Dual Connect 5G').waitFor()
  await page.getByRole('button', { name: 'Faire une offre' }).click()
  await page.getByRole('dialog').waitFor()
  await page.getByRole('button', { name: 'Fermer', exact: true }).click()
  await page.screenshot({ path: 'test-results/listing-detail.png', fullPage: true })

  await page.goto(`${baseURL}/parcels`)
  await page.getByLabel('Rechercher', { exact: true }).fill('Russie')
  await page.getByText(/résultat\(s\)/).waitFor()
  await page.getByRole('button', { name: 'Recherche avancée' }).click()
  await page.getByLabel(/D[ée]part/).waitFor()
  await page.screenshot({ path: 'test-results/parcels-search.png', fullPage: true })
  await page.getByRole('button', { name: 'Publier un voyage' }).click()
  await page.getByRole('dialog').waitFor()
  await page.getByRole('button', { name: 'Fermer', exact: true }).click()

  await page.goto(`${baseURL}/messages`)
  await page.getByRole('heading', { name: 'Conversations' }).waitFor()
  await page.screenshot({ path: 'test-results/messages-list-desktop.png', fullPage: true })
  await page.getByRole('button', { name: /Assistant MOXT/ }).click()
  await page.getByRole('heading', { name: 'Assistant MOXT' }).waitFor()
  await page.getByLabel('Ouvrir mon profil').waitFor()
  await page.screenshot({ path: 'test-results/messages-conversation-desktop.png', fullPage: true })
  await page.getByPlaceholder(/Demandez quelque chose/i).fill('Je cherche une annonce')
  await page.getByRole('button', { name: /Envoyer à l.assistant/i }).click()
  await page.getByRole('link', { name: /Ouvrir la rubrique|Recherche globale/ }).waitFor()

  await page.goto(`${baseURL}/jobs/applications`)
  await page.getByRole('heading', { name: 'Demandes de job' }).waitFor()

  const adminPage = await browser.newPage()
  await login(adminPage, 'admin@demo.com')
  await adminPage.goto(`${baseURL}/admin`)
  await adminPage.getByRole('heading', { name: /Centre d'administration/ }).waitFor()
  await adminPage.getByRole('button', { name: /Files de contrôle/ }).click()
  await adminPage.getByRole('heading', { name: 'Vérifications' }).waitFor()
  await adminPage.close()

  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`${baseURL}/dashboard`)
  await page.getByRole('button', { name: 'Ouvrir la navigation' }).click()
  const mobileMenu = page.getByRole('navigation', { name: 'Navigation principale' })
  await mobileMenu.waitFor()
  assert.equal(await mobileMenu.getByRole('link', { name: 'Marketplace', exact: true }).count(), 0)
  assert.equal(
    await mobileMenu.getByRole('link', { name: 'Notifications', exact: true }).count(),
    0,
  )
  assert.equal(
    await mobileMenu.getByRole('link', { name: 'GÃ©rer les demandes', exact: true }).count(),
    0,
  )
  await page
    .getByRole('complementary')
    .getByRole('button', { name: 'Fermer la navigation' })
    .click()
  await page.waitForFunction(() =>
    document.querySelector('aside')?.classList.contains('-translate-x-full'),
  )
  await page
    .getByRole('navigation', { name: 'Navigation mobile rapide' })
    .getByRole('link', { name: 'Market', exact: true })
    .waitFor()
  await page.goto(`${baseURL}/messages`)
  await page
    .getByRole('navigation', { name: 'Navigation mobile rapide' })
    .getByRole('link', { name: 'Message', exact: true })
    .waitFor()
  await page.getByRole('heading', { name: 'Conversations' }).waitFor()
  await page.screenshot({ path: 'test-results/messages-list-mobile.png', fullPage: true })
  await page.getByRole('button', { name: /Assistant MOXT/ }).click()
  await page.getByRole('heading', { name: 'Assistant MOXT' }).waitFor()
  assert.equal(await page.getByRole('navigation', { name: 'Navigation mobile rapide' }).count(), 0)
  await page.screenshot({ path: 'test-results/messages-mobile.png', fullPage: true })

  await page.goto(`${baseURL}/marketplace/ANN-DEMO-1`)
  await page.getByRole('heading', { name: 'Smartphone double SIM', level: 1 }).waitFor()
  assert.equal(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    true,
  )
  await page.screenshot({ path: 'test-results/listing-detail-mobile.png', fullPage: true })

  await page.goto(`${baseURL}/dashboard`)
  await page.locator('img[src*="/assets/services/"]').first().waitFor()
  await page.screenshot({ path: 'test-results/dashboard-3d-mobile.png', fullPage: true })

  await page.goto(`${baseURL}/businesses`)
  await page.getByRole('heading', { name: 'Annuaire professionnel' }).waitFor()
  assert.equal(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    true,
  )
  await page.screenshot({ path: 'test-results/businesses-mobile.png', fullPage: true })

  console.log(
    'E2E: SPA, recherches, filtres avances, theme, assistant, administration et mobile valides.',
  )
} finally {
  await browser.close()
  await new Promise((resolve) => server.close(resolve))
}
