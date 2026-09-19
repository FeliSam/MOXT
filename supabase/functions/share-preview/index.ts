import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SITE_URL = (Deno.env.get('MOXT_SITE_URL') || 'https://moxtapp.ru').replace(/\/$/, '')
const DEFAULT_OG_IMAGE = 'https://moxtapp.ru/assets/logos/X.png'
const SHARE_KINDS = new Set([
  'listing',
  'parcel',
  'job',
  'event',
  'post',
  'video',
  'p2p',
  'business',
  'user',
])

/** Path aliases (FR app copy, plurals) → canonical SHARE_KINDS. */
const SHARE_KIND_ALIASES: Record<string, string> = {
  profile: 'user',
  profiles: 'user',
  users: 'user',
  listings: 'listing',
  annonce: 'listing',
  annonces: 'listing',
  videos: 'video',
  posts: 'post',
  parcels: 'parcel',
  colis: 'parcel',
  coliss: 'parcel',
  jobs: 'job',
  emploi: 'job',
  emplois: 'job',
  events: 'event',
  evenement: 'event',
  evenements: 'event',
  businesses: 'business',
  entreprise: 'business',
  entreprises: 'business',
}

function normalizeShareKind(kind: string) {
  const raw = String(kind || '').trim().toLowerCase()
  if (!raw) return ''
  return SHARE_KIND_ALIASES[raw] || raw
}

function htmlEscape(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

function truncateShareText(value, max = 180) {
  const text = String(value || '').replace(/\s+/g, ' ').trim()
  if (text.length <= max) return text
  return `${text.slice(0, max - 1).trim()}…`
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function parseMaybeJson(value: unknown): unknown {
  if (typeof value !== 'string') return value
  const trimmed = value.trim()
  if (!trimmed || (trimmed[0] !== '{' && trimmed[0] !== '[')) return value
  try {
    return JSON.parse(trimmed)
  } catch {
    return value
  }
}

function collectImageUrls(value: unknown, out: string[] = []): string[] {
  if (value == null) return out
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return out
    const parsed = parseMaybeJson(trimmed)
    if (parsed !== trimmed) return collectImageUrls(parsed, out)
    if (trimmed.startsWith('https://') || trimmed.startsWith('http://')) out.push(trimmed)
    return out
  }
  if (Array.isArray(value)) {
    for (const item of value) collectImageUrls(item, out)
    return out
  }
  const obj = asRecord(value)
  if (!obj) return out
  for (const key of ['url', 'src', 'image', 'image_url', 'thumbnail_url', 'href']) {
    if (obj[key] != null) collectImageUrls(obj[key], out)
  }
  if (obj.images != null) collectImageUrls(obj.images, out)
  return out
}

function pickShareImage(candidates: unknown[]) {
  for (const value of candidates) {
    const urls = collectImageUrls(value)
    if (urls[0]) return urls[0]
  }
  return DEFAULT_OG_IMAGE
}

function firstImage(row: Record<string, unknown>, keys = ['images', 'image_url', 'thumbnail_url']) {
  for (const key of keys) {
    const urls = collectImageUrls(row?.[key])
    if (urls[0]) return urls[0]
  }
  return ''
}

function payloadImages(row: Record<string, unknown>) {
  const payload = asRecord(parseMaybeJson(row?.payload))
  if (!payload) return ''
  return firstImage(payload, ['images', 'image_url', 'thumbnail_url', 'cover_url', 'photo_url'])
}

function programImages(row: Record<string, unknown>) {
  const program = parseMaybeJson(row?.program)
  const asObj = asRecord(program)
  if (asObj) return firstImage(asObj, ['images', 'image_url', 'cover_url', 'thumbnail_url'])
  return collectImageUrls(program)[0] || ''
}

function parcelRouteTitle(row: Record<string, unknown>) {
  const origin = String(row.origin || row.from || row.from_city || '').trim()
  const destination = String(row.destination || row.to || row.to_city || '').trim()
  if (origin && destination) return `${origin} → ${destination}`
  if (origin) return `Colis depuis ${origin}`
  if (destination) return `Colis vers ${destination}`
  return ''
}

function resolveTargetPath(kind: string, entityId: string) {
  if (kind === 'listing') return `/marketplace/${entityId}`
  if (kind === 'business') return `/businesses/${entityId}`
  if (kind === 'user') return `/users/${entityId}/publications`
  if (kind === 'parcel') return `/parcels/${entityId}`
  if (kind === 'job') return `/jobs/${entityId}`
  if (kind === 'event') return `/events/${entityId}`
  if (kind === 'p2p') return `/p2p/${entityId}`
  if (kind === 'video') {
    return `/feed?type=video&item=${encodeURIComponent(`video:${entityId}`)}`
  }
  return `/feed?item=${encodeURIComponent(`${kind}:${entityId}`)}`
}

async function serviceClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !serviceKey) throw new Error('supabase_env_missing')
  return createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

async function resolveShareMeta(kind: string, entityId: string) {
  const client = await serviceClient()
  const tableByKind: Record<string, string> = {
    listing: 'listings',
    parcel: 'parcels',
    job: 'jobs',
    event: 'events',
    post: 'posts',
    video: 'videos',
    p2p: 'p2p_offers',
    business: 'businesses',
    user: 'profiles',
  }
  const table = tableByKind[kind]
  if (!table) return null

  const { data, error } = await client.from(table).select('*').eq('id', entityId).maybeSingle()
  if (error || !data) return null

  if (kind === 'listing' && data.status !== 'active') return null
  if (kind === 'parcel' && !['active', 'full'].includes(String(data.status || ''))) return null
  // Keep status gate for jobs — archived seed rows stay on generic discover fallback.
  if (kind === 'job' && data.status !== 'active') return null
  if (kind === 'event' && data.status !== 'published') return null
  if (kind === 'post' && data.status !== 'published') return null
  if (kind === 'video' && data.status !== 'active') return null
  if (kind === 'p2p' && !['active', 'open'].includes(String(data.status || ''))) return null
  if (kind === 'business' && !['verified', 'approved', 'active'].includes(String(data.status || ''))) {
    return null
  }
  if (kind === 'user' && String(data.activity_visibility || 'public') !== 'public') return null

  let title =
    String(data.title || data.name || data.route || data.company_name || '').trim() || 'MOXT'
  if (kind === 'parcel') {
    title = parcelRouteTitle(data) || title
  }
  if (kind === 'user') {
    const full = `${data.first_name || ''} ${data.last_name || ''}`.trim()
    title = full || title
  }

  const description = truncateShareText(
    data.description ||
      data.caption ||
      data.notes ||
      data.conditions ||
      data.summary ||
      data.bio ||
      title,
  )

  const image = pickShareImage([
    kind === 'parcel' ? data.travel_proof_url : '',
    kind === 'event' ? programImages(data) : '',
    kind === 'job' || kind === 'event' || kind === 'parcel' ? payloadImages(data) : '',
    firstImage(data),
    firstImage(data, ['travel_proof_url', 'thumbnail_url', 'logo_url', 'avatar_url', 'cover_url']),
    firstImage(data, ['image_url']),
    programImages(data),
    payloadImages(data),
  ])
  const targetPath = resolveTargetPath(kind, entityId)

  return {
    title: `${title} · MOXT`,
    description,
    image,
    targetUrl: `${SITE_URL}${targetPath}`,
  }
}

function renderPreviewHtml(meta: { title: string; description: string; image: string; targetUrl: string }) {
  const title = htmlEscape(meta.title)
  const description = htmlEscape(meta.description)
  const image = htmlEscape(meta.image)
  const targetUrl = htmlEscape(meta.targetUrl)

  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <meta name="description" content="${description}" />
  <meta property="og:type" content="article" />
  <meta property="og:site_name" content="MOXT" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:image" content="${image}" />
  <meta property="og:image:secure_url" content="${image}" />
  <meta property="og:url" content="${targetUrl}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${image}" />
  <link rel="canonical" href="${targetUrl}" />
</head>
<body>
  <p><a href="${targetUrl}">Ouvrir sur MOXT</a></p>
</body>
</html>`
}

function parseSharePath(pathname: string) {
  const parts = pathname.split('/').filter(Boolean)
  const fnIndex = parts.indexOf('share-preview')
  const slice = fnIndex >= 0 ? parts.slice(fnIndex + 1) : parts
  // Accept /share/{kind}/{id} when gateway strips nothing, or bare kind/id.
  const shareIndex = slice.indexOf('share')
  const path = shareIndex >= 0 ? slice.slice(shareIndex + 1) : slice
  if (path.length < 2) return null
  const kind = normalizeShareKind(decodeURIComponent(path[0] || ''))
  const entityId = decodeURIComponent(path.slice(1).join('/'))
  if (!SHARE_KINDS.has(kind) || !entityId) return null
  return { kind, entityId }
}

function isShareCrawler(userAgent: string) {
  return /bot|crawler|spider|facebookexternalhit|whatsapp|telegram|twitter|slack|linkedin|discord|preview|embedly|vkshare|pinterest/i.test(
    userAgent,
  )
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'content-type',
      },
    })
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const url = new URL(req.url)
    const parsed = parseSharePath(url.pathname)
    if (!parsed) {
      return new Response('Not found', { status: 404 })
    }

    const meta = await resolveShareMeta(parsed.kind, parsed.entityId)
    const fallback = {
      title: 'MOXT',
      description: 'Découvrez cette publication sur MOXT.',
      image: DEFAULT_OG_IMAGE,
      targetUrl: `${SITE_URL}/discover`,
    }
    const payload = meta || fallback
    const userAgent = req.headers.get('user-agent') || ''

    if (!isShareCrawler(userAgent)) {
      return Response.redirect(payload.targetUrl, 302)
    }

    const html = renderPreviewHtml(payload)
    const headers = {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    }
    if (req.method === 'HEAD') {
      return new Response(null, { status: 200, headers })
    }
    return new Response(html, { headers })
  } catch (error) {
    console.error('[share-preview]', error)
    return new Response('Internal error', { status: 500 })
  }
})
