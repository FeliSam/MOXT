import { ycJson, ycRun, ycInherit } from './yandex.mjs'

/**
 * GARDE-FOU CDN moxtapp.ru — NE PAS CHANGER sans vérifier https://moxtapp.ru/
 *
 * Outage 2026-09-19: origin Storage API (*.storage.yandexcloud.net) → GET / = 403 AccessDenied.
 * Rewrite nucléaire ^/(.*)$ → HTML servi à la place des .js/.css.
 *
 * Config verrouillée (live resource bc8rz327qbtedt3vbafl):
 * - origin website: {bucket}.website.yandexcloud.net + meta.website.name
 * - Host header = même host website
 * - rewrite UNIQUEMENT ^/$ → /index.html (BREAK) — jamais ^/(.*)$ ni SPA large par défaut
 * - routes SPA (/marketplace…) via documents index/error du website hosting
 */
export const MOXT_CDN_LOCK = Object.freeze({
  resourceId: 'bc8rz327qbtedt3vbafl',
  bucket: 'moxtapp-web',
  websiteHost: (bucket) => `${bucket}.website.yandexcloud.net`,
  storageHost: (bucket) => `${bucket}.storage.yandexcloud.net`,
  rootRewriteBody: '^/$ /index.html',
  forbiddenRewriteBodies: Object.freeze(['^/(.*)$ /index.html', '^/(.*)$ /index.html']),
})

/** @deprecated Prefer ROOT_REWRITE_BODY — kept name for older callers. */
export const SPA_REWRITE_BODY = MOXT_CDN_LOCK.rootRewriteBody
export const ROOT_REWRITE_BODY = MOXT_CDN_LOCK.rootRewriteBody
export const FORBIDDEN_NUCLEAR_REWRITE = '^/(.*)$ /index.html'

export function listCdnResources() {
  const list = ycJson('cdn', 'resource', 'list')
  return Array.isArray(list) ? list : list?.resources || []
}

export function findCdnResource(domain, wwwDomain) {
  const resources = listCdnResources()
  return (
    resources.find((r) => r.cname === domain) ||
    resources.find((r) => r.cname === wwwDomain) ||
    resources.find((r) => r.secondary_hostnames?.includes(wwwDomain)) ||
    null
  )
}

export function deleteCdnResource(resourceId) {
  const { code, stderr, stdout } = ycRun(['cdn', 'resource', 'delete', resourceId])
  if (code !== 0) {
    const msg = `${stderr}\n${stdout}`
    if (msg.includes('not found') || msg.includes('NOT_FOUND')) return false
    throw new Error(`yc cdn resource delete ${resourceId} → ${msg.trim() || code}`)
  }
  return true
}

export function createCleanCdnResource({
  domain,
  wwwDomain,
  bucket,
  certId,
}) {
  const storageHost = `${bucket}.storage.yandexcloud.net`
  const args = [
    'cdn',
    'resource',
    'create',
    domain,
    '--origin-bucket-source',
    storageHost,
    '--origin-bucket-name',
    bucket,
    '--origin-protocol',
    'http',
    '--secondary-hostnames',
    wwwDomain,
    '--redirect-http-to-https',
  ]

  if (certId) {
    args.push('--cert-manager-ssl-cert-id', certId)
  } else {
    args.push('--dont-use-ssl-cert')
  }

  const created = ycJson(...args)
  ensureSpaOrigin(created, bucket)
  return ycJson('cdn', 'resource', 'get', created.id)
}

/**
 * Enforce locked website origin for Moxt SPA CDN.
 * NEVER switches back to Storage API origin (that took the site down).
 */
export function ensureSpaOrigin(resource, bucket) {
  const groupId = resource?.origin_group_id
  const resourceId = resource?.id
  if (!groupId || !resourceId) return resource

  const websiteHost = `${bucket}.website.yandexcloud.net`
  const group = ycJson('cdn', 'origin-group', 'get', String(groupId))
  const origin = group?.origins?.[0]
  const source = origin?.source || ''
  const websiteMeta = origin?.meta?.website?.name
  const bucketMeta = origin?.meta?.bucket?.name

  // Reject / repair storage-API origin (403 on /)
  const needsWebsiteOrigin =
    source !== websiteHost || websiteMeta !== bucket || Boolean(bucketMeta)

  if (needsWebsiteOrigin) {
    ycInherit(
      'cdn',
      'origin-group',
      'update',
      '--id',
      String(groupId),
      '--name',
      `s3-${bucket}-website`,
      '--origin',
      `source=${websiteHost},enabled=true,meta-website-name=${bucket}`,
    )
  }

  let current = ycJson('cdn', 'resource', 'get', resourceId)
  const hostHeader = current.options?.host_options?.host?.value

  if (hostHeader !== websiteHost) {
    ycInherit('cdn', 'resource', 'update', resourceId, '--host-header', websiteHost)
    current = ycJson('cdn', 'resource', 'get', resourceId)
  }

  const rewrite = current.options?.rewrite
  const flag = (rewrite?.flag || '').toUpperCase()
  const body = (rewrite?.body || '').trim()

  if (rewrite?.enabled && (flag === 'PERMANENT' || flag === 'LAST')) {
    ycInherit('cdn', 'resource', 'update', resourceId, '--clear-rewrite')
    current = ycJson('cdn', 'resource', 'get', resourceId)
  }

  // Nuclear rewrite poisons .js/.css — strip immediately
  if (rewrite?.enabled && (/^\/\(\.\*\)\$/.test(body) || body.includes('^/(.*)$'))) {
    ycInherit('cdn', 'resource', 'update', resourceId, '--clear-rewrite')
    current = ycJson('cdn', 'resource', 'get', resourceId)
  }

  const rewriteOk =
    current.options?.rewrite?.enabled &&
    current.options?.rewrite?.body === ROOT_REWRITE_BODY &&
    (current.options?.rewrite?.flag || '').toUpperCase() === 'BREAK'

  if (!rewriteOk) {
    ycInherit(
      'cdn',
      'resource',
      'update',
      resourceId,
      '--rewrite-body',
      ROOT_REWRITE_BODY,
      '--rewrite-flag',
      'break',
    )
  }

  const locked = ycJson('cdn', 'resource', 'get', resourceId)
  assertCdnSpaGuard(resourceId, bucket)
  return locked
}

/**
 * Hard guard: abort deploy if CDN would take moxtapp.ru down.
 * Call after any CDN mutate and before declaring cpd success.
 */
export function assertCdnSpaGuard(resourceId, bucket) {
  const id = String(resourceId || MOXT_CDN_LOCK.resourceId)
  const bkt = bucket || MOXT_CDN_LOCK.bucket
  const websiteHost = `${bkt}.website.yandexcloud.net`
  const storageHost = `${bkt}.storage.yandexcloud.net`

  const resource = ycJson('cdn', 'resource', 'get', id)
  const groupId = resource?.origin_group_id
  if (!groupId) {
    throw new Error(`[cdn-guard] missing origin_group_id on ${id}`)
  }
  const group = ycJson('cdn', 'origin-group', 'get', String(groupId))
  const origin = group?.origins?.[0] || {}
  const source = origin?.source || ''
  const websiteMeta = origin?.meta?.website?.name
  const bucketMeta = origin?.meta?.bucket?.name
  const hostHeader = resource?.options?.host_options?.host?.value || ''
  const rewrite = resource?.options?.rewrite || {}
  const body = (rewrite?.body || '').trim()
  const flag = (rewrite?.flag || '').toUpperCase()

  const errors = []

  if (source === storageHost || source.includes('.storage.yandexcloud.net')) {
    errors.push(`origin is Storage API (${source}) — must be website ${websiteHost}`)
  }
  if (source && source !== websiteHost) {
    errors.push(`origin source=${source} expected ${websiteHost}`)
  }
  if (websiteMeta !== bkt) {
    errors.push(`meta.website.name=${websiteMeta || '(none)'} expected ${bkt}`)
  }
  if (bucketMeta) {
    errors.push(`meta.bucket.name=${bucketMeta} must be absent (website mode)`)
  }
  if (hostHeader !== websiteHost) {
    errors.push(`Host header=${hostHeader || '(none)'} expected ${websiteHost}`)
  }
  if (body.includes('^/(.*)$')) {
    errors.push(`nuclear rewrite forbidden: ${body}`)
  }
  if (rewrite?.enabled && (flag === 'PERMANENT' || flag === 'LAST')) {
    errors.push(`rewrite flag ${flag} forbidden`)
  }
  if (rewrite?.enabled && body && body !== ROOT_REWRITE_BODY) {
    errors.push(`rewrite body=${body} expected ${ROOT_REWRITE_BODY} (or disabled)`)
  }
  if (!rewrite?.enabled) {
    // allowed only if caller cleared; prefer root rewrite — warn as error for Moxt lock
    errors.push(`rewrite disabled — expected ${ROOT_REWRITE_BODY} BREAK for apex /`)
  }

  if (errors.length) {
    throw new Error(`[cdn-guard] CDN config unsafe for moxtapp.ru:\n- ${errors.join('\n- ')}`)
  }

  return {
    ok: true,
    resourceId: id,
    origin: source,
    host: hostHeader,
    rewrite: body,
  }
}

export function finalizeSpaCdn(resourceId, bucket) {
  const applied = ensureSpaOrigin(ycJson('cdn', 'resource', 'get', resourceId), bucket)
  assertCdnSpaGuard(resourceId, bucket)
  return applied
}

export function attachCertificate(resourceId, certId) {
  ycInherit(
    'cdn',
    'resource',
    'update',
    resourceId,
    '--cert-manager-ssl-cert-id',
    certId,
    '--redirect-http-to-https',
  )
}

export const MOXT_CSP =
  "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: blob: https:; connect-src 'self' https://restcountries.com https://countriesnow.space https://api.frankfurter.dev https://*.supabase.co wss://*.supabase.co http://localhost:* ws://localhost:*; font-src 'self' data: https://fonts.gstatic.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'"

export const MOXT_SECURITY_HEADERS = {
  'Content-Security-Policy': MOXT_CSP,
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
}

/**
 * Pose les en-têtes de sécurité HTTP sur la ressource CDN Yandex (Vague 2).
 * Best-effort : la CLI yc ne propose pas toujours `--header` ; on n’interrompt jamais le déploiement.
 */
export function ensureCdnSecurityHeaders(resourceId) {
  if (!resourceId) return false
  // Tentatives compatibles selon versions yc (aucune ne doit faire échouer le CPD).
  const attempts = [
    ['--header'],
    ['--response-header'],
    ['--custom-header'],
  ]
  for (const [flag] of attempts) {
    let allOk = true
    for (const [name, value] of Object.entries(MOXT_SECURITY_HEADERS)) {
      const { code, stderr, stdout } = ycRun([
        'cdn',
        'resource',
        'update',
        String(resourceId),
        flag,
        `${name}:${value}`,
      ])
      if (code !== 0) {
        allOk = false
        const msg = `${stderr}\n${stdout}`.trim()
        if (/unknown flag|unknown argument/i.test(msg)) break
      }
    }
    if (allOk) return true
  }
  console.warn(
    '[cdn] En-têtes HTTP de sécurité non posés via yc (flag non supporté). CSP meta HTML + netlify.toml restent actifs.',
  )
  return false
}

export function purgeCdnCache(resourceId) {
  // Inclure logos / icônes : le shell seul ne suffit pas (CDN garde les PNG/SVG 1h).
  const paths = [
    '/',
    '/index.html',
    '/assets/*',
    '/version.json',
    '/deploy-manifest.json',
    '/sw.js',
    '/theme-init.js',
    '/manifest.webmanifest',
    '/favicon.svg',
    '/app-icon.svg',
    '/favicon.ico',
    '/favicon-32.png',
    '/apple-touch-icon.png',
    '/icon-192.png',
    '/icon-512.png',
    '/icon-512-maskable.png',
    '/mx-32.png',
    '/mx-180.png',
    '/mx-192.png',
    '/mx-512.png',
    '/mx-512-maskable.png',
    '/moxt-x-32.png',
    '/moxt-x-180.png',
    '/moxt-x-192.png',
    '/moxt-x-512.png',
    '/moxt-x-512-maskable.png',
    '/assets/brand/moxt-x.png',
    '/assets/brand/mark.png',
    '/assets/logos/X.png',
    '/assets/logos/X.svg',
    '/assets/logos/MOXTlogo.svg',
  ]
  const selective = ycRun([
    'cdn',
    'cache',
    'purge',
    '--resource-id',
    resourceId,
    '--path',
    paths.join(','),
  ])
  if (selective.code === 0) return { ok: true }

  const msg = `${selective.stderr}\n${selective.stdout}`
  if (msg.includes('purge operation limit')) {
    return { ok: false, reason: 'rate_limit' }
  }

  const full = ycRun([
    'cdn',
    'cache',
    'purge',
    '--resource-id',
    resourceId,
    '--all',
  ])
  if (full.code === 0) return { ok: true }

  const fullMsg = `${full.stderr}\n${full.stdout}`
  if (fullMsg.includes('purge operation limit')) {
    return { ok: false, reason: 'rate_limit' }
  }
  return { ok: false, reason: fullMsg.trim() || String(full.code) }
}

export function findCertificate(domain, wwwDomain, certName = 'moxtapp-ru-letsencrypt') {
  const list = ycJson('certificate-manager', 'certificate', 'list')
  const certs = list?.certificates || list || []
  const arr = Array.isArray(certs) ? certs : []
  return (
    arr.find((c) => c.name === certName) ||
    arr.find((c) => c.domains?.includes(domain)) ||
    arr.find((c) => c.domains?.includes(wwwDomain)) ||
    null
  )
}

export async function waitForHttpOk(url, { attempts = 12, delayMs = 10000, allowRedirect = false } = {}) {
  for (let i = 0; i < attempts; i += 1) {
    try {
      const response = await fetch(url, { method: 'GET', redirect: 'follow' })
      const text = response.ok ? await response.text() : ''
      const looksLikeApp = text.includes('<!doctype html') || text.includes('MOXT')
      if (response.ok && looksLikeApp) {
        return { ok: true, status: response.status, url: response.url }
      }
      if (looksLikeApp) {
        return { ok: true, status: response.status, url: response.url }
      }
      if (allowRedirect && [301, 302, 307, 308].includes(response.status)) {
        return { ok: true, status: response.status, url: response.url }
      }
    } catch {
      // retry
    }
    if (i < attempts - 1) {
      await new Promise((resolve) => setTimeout(resolve, delayMs))
    }
  }
  return { ok: false }
}
