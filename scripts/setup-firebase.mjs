#!/usr/bin/env node
/**
 * Assistant guidé Firebase → FCM Capacitor (com.moxt.app).
 *
 * Usage :
 *   npm run setup:firebase
 *   npm run setup:firebase -- --project=mon-projet-id
 *   npm run setup:firebase -- --yes   # moins de questions ; n’attend pas le SA
 */
import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { spawn, spawnSync } from 'node:child_process'
import { createInterface } from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'
import { fileURLToPath } from 'node:url'
import { parseEnvFile, phase2EnvPath, upsertPhase2Env } from './lib/env.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const PACKAGE_NAME = 'com.moxt.app'
const DISPLAY_NAME = 'MOXT'
const androidDest = path.join(root, 'moxt-react', 'android', 'app', 'google-services.json')
const saPath = path.join(root, 'scripts', 'firebase-service-account.json')
const firebasercPath = path.join(root, '.firebaserc')
const firebaseJsonPath = path.join(root, 'firebase.json')
const firebaseBin = path.join(root, 'node_modules', 'firebase-tools', 'lib', 'bin', 'firebase.js')

/** Timeouts (ms) — sdkconfig can hang without a hard kill. */
const TIMEOUT_DEFAULT_MS = 90_000
const TIMEOUT_SDKCONFIG_MS = 60_000
const RETRIES_SDKCONFIG = 3
const RETRIES_LIST = 3

const autoYes = process.argv.includes('--yes') || process.argv.includes('-y')

function log(title, detail = '') {
  console.log(`\n▸ ${title}${detail ? `\n  ${detail}` : ''}`)
}

function step(n, total, title) {
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
  console.log(`  Étape ${n}/${total} — ${title}`)
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
}

function parseArg(name) {
  const prefix = `--${name}=`
  const hit = process.argv.find((a) => a.startsWith(prefix))
  return hit ? hit.slice(prefix.length).trim() : ''
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Spawn Firebase CLI with an optional hard timeout (kills the process tree on hang).
 */
function runFirebase(args, { inherit = true, capture = false, timeoutMs = TIMEOUT_DEFAULT_MS } = {}) {
  const hasLocal = existsSync(firebaseBin)
  const runner = hasLocal ? process.execPath : 'npx'
  const runnerArgs = hasLocal ? [firebaseBin, ...args] : ['--yes', 'firebase-tools', ...args]
  const useShell = !hasLocal && process.platform === 'win32'

  return new Promise((resolve) => {
    let settled = false
    let timedOut = false
    let stdout = ''
    let stderr = ''

    const child = spawn(runner, runnerArgs, {
      cwd: root,
      shell: useShell,
      stdio: inherit && !capture ? 'inherit' : ['ignore', 'pipe', 'pipe'],
      env: process.env,
      windowsHide: true,
    })

    if (capture || !inherit) {
      child.stdout?.on('data', (chunk) => {
        stdout += chunk.toString()
      })
      child.stderr?.on('data', (chunk) => {
        stderr += chunk.toString()
      })
    }

    const timer =
      timeoutMs > 0
        ? setTimeout(() => {
            timedOut = true
            try {
              child.kill('SIGTERM')
            } catch {
              /* ignore */
            }
            // Windows: force-kill if still alive shortly after
            setTimeout(() => {
              try {
                if (!child.killed) child.kill('SIGKILL')
              } catch {
                /* ignore */
              }
            }, 2000)
          }, timeoutMs)
        : null

    const finish = (status) => {
      if (settled) return
      settled = true
      if (timer) clearTimeout(timer)
      resolve({
        ok: !timedOut && status === 0,
        status: timedOut ? 124 : (status ?? 1),
        timedOut,
        stdout,
        stderr,
      })
    }

    child.on('error', (err) => {
      stderr += String(err?.message || err)
      finish(1)
    })
    child.on('close', (code) => finish(code ?? 1))
  })
}

function runNodeScript(relPath) {
  return (
    spawnSync(process.execPath, [path.join(root, relPath)], {
      cwd: root,
      stdio: 'inherit',
      env: process.env,
    }).status ?? 1
  )
}

function parseFirebaseJson(raw) {
  const text = String(raw || '').trim()
  if (!text) return null

  // CLI mixes progress logs with JSON — extract the outermost { … } / [ … ].
  for (const [open, close] of [
    ['{', '}'],
    ['[', ']'],
  ]) {
    const start = text.indexOf(open)
    const end = text.lastIndexOf(close)
    if (start >= 0 && end > start) {
      try {
        const parsed = JSON.parse(text.slice(start, end + 1))
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && parsed.result !== undefined) {
          return parsed.result
        }
        return parsed
      } catch {
        /* try next */
      }
    }
  }

  const lines = text.split(/\r?\n/).filter(Boolean)
  for (let i = lines.length - 1; i >= 0; i -= 1) {
    try {
      const parsed = JSON.parse(lines[i])
      return parsed?.result !== undefined ? parsed.result : parsed
    } catch {
      /* continue */
    }
  }
  return null
}

function ensureFirebaseJson() {
  if (existsSync(firebaseJsonPath)) return
  writeFileSync(firebaseJsonPath, '{}\n', 'utf8')
}

function readFirebasercProject() {
  if (!existsSync(firebasercPath)) return ''
  try {
    return JSON.parse(readFileSync(firebasercPath, 'utf8'))?.projects?.default || ''
  } catch {
    return ''
  }
}

function writeFirebaserc(projectId) {
  writeFileSync(
    firebasercPath,
    `${JSON.stringify({ projects: { default: projectId } }, null, 2)}\n`,
    'utf8',
  )
}

async function isLoggedIn() {
  const res = await runFirebase(['login:list', '--json'], { inherit: false, capture: true })
  const data = parseFirebaseJson(`${res.stdout}\n${res.stderr}`)
  const users = Array.isArray(data) ? data : data?.users || []
  return users.length > 0
}

async function listProjects() {
  const res = await runFirebase(['projects:list', '--json'], { inherit: false, capture: true })
  const data = parseFirebaseJson(`${res.stdout}\n${res.stderr}`)
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.projects)) return data.projects
  return []
}

async function listAndroidApps(projectId) {
  const args = ['apps:list', 'ANDROID', '--json']
  if (projectId) args.push('--project', projectId)

  let lastErr = ''
  for (let attempt = 1; attempt <= RETRIES_LIST; attempt += 1) {
    const res = await runFirebase(args, { inherit: false, capture: true })
    if (res.timedOut) {
      lastErr = `timeout (${TIMEOUT_DEFAULT_MS / 1000}s)`
      console.error(`  ⚠ apps:list tentative ${attempt}/${RETRIES_LIST} : ${lastErr}`)
      await sleep(1500 * attempt)
      continue
    }
    const data = parseFirebaseJson(`${res.stdout}\n${res.stderr}`)
    if (Array.isArray(data)) return data
    if (Array.isArray(data?.apps)) return data.apps
    if (res.ok) return []
    lastErr = `${res.stderr}\n${res.stdout}`.trim().split('\n').slice(-2).join(' | ')
    console.error(`  ⚠ apps:list tentative ${attempt}/${RETRIES_LIST} : ${lastErr || 'échec'}`)
    await sleep(1500 * attempt)
  }
  throw new Error(`Impossible de lister les apps Android : ${lastErr || 'inconnu'}`)
}

function packageNameOf(app) {
  return app?.packageName || app?.androidApp?.packageName || app?.platformAppId || ''
}

function findMoxtApp(apps) {
  return (
    apps.find((app) => String(packageNameOf(app)) === PACKAGE_NAME) ||
    apps.find((app) => String(app?.displayName || '').toUpperCase().includes('MOXT')) ||
    null
  )
}

function appIdOf(app) {
  if (app?.appId) return String(app.appId)
  if (typeof app?.name === 'string' && app.name.includes('/')) {
    return app.name.split('/').pop()
  }
  return ''
}

/** Correct CLI: firebase apps:create ANDROID <displayName> --package-name <pkg> */
async function createAndroidApp(projectId) {
  const attempts = [
    ['apps:create', 'ANDROID', DISPLAY_NAME, '--package-name', PACKAGE_NAME, '--project', projectId],
    ['apps:create', 'android', DISPLAY_NAME, '-a', PACKAGE_NAME, '--project', projectId],
  ]

  for (const args of attempts) {
    log('Création', args.join(' '))
    const created = await runFirebase(args, { inherit: true, capture: true, timeoutMs: TIMEOUT_DEFAULT_MS })
    if (created.ok) return { ok: true, raw: `${created.stdout}\n${created.stderr}` }
    if (created.timedOut) {
      console.error(`  ⚠ Timeout création (${TIMEOUT_DEFAULT_MS / 1000}s) — nouvel essai ou apps:list`)
      continue
    }
    const err = `${created.stderr}\n${created.stdout}`.trim()
    // Already exists is OK — caller will re-list
    if (/already exists|existe déjà|ALREADY_EXISTS/i.test(err)) {
      return { ok: false, alreadyExists: true, raw: err }
    }
    console.error(`  ⚠ Tentative échouée : ${err.split('\n').slice(-3).join(' | ')}`)
  }
  return { ok: false, raw: '' }
}

async function resolveAndroidApp(projectId) {
  let apps = await listAndroidApps(projectId)
  let app = findMoxtApp(apps)
  if (app) {
    log('App Android', `${PACKAGE_NAME} déjà présente (${appIdOf(app)})`)
    return app
  }

  log('Création', `app Android ${PACKAGE_NAME}`)
  const created = await createAndroidApp(projectId)
  if (!created.ok) {
    apps = await listAndroidApps(projectId)
    app = findMoxtApp(apps)
    if (app) {
      log('App Android', 'déjà présente après conflit de création')
      return app
    }
    throw new Error(
      `Impossible de créer l’app Android ${PACKAGE_NAME}. ` +
        'Vérifiez les droits Firebase sur le projet, puis relancez.',
    )
  }

  for (let i = 0; i < 8; i += 1) {
    await sleep(1500)
    apps = await listAndroidApps(projectId)
    app = findMoxtApp(apps)
    if (app) return app

    const parsed = parseFirebaseJson(created.raw)
    const createdId = parsed?.appId || (typeof parsed?.name === 'string' ? parsed.name.split('/').pop() : '')
    if (createdId) {
      return { appId: createdId, packageName: PACKAGE_NAME, displayName: DISPLAY_NAME }
    }
  }

  throw new Error('App créée mais introuvable dans apps:list. Relancez npm run setup:firebase.')
}

function isValidGoogleServices(filePath) {
  if (!existsSync(filePath)) return false
  try {
    const body = readFileSync(filePath, 'utf8')
    if (body.includes('moxt-placeholder') || body.includes('REPLACE_WITH_FIREBASE')) return false
    const json = JSON.parse(body)
    return Boolean(json?.project_info?.project_id && json?.client?.[0]?.client_info?.mobilesdk_app_id)
  } catch {
    return false
  }
}

async function downloadSdkConfig(appId, projectId) {
  mkdirSync(path.dirname(androidDest), { recursive: true })
  const tmp = `${androidDest}.download`

  for (let attempt = 1; attempt <= RETRIES_SDKCONFIG; attempt += 1) {
    try {
      if (existsSync(tmp)) unlinkSync(tmp)
    } catch {
      /* ignore */
    }

    log(
      'Téléchargement',
      `google-services.json (${appId}) — essai ${attempt}/${RETRIES_SDKCONFIG}, timeout ${TIMEOUT_SDKCONFIG_MS / 1000}s`,
    )
    const args = ['apps:sdkconfig', 'ANDROID', appId, '-o', tmp]
    if (projectId) args.push('--project', projectId)

    const res = await runFirebase(args, {
      inherit: true,
      capture: false,
      timeoutMs: TIMEOUT_SDKCONFIG_MS,
    })

    if (res.timedOut) {
      console.error(
        `  ⚠ sdkconfig a expiré après ${TIMEOUT_SDKCONFIG_MS / 1000}s` +
          (attempt < RETRIES_SDKCONFIG ? ' — nouvel essai…' : ''),
      )
      try {
        if (existsSync(tmp)) unlinkSync(tmp)
      } catch {
        /* ignore */
      }
      if (attempt < RETRIES_SDKCONFIG) await sleep(2000 * attempt)
      continue
    }

    if (!res.ok || !existsSync(tmp)) {
      const tip =
        `Échec apps:sdkconfig (code ${res.status}). ` +
        `Réessayez : firebase apps:sdkconfig ANDROID ${appId} -o ${androidDest} --project ${projectId}`
      console.error(`  ⚠ ${tip}`)
      if (attempt < RETRIES_SDKCONFIG) {
        await sleep(2000 * attempt)
        continue
      }
      return false
    }

    writeFileSync(androidDest, readFileSync(tmp, 'utf8'))
    try {
      unlinkSync(tmp)
    } catch {
      /* ignore */
    }

    if (!isValidGoogleServices(androidDest)) {
      console.error('  ⚠ Fichier google-services.json invalide ou placeholder.')
      try {
        unlinkSync(androidDest)
      } catch {
        /* ignore */
      }
      if (attempt < RETRIES_SDKCONFIG) {
        await sleep(2000 * attempt)
        continue
      }
      return false
    }
    return true
  }
  return false
}

function openUrl(url) {
  const cmd =
    process.platform === 'win32'
      ? ['cmd', ['/c', 'start', '', url]]
      : process.platform === 'darwin'
        ? ['open', [url]]
        : ['xdg-open', [url]]
  spawnSync(cmd[0], cmd[1], { stdio: 'ignore', shell: process.platform === 'win32' })
}

function hasServiceAccount(vars) {
  if (existsSync(saPath)) return true
  if (vars.FCM_SERVICE_ACCOUNT_JSON?.trim()?.startsWith('{')) return true
  if (vars.FCM_SERVICE_ACCOUNT_PATH && existsSync(path.resolve(root, vars.FCM_SERVICE_ACCOUNT_PATH))) {
    return true
  }
  return false
}

async function ask(rl, question, { def = '' } = {}) {
  if (autoYes && def) return def
  const suffix = def ? ` [${def}]` : ''
  const answer = (await rl.question(`${question}${suffix} : `)).trim()
  return answer || def
}

async function askYesNo(rl, question, { def = true } = {}) {
  if (autoYes) return def
  const hint = def ? 'O/n' : 'o/N'
  const answer = (await rl.question(`${question} (${hint}) : `)).trim().toLowerCase()
  if (!answer) return def
  return ['o', 'oui', 'y', 'yes'].includes(answer)
}

async function waitForServiceAccount(rl, projectId) {
  const url = `https://console.firebase.google.com/project/${projectId}/settings/serviceaccounts/adminsdk`
  console.log('\n  La CLI ne peut pas télécharger la clé privée automatiquement.')
  console.log('  1. Cliquez « Générer une nouvelle clé privée »')
  console.log(`  2. Enregistrez le JSON comme :`)
  console.log(`     ${saPath}`)
  console.log(`  3. Revenez ici — détection auto toutes les 3 s (max ~5 min puis question)`)

  if (await askYesNo(rl, 'Ouvrir la page Comptes de service maintenant ?', { def: true })) {
    openUrl(url)
  } else {
    console.log(`  Lien : ${url}`)
  }

  // Cap wait: ~60 checks × 3s ≈ 3 min before first continue prompt, then up to ~5 min total
  for (let i = 0; i < 100; i += 1) {
    if (existsSync(saPath)) {
      log('Compte de service', 'fichier détecté')
      return true
    }
    if (i === 0 || i % 5 === 0) {
      process.stdout.write(`  … en attente de firebase-service-account.json (${i * 3}s)\r`)
    }
    await sleep(3000)
    if (i > 0 && i % 20 === 0) {
      const cont = await askYesNo(rl, '\nToujours en attente — continuer ?', { def: true })
      if (!cont) return false
    }
  }
  return existsSync(saPath)
}

function printServiceAccountNextStep(projectId) {
  const url = `https://console.firebase.google.com/project/${projectId}/settings/serviceaccounts/adminsdk`
  console.log('\n⚠ Compte de service manquant (requis pour push serveur FCM).')
  console.log('  Prochaine étape manuelle :')
  console.log(`  1. Ouvrir : ${url}`)
  console.log('  2. « Générer une nouvelle clé privée »')
  console.log(`  3. Enregistrer comme : ${saPath}`)
  console.log('  4. Relancer : npm run setup:push:native')
  console.log('  5. Vérifier : npm run check:push')
}

async function pickProject(rl, vars) {
  const fromArg = parseArg('project')
  const fromEnv = process.env.FCM_PROJECT_ID || vars.FCM_PROJECT_ID || readFirebasercProject()
  if (fromArg) return fromArg

  log('Projets Firebase', 'chargement…')
  const projects = await listProjects()

  if (!projects.length) {
    console.log('\n⚠ Aucun projet listé.')
    if (await askYesNo(rl, 'Créer un nouveau projet Firebase « MOXT » ?', { def: true })) {
      const suggested = `moxt-app-${Date.now().toString(36).slice(-5)}`
      const newId = await ask(rl, 'ID projet (unique, minuscules)', { def: suggested })
      const created = await runFirebase(
        ['projects:create', newId, '--display-name', 'MOXT'],
        { inherit: true },
      )
      if (!created.ok) {
        console.error('\n✗ Création échouée. Créez le projet sur https://console.firebase.google.com/')
        process.exit(1)
      }
      return newId
    }
    console.error('  Console : https://console.firebase.google.com/')
    process.exit(1)
  }

  const moxtPreferred =
    projects.find((p) => String(p.displayName || '').toUpperCase() === 'MOXT') ||
    projects.find((p) => String(p.projectId || '').includes('moxt'))

  console.log('')
  projects.forEach((p, i) => {
    const id = p.projectId || p.project_id || p.id || ''
    const name = p.displayName || p.name || id
    const mark =
      (fromEnv && id === fromEnv) || (moxtPreferred && id === moxtPreferred.projectId)
        ? ' ← recommandé'
        : ''
    console.log(`  ${i + 1}. ${name}  (${id})${mark}`)
  })

  if (fromEnv && projects.some((p) => (p.projectId || p.project_id || p.id) === fromEnv)) {
    if (await askYesNo(rl, `Utiliser le projet « ${fromEnv} » ?`, { def: true })) {
      return fromEnv
    }
  } else if (moxtPreferred?.projectId) {
    if (
      await askYesNo(rl, `Utiliser le projet MOXT « ${moxtPreferred.projectId} » ?`, {
        def: true,
      })
    ) {
      return moxtPreferred.projectId
    }
  }

  const choice = await ask(rl, 'Numéro du projet (ou ID)', { def: '1' })
  const asIndex = Number(choice)
  if (Number.isInteger(asIndex) && asIndex >= 1 && asIndex <= projects.length) {
    const p = projects[asIndex - 1]
    return p.projectId || p.project_id || p.id
  }
  return choice
}

async function main() {
  console.log('\n══════════════════════════════════════')
  console.log('  MOXT — Assistant Firebase (FCM)')
  console.log('══════════════════════════════════════')
  console.log('  Connecte Firebase pour les notifications Android.')
  console.log('  Package app : com.moxt.app')

  if (!existsSync(firebaseBin)) {
    console.error('\n✗ firebase-tools manquant. Lancez : npm install')
    process.exit(1)
  }

  ensureFirebaseJson()
  const vars = parseEnvFile(phase2EnvPath)
  const rl = createInterface({ input, output })

  try {
    // 1 — Login
    step(1, 5, 'Connexion Firebase CLI')
    if (!(await isLoggedIn())) {
      console.log('  Ouverture du navigateur Google…')
      console.log('  Autorisez Firebase CLI, puis revenez ici.')
      const login = await runFirebase(['login', '--no-localhost'], { inherit: true, timeoutMs: 0 })
      if (!login.ok || !(await isLoggedIn())) {
        const again = await runFirebase(['login'], { inherit: true, timeoutMs: 0 })
        if (!again.ok || !(await isLoggedIn())) {
          console.error('\n✗ Connexion échouée. Relancez : npm run firebase:login')
          process.exit(1)
        }
      }
    }
    log('Auth', 'connecté')

    // 2 — Project
    step(2, 5, 'Choisir le projet Firebase')
    const projectId = await pickProject(rl, vars)
    if (!projectId) {
      console.error('\n✗ Projet non sélectionné.')
      process.exit(1)
    }
    writeFirebaserc(projectId)
    if (!(await runFirebase(['use', projectId], { inherit: true })).ok) {
      console.error('\n✗ Impossible d’utiliser ce projet.')
      process.exit(1)
    }
    log('Projet', projectId)

    // 3 — Android app + google-services.json
    step(3, 5, 'App Android + google-services.json')
    let app
    try {
      app = await resolveAndroidApp(projectId)
    } catch (err) {
      console.error(`\n✗ ${err.message}`)
      process.exit(1)
    }

    const appId = appIdOf(app)
    if (!appId) {
      console.error('\n✗ appId introuvable après création.')
      process.exit(1)
    }

    if (isValidGoogleServices(androidDest)) {
      log('Android', `déjà présent : ${androidDest}`)
    } else if (!(await downloadSdkConfig(appId, projectId))) {
      console.error('\n✗ Téléchargement google-services.json échoué après retries.')
      console.error(
        `  Manuel : firebase apps:sdkconfig ANDROID ${appId} -o ${androidDest} --project ${projectId}`,
      )
      process.exit(1)
    } else {
      log('Android', androidDest)
    }

    upsertPhase2Env({
      FCM_PROJECT_ID: projectId,
      FCM_GOOGLE_SERVICES_PATH: 'moxt-react/android/app/google-services.json',
      FCM_SERVICE_ACCOUNT_PATH: 'scripts/firebase-service-account.json',
    })

    // 4 — Service account
    step(4, 5, 'Compte de service (serveur push)')
    let saReady = hasServiceAccount(parseEnvFile(phase2EnvPath))
    if (saReady) {
      log('Compte de service', 'déjà présent')
    } else if (autoYes) {
      // --yes must not block forever waiting for a manual download
      openUrl(
        `https://console.firebase.google.com/project/${projectId}/settings/serviceaccounts/adminsdk`,
      )
      printServiceAccountNextStep(projectId)
      console.log('\n✓ Client Android FCM prêt (google-services.json).')
      process.exit(0)
    } else {
      saReady = await waitForServiceAccount(rl, projectId)
      if (!saReady) {
        console.log('\n⚠ Client Android prêt, serveur FCM incomplet.')
        printServiceAccountNextStep(projectId)
        process.exit(0)
      }
    }

    // 5 — Push secrets
    step(5, 5, 'Secrets Supabase + déploiement send-push')
    if (await askYesNo(rl, 'Configurer le serveur maintenant (setup:push:native) ?', { def: true })) {
      const code = runNodeScript('scripts/setup-push-native.mjs')
      if (code !== 0) {
        console.error('\n✗ setup:push:native a échoué. Vérifiez SUPABASE_ACCESS_TOKEN dans phase2.env.')
        process.exit(code)
      }
    } else {
      console.log('  Plus tard : npm run setup:push:native')
    }

    console.log('\n══════════════════════════════════════')
    console.log('  Firebase connecté')
    console.log('══════════════════════════════════════')
    console.log(`  Projet  : ${projectId}`)
    console.log(`  Android : ${androidDest}`)
    console.log(`  Serveur : scripts/firebase-service-account.json`)
    console.log('\n  Build APK prod :')
    console.log('    npm run web:cap:prod:sync')
    console.log('  Diagnostic :')
    console.log('    npm run check:push')
  } finally {
    rl.close()
  }
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)

if (isMain) {
  main().catch((error) => {
    console.error(error)
    process.exit(1)
  })
}
