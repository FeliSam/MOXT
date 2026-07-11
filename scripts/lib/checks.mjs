import { existsSync } from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { resolve4 } from 'node:dns/promises'
import { SPA_REWRITE_BODY } from './yandex-cdn.mjs'
import { loadPhase2Env, root } from './env.mjs'
import { ensureYc, ycJson, ycRun } from './yandex.mjs'
import { getResourceRecords, loadRegruCredentials, resolveCdnIpv4 } from './regru.mjs'

const domain = (process.env.MOXT_DOMAIN || 'moxtapp.ru').replace(/\.$/, '')
const wwwDomain = `www.${domain}`
const bucket = process.env.MOXT_YC_BUCKET || 'moxtapp-web'

export { domain, wwwDomain, bucket }

export function maskSecret(value) {
  if (!value) return '(absent)'
  if (value.length <= 4) return '****'
  return `${value.slice(0, 3)}…${value.slice(-2)}`
}

function checkHttpCurl(url) {
  const bin = process.platform === 'win32' ? 'curl.exe' : 'curl'
  const result = spawnSync(bin, ['-sI', '-m', '20', '-L', url], { encoding: 'utf8' })
  const out = `${result.stdout || ''}\n${result.stderr || ''}`
  const statusMatch = out.match(/^HTTP\/[\d.]+ (\d+)/m)
  const status = statusMatch ? Number(statusMatch[1]) : 0
  const location = out.match(/^Location:\s*(\S+)/im)?.[1]?.trim()
  const ok = status >= 200 && status < 400
  return { ok, status, url: location || url }
}

export async function checkHttp(url, { allowRedirect = true, expectHtml = false } = {}) {
  try {
    const response = await fetch(url, { method: 'GET', redirect: 'follow' })
    const ok =
      response.ok ||
      (allowRedirect && [301, 302, 307, 308].includes(response.status))
    let title = ''
    if (expectHtml && response.ok) {
      const text = await response.text()
      title = text.includes('MOXT') ? 'MOXT' : text.slice(0, 40)
    }
    return {
      ok,
      status: response.status,
      url: response.url,
      title,
    }
  } catch {
    const viaCurl = checkHttpCurl(url)
    if (!viaCurl.ok && !allowRedirect) return viaCurl
    const redirectLoop =
      viaCurl.status >= 300 &&
      viaCurl.status < 400 &&
      viaCurl.url &&
      viaCurl.url.replace(/\?.*$/, '') === url.replace(/\?.*$/, '')
    if (redirectLoop) {
      return { ok: false, status: viaCurl.status, error: 'redirect loop' }
    }
    if (viaCurl.ok || [301, 302, 307, 308].includes(viaCurl.status)) {
      return { ...viaCurl, title: viaCurl.ok && expectHtml ? 'MOXT' : '' }
    }
    return { ok: false, status: viaCurl.status, error: 'fetch failed' }
  }
}

export function checkYcCli() {
  try {
    ensureYc()
    const { code, stdout, stderr } = ycRun(['config', 'list'])
    const folder = stdout.match(/^folder-id:\s*(\S+)/m)?.[1] || null
    return {
      ok: code === 0,
      folder,
      detail: code === 0 ? `folder-id=${folder}` : stderr || stdout,
    }
  } catch (err) {
    return { ok: false, detail: err.message }
  }
}

export function checkPhase2Env() {
  const env = loadPhase2Env()
  const required = [
    'MOXT_POSTBOX_SMTP_USER',
    'MOXT_POSTBOX_SMTP_PASS',
    'MOXT_POSTBOX_FROM',
    'MOXT_CDN_RESOURCE_ID',
    'MOXT_REGRU_USERNAME',
    'MOXT_REGRU_PASSWORD',
  ]
  const missing = required.filter((k) => !env[k])
  return {
    ok: missing.length === 0,
    missing,
    cdnId: env.MOXT_CDN_RESOURCE_ID || null,
    regruUser: env.MOXT_REGRU_USERNAME || null,
  }
}

export function checkCdn(resourceId) {
  if (!resourceId) return { ok: false, detail: 'MOXT_CDN_RESOURCE_ID manquant' }
  try {
    const r = ycJson('cdn', 'resource', 'get', resourceId)
    const ssl = r.ssl_certificate?.status || 'UNKNOWN'
    const host = r.options?.host_options?.host?.value || '(défaut)'
    const rewriteFlag = (r.options?.rewrite?.flag || '').toUpperCase()
    const rewrite = r.options?.rewrite?.enabled
      ? `${r.options.rewrite.body} [${r.options.rewrite.flag}]`
      : 'aucun'
    const rewriteDangerous = rewriteFlag === 'PERMANENT' || rewriteFlag === 'LAST'
    const storageHost = `${bucket}.storage.yandexcloud.net`
    let originSource = '(inconnu)'
    let originOk = false
    if (r.origin_group_id) {
      const group = ycJson('cdn', 'origin-group', 'get', String(r.origin_group_id))
      const origin = group?.origins?.[0]
      originSource = origin?.source || '(vide)'
      originOk =
        originSource === storageHost && origin?.meta?.bucket?.name === bucket
    }
    const hostOk = host === storageHost
    const rewriteOk =
      r.options?.rewrite?.enabled &&
      r.options?.rewrite?.body === SPA_REWRITE_BODY &&
      rewriteFlag === 'BREAK'
    return {
      ok:
        r.active === true &&
        ssl === 'READY' &&
        !rewriteDangerous &&
        originOk &&
        hostOk &&
        rewriteOk,
      id: r.id,
      cname: r.cname,
      providerCname: r.provider_cname,
      ssl,
      host,
      hostOk,
      originSource,
      originOk,
      rewrite,
      rewriteOk,
      rewriteDangerous,
      www: r.secondary_hostnames || [],
    }
  } catch (err) {
    return { ok: false, detail: err.message }
  }
}

export async function checkRegruApi(credentials) {
  if (!credentials.username || !credentials.password) {
    return { ok: false, detail: 'Identifiants REG.RU manquants' }
  }
  try {
    const records = await getResourceRecords(domain, credentials)
    return { ok: true, recordCount: records.length, records }
  } catch (err) {
    return { ok: false, detail: err.message }
  }
}

export async function checkDnsRecords(providerCname, records = []) {
  const cnameTarget = String(providerCname || '').replace(/\.$/, '')
  const wwwCname = records.find(
    (r) => r.rectype === 'CNAME' && (r.subname === 'www' || r.subname === wwwDomain),
  )
  const apexA = records.filter(
    (r) => r.rectype === 'A' && (r.subname === '@' || r.subname === domain || r.subname === ''),
  )
  const expectedIps = cnameTarget ? await resolveCdnIpv4(cnameTarget) : []
  const wwwOk =
    wwwCname && String(wwwCname.content).replace(/\.$/, '') === cnameTarget
  const apexOk =
    apexA.length > 0 && apexA.every((r) => expectedIps.includes(r.content))
  let wwwResolve = []
  let apexResolve = []
  try {
    wwwResolve = await resolve4(wwwDomain)
  } catch {
    // ignore
  }
  try {
    apexResolve = await resolve4(domain)
  } catch {
    // ignore
  }
  const dnsConfigured = wwwOk && apexOk
  const dnsPropagated =
    apexResolve.length > 0 && apexResolve.some((ip) => expectedIps.includes(ip))
  return {
    ok: dnsConfigured,
    propagated: dnsPropagated,
    wwwCname: wwwCname?.content || null,
    apexA: apexA.map((r) => r.content),
    expectedIps,
    wwwResolve,
    apexResolve,
    wwwOk,
    apexOk,
  }
}

export async function runAllChecks({ resourceId } = {}) {
  const env = loadPhase2Env()
  const cdnId = resourceId || env.MOXT_CDN_RESOURCE_ID
  const regruCreds = loadRegruCredentials(env)

  const yc = checkYcCli()
  const phase2 = checkPhase2Env()
  const cdn = checkCdn(cdnId)
  const regru = await checkRegruApi(regruCreds)
  const dns = regru.ok
    ? await checkDnsRecords(cdn.providerCname, regru.records)
    : { ok: false, detail: regru.detail }

  const urls = [
    { name: 'Bucket website', url: `https://${bucket}.website.yandexcloud.net/`, critical: true },
    { name: 'www /', url: `https://${wwwDomain}/`, critical: true },
    { name: 'www /login', url: `https://${wwwDomain}/login`, critical: true },
    { name: 'www /index.html', url: `https://${wwwDomain}/index.html`, critical: true },
    { name: 'apex /', url: `https://${domain}/`, critical: false },
    { name: 'apex /index.html', url: `https://${domain}/index.html`, critical: false },
  ]

  const http = {}
  for (const item of urls) {
    http[item.name] = {
      ...item,
      ...(await checkHttp(item.url, { allowRedirect: true, expectHtml: item.url.endsWith('/') })),
    }
  }

  const criticalHttpOk = urls
    .filter((u) => u.critical)
    .every((u) => http[u.name].ok)

  const viteEnv = existsSync(path.join(root, 'moxt-react', '.env.local'))

  return {
    ok: yc.ok && phase2.ok && cdn.ok && regru.ok && dns.ok && criticalHttpOk,
    yc,
    phase2,
    cdn,
    regru,
    dns,
    http,
    viteEnv,
    domain,
    wwwDomain,
    bucket,
  }
}
