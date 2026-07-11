import { fileURLToPath } from 'node:url'

const DEFAULT_URLS = ['https://www.moxtapp.ru', 'https://moxtapp.ru']

export function resolveExpectedBuildId({
  expected = process.env.MOXT_EXPECTED_BUILD_ID,
  githubSha = process.env.GITHUB_SHA,
  distVersionPath,
  readFileSync,
  existsSync,
} = {}) {
  if (expected) return String(expected).trim()
  if (githubSha) return String(githubSha).slice(0, 12)

  if (distVersionPath && existsSync?.(distVersionPath)) {
    const raw = JSON.parse(readFileSync(distVersionPath, 'utf8'))
    if (raw?.buildId) return String(raw.buildId)
  }

  return ''
}

export function buildIdsMatch(expected, remote) {
  if (!expected || !remote) return false
  if (expected === remote) return true
  const min = Math.min(expected.length, remote.length)
  return min >= 7 && expected.slice(0, min) === remote.slice(0, min)
}

export async function fetchRemoteBuildId(baseUrl, fetchImpl = fetch) {
  const url = new URL('/version.json', baseUrl)
  url.searchParams.set('ts', String(Date.now()))
  const response = await fetchImpl(url, {
    cache: 'no-store',
    headers: { Accept: 'application/json' },
    redirect: 'follow',
  })
  if (!response.ok) {
    throw new Error(`${baseUrl} → HTTP ${response.status}`)
  }
  const payload = await response.json()
  if (!payload?.buildId) {
    throw new Error(`${baseUrl} → buildId manquant`)
  }
  return String(payload.buildId)
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function verifyDeployVersion({
  expectedBuildId,
  urls = DEFAULT_URLS,
  attempts = 12,
  delayMs = 10_000,
  fetchImpl = fetch,
  log = console.log,
} = {}) {
  if (!expectedBuildId) {
    throw new Error('buildId attendu introuvable (MOXT_EXPECTED_BUILD_ID, GITHUB_SHA ou dist/version.json)')
  }

  log(`\n▸ Smoke test version.json`)
  log(`  buildId attendu : ${expectedBuildId}`)

  const failures = []
  let wwwOk = false

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    failures.length = 0
    wwwOk = false

    for (const baseUrl of urls) {
      try {
        const remote = await fetchRemoteBuildId(baseUrl, fetchImpl)
        const ok = buildIdsMatch(expectedBuildId, remote)
        const label = baseUrl.includes('www.') ? 'www' : 'apex'
        log(`  ${ok ? '✓' : '✗'} ${label} : ${remote}${ok ? '' : ` (attendu ${expectedBuildId})`}`)
        if (baseUrl.includes('www.') && ok) wwwOk = true
        if (!ok) failures.push(`${baseUrl} → ${remote}`)
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        log(`  ✗ ${baseUrl} : ${message}`)
        failures.push(message)
      }
    }

    if (wwwOk) {
      if (failures.length) {
        log('\n  ⚠ www OK — apex encore en retard (cache CDN), déploiement accepté')
      } else {
        log('\n  ✓ Smoke test réussi')
      }
      return { ok: true, wwwOk, failures }
    }

    if (attempt < attempts) {
      log(`  … nouvelle tentative dans ${Math.round(delayMs / 1000)}s (${attempt}/${attempts})`)
      await sleep(delayMs)
    }
  }

  throw new Error(`Smoke test échoué après ${attempts} tentatives:\n  - ${failures.join('\n  - ')}`)
}

async function main() {
  const { existsSync, readFileSync } = await import('node:fs')
  const path = await import('node:path')
  const { fileURLToPath } = await import('node:url')

  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
  const distVersion = path.join(root, 'moxt-react', 'dist', 'version.json')
  const urls = (process.env.MOXT_VERIFY_URLS || DEFAULT_URLS.join(','))
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)

  const expectedBuildId = resolveExpectedBuildId({
    distVersionPath: distVersion,
    readFileSync,
    existsSync,
  })

  await verifyDeployVersion({ expectedBuildId, urls })
}

const isMain = process.argv[1] === fileURLToPath(import.meta.url)
if (isMain) {
  main().catch((err) => {
    console.error(`\n✗ ${err instanceof Error ? err.message : err}`)
    process.exit(1)
  })
}
