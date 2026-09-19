/**
 * Yandex Cloud Function: crawler-only OG for moxtapp.ru entity paths.
 *
 * - Known crawler UA on /parcels/:id, /marketplace/:id, … → share-preview HTML
 * - Everyone else (browsers) → SPA index.html from website origin
 *
 * NEVER enable CDN nuclear rewrite (^/(.*)$ → index.html). This shield is the
 * safe UA-aware alternative. See docs/site-path-og-crawlers.md.
 */
const UPSTREAM =
  process.env.SHARE_PREVIEW_UPSTREAM ||
  'https://rbvqfkccbkwjxkvpnwqn.supabase.co/functions/v1/share-preview'
const SPA_ORIGIN =
  process.env.SPA_WEBSITE_ORIGIN ||
  'https://moxtapp-web.website.yandexcloud.net'
const SITE_URL = (process.env.MOXT_SITE_URL || 'https://moxtapp.ru').replace(/\/$/, '')

const RESERVED = new Set(['mine', 'publish', 'edit', 'applications', 'new', 'history', 'orders'])

const SECTION_TO_KIND = {
  marketplace: 'listing',
  parcels: 'parcel',
  colis: 'parcel',
  jobs: 'job',
  events: 'event',
  businesses: 'business',
  users: 'user',
  p2p: 'p2p',
  news: 'post',
}

const KIND_ALIASES = {
  profile: 'user',
  profiles: 'user',
  users: 'user',
  listings: 'listing',
  parcels: 'parcel',
  colis: 'parcel',
  jobs: 'job',
  events: 'event',
  businesses: 'business',
  posts: 'post',
  videos: 'video',
}

function normalizeKind(kind) {
  const raw = String(kind || '').trim().toLowerCase()
  if (!raw) return ''
  return KIND_ALIASES[raw] || raw
}

function parseAppEntityPath(pathname, search) {
  const rawPath = String(pathname || '').split('?')[0]
  const path = rawPath.startsWith('/') ? rawPath : `/${rawPath}`
  const parts = path.split('/').filter(Boolean)
  if (!parts.length) return null

  const section = parts[0]
  const rest = parts.slice(1)

  if (section === 'feed') {
    const q = String(search || '')
    const params = new URLSearchParams(q.startsWith('?') ? q.slice(1) : q)
    const item = String(params.get('item') || '').trim()
    if (!item) return null
    const colon = item.indexOf(':')
    if (colon <= 0) return null
    const kind = normalizeKind(item.slice(0, colon))
    const entityId = item.slice(colon + 1).trim()
    if (!kind || !entityId) return null
    return { kind, entityId }
  }

  if (rest.length < 1) return null
  const id = decodeURIComponent(rest[0] || '').trim()
  if (!id || RESERVED.has(id.toLowerCase())) return null
  if (rest[1] && RESERVED.has(String(rest[1]).toLowerCase())) return null

  const kind = SECTION_TO_KIND[section]
  if (!kind) return null
  if (section === 'p2p' && id.toLowerCase() === 'orders') return null
  return { kind, entityId: id }
}

function isShareCrawler(userAgent) {
  return /bot|crawler|spider|facebookexternalhit|whatsapp|telegram|twitter|slack|linkedin|discord|preview|embedly|vkshare|pinterest|skypeuripreview/i.test(
    String(userAgent || ''),
  )
}

function pickPath(event) {
  const params = event.params || event.pathParameters || {}
  if (params.proxy || params['proxy+']) {
    return '/' + String(params.proxy || params['proxy+']).replace(/^\/+/, '')
  }
  const candidates = [
    event.path,
    event.url,
    event.requestContext && event.requestContext.path,
    event.headers && (event.headers['x-yc-apigateway-path'] || event.headers['X-Yc-Apigateway-Path']),
  ]
  for (const c of candidates) {
    if (!c) continue
    try {
      if (String(c).startsWith('http')) return new URL(String(c)).pathname
    } catch (_) {}
    const s = String(c)
    if (s.startsWith('/')) return s.split('?')[0]
  }
  return '/'
}

function pickSearch(event) {
  if (event.multiValueQueryStringParameters || event.queryStringParameters) {
    const q = event.queryStringParameters || {}
    const usp = new URLSearchParams()
    for (const [k, v] of Object.entries(q)) {
      if (v != null) usp.set(k, String(v))
    }
    const s = usp.toString()
    return s ? `?${s}` : ''
  }
  const candidates = [event.url, event.path]
  for (const c of candidates) {
    if (!c) continue
    try {
      if (String(c).includes('?')) {
        if (String(c).startsWith('http')) return new URL(String(c)).search
        return '?' + String(c).split('?').slice(1).join('?')
      }
    } catch (_) {}
  }
  return ''
}

async function fetchSpaIndex(method) {
  const upstream = await fetch(`${SPA_ORIGIN.replace(/\/$/, '')}/index.html`, {
    method: 'GET',
    headers: { Accept: 'text/html', 'User-Agent': 'MOXT-SiteOgShield/1.0' },
    redirect: 'follow',
  })
  const html = await upstream.text()
  const headers = {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'no-cache, must-revalidate',
    'X-MOXT-OG-Shield': 'spa',
  }
  if (method === 'HEAD') return { statusCode: 200, headers, body: '' }
  return { statusCode: 200, headers, body: html }
}

async function fetchSharePreview(kind, entityId, ua, method) {
  const url = `${UPSTREAM.replace(/\/$/, '')}/${encodeURIComponent(kind)}/${encodeURIComponent(entityId)}`
  const upstream = await fetch(url, {
    method: 'GET',
    headers: { 'User-Agent': ua, Accept: 'text/html,*/*' },
    redirect: 'manual',
  })
  // share-preview redirects non-crawlers; we already filtered crawlers, but handle anyway
  if (upstream.status >= 300 && upstream.status < 400) {
    const loc = upstream.headers.get('location') || `${SITE_URL}/`
    return {
      statusCode: upstream.status,
      headers: { Location: loc, 'Cache-Control': 'public, max-age=60', 'X-MOXT-OG-Shield': 'redirect' },
      body: '',
    }
  }
  const html = await upstream.text()
  const headers = {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'public, max-age=120',
    'X-MOXT-OG-Shield': 'og',
  }
  if (method === 'HEAD') return { statusCode: upstream.status || 200, headers, body: '' }
  return { statusCode: upstream.status || 200, headers, body: html }
}

exports.handler = async function (event) {
  try {
    const method = String(
      event.httpMethod || (event.requestContext && event.requestContext.httpMethod) || 'GET',
    ).toUpperCase()
    if (method !== 'GET' && method !== 'HEAD') {
      return { statusCode: 405, headers: { 'Content-Type': 'text/plain' }, body: 'Method not allowed' }
    }

    const headersIn = event.headers || {}
    const ua = headersIn['User-Agent'] || headersIn['user-agent'] || ''
    const pathname = pickPath(event)
    const search = pickSearch(event)
    const entity = parseAppEntityPath(pathname, search)

    if (entity && isShareCrawler(ua)) {
      return await fetchSharePreview(entity.kind, entity.entityId, ua, method)
    }

    // Browsers + non-entity paths: SPA shell (CDN/website index/error already does this;
    // shield keeps entity routes from breaking when gateway fronts them).
    return await fetchSpaIndex(method)
  } catch (err) {
    console.error('[site-og-shield]', err)
    return { statusCode: 500, headers: { 'Content-Type': 'text/plain' }, body: 'Internal error' }
  }
}
