import { ycJson, ycRun, ycInherit } from './yandex.mjs'

/** Rewrite interne (break) : / et routes SPA sans extension → index.html ; les assets (.js, .css…) passent. */
export const SPA_REWRITE_BODY = '^/([^.]*)$ /index.html'

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
 * SPA sur Yandex CDN + Object Storage :
 * - origine bucket S3 (meta-bucket-name)
 * - Host header = endpoint storage (doc quickstart)
 * - rewrite break : chemins sans « . » → /index.html (/, /login, /messages…)
 * Évite PERMANENT (boucles) et last (500).
 */
export function ensureSpaOrigin(resource, bucket) {
  const groupId = resource?.origin_group_id
  const resourceId = resource?.id
  if (!groupId || !resourceId) return resource

  const storageHost = `${bucket}.storage.yandexcloud.net`
  const group = ycJson('cdn', 'origin-group', 'get', String(groupId))
  const origin = group?.origins?.[0]
  const source = origin?.source || ''
  const bucketMeta = origin?.meta?.bucket?.name
  const websiteMeta = origin?.meta?.website?.name

  if (source !== storageHost || bucketMeta !== bucket || websiteMeta) {
    ycInherit(
      'cdn',
      'origin-group',
      'update',
      '--id',
      String(groupId),
      '--name',
      `s3-${bucket}`,
      '--origin',
      `source=${storageHost},enabled=true,meta-bucket-name=${bucket}`,
    )
  }

  let current = ycJson('cdn', 'resource', 'get', resourceId)
  const hostHeader = current.options?.host_options?.host?.value

  if (hostHeader !== storageHost) {
    ycInherit('cdn', 'resource', 'update', resourceId, '--host-header', storageHost)
    current = ycJson('cdn', 'resource', 'get', resourceId)
  }

  const rewrite = current.options?.rewrite
  const flag = (rewrite?.flag || '').toUpperCase()
  const body = rewrite?.body || ''

  if (rewrite?.enabled && (flag === 'PERMANENT' || flag === 'LAST')) {
    ycInherit('cdn', 'resource', 'update', resourceId, '--clear-rewrite')
    current = ycJson('cdn', 'resource', 'get', resourceId)
  }

  const rewriteOk =
    current.options?.rewrite?.enabled &&
    current.options?.rewrite?.body === SPA_REWRITE_BODY &&
    (current.options?.rewrite?.flag || '').toUpperCase() === 'BREAK'

  if (!rewriteOk) {
    ycInherit(
      'cdn',
      'resource',
      'update',
      resourceId,
      '--rewrite-body',
      SPA_REWRITE_BODY,
      '--rewrite-flag',
      'break',
    )
  }

  return ycJson('cdn', 'resource', 'get', resourceId)
}

export function finalizeSpaCdn(resourceId, bucket) {
  return ensureSpaOrigin(ycJson('cdn', 'resource', 'get', resourceId), bucket)
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

export function purgeCdnCache(resourceId) {
  const { code, stderr, stdout } = ycRun([
    'cdn',
    'cache',
    'purge',
    '--resource-id',
    resourceId,
    '--all',
  ])
  if (code !== 0) {
    const msg = `${stderr}\n${stdout}`
    if (msg.includes('purge operation limit')) {
      return { ok: false, reason: 'rate_limit' }
    }
    return { ok: false, reason: msg.trim() || String(code) }
  }
  return { ok: true }
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
