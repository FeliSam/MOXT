import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SITE_URL = (Deno.env.get('MOXT_SITE_URL') || 'https://moxtapp.ru').replace(/\/$/, '')
const DEFAULT_OG_IMAGE = 'https://moxtapp.ru/assets/logos/X.png'
const SHARE_PUBLIC_ORIGIN = (Deno.env.get('MOXT_SHARE_ORIGIN') || 'https://share.moxtapp.ru').replace(/\/$/, '')

const KIND_LABELS: Record<string, string> = {
  listing: 'Marketplace',
  parcel: 'Colis',
  job: 'Emploi',
  event: 'Événement',
  post: 'Publication',
  video: 'Vidéo',
  p2p: 'P2P',
  business: 'Entreprise',
  user: 'Profil',
}

function xmlEscape(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

function wrapSvgText(text: string, maxChars = 34, maxLines = 3): string[] {
  const words = String(text || '').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean)
  if (!words.length) return ['MOXT']
  const lines: string[] = []
  let current = ''
  for (const word of words) {
    const next = current ? `${current} ${word}` : word
    if (next.length > maxChars && current) {
      lines.push(current)
      current = word
      if (lines.length >= maxLines) break
    } else {
      current = next
    }
  }
  if (lines.length < maxLines && current) lines.push(current)
  if (lines.length === maxLines) {
    const last = lines[maxLines - 1]
    if (last.length >= maxChars) lines[maxLines - 1] = `${last.slice(0, maxChars - 1).trim()}…`
  }
  return lines.slice(0, maxLines)
}

/** Carte OG 1200×630 (SVG) — titre + type + branding quand aucune photo. */
function buildOgCardSvg(meta: { title: string; description?: string; kind?: string }) {
  const kindLabel = KIND_LABELS[String(meta.kind || '')] || 'MOXT'
  const titleLines = wrapSvgText(String(meta.title || 'MOXT').replace(/\s*·\s*MOXT$/i, '').trim() || 'MOXT', 32, 3)
  const desc = String(meta.description || '').replace(/\s+/g, ' ').trim().slice(0, 90)
  const titleTspans = titleLines
    .map((line, i) => `<tspan x="72" dy="${i === 0 ? 0 : 58}">${xmlEscape(line)}</tspan>`)
    .join('')
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#064e3b"/>
      <stop offset="55%" stop-color="#08705f"/>
      <stop offset="100%" stop-color="#0e7490"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <circle cx="1080" cy="90" r="160" fill="#ffffff" fill-opacity="0.06"/>
  <circle cx="160" cy="560" r="200" fill="#ffffff" fill-opacity="0.05"/>
  <rect x="48" y="48" width="1104" height="534" rx="28" fill="#ffffff" fill-opacity="0.08" stroke="#ffffff" stroke-opacity="0.18" stroke-width="2"/>
  <text x="72" y="110" font-family="Inter, system-ui, sans-serif" font-size="28" font-weight="800" fill="#a7f3d0" letter-spacing="0.08em">${xmlEscape(kindLabel.toUpperCase())}</text>
  <text x="72" y="250" font-family="Inter, system-ui, sans-serif" font-size="52" font-weight="900" fill="#ffffff">${titleTspans}</text>
  <text x="72" y="470" font-family="Inter, system-ui, sans-serif" font-size="26" font-weight="600" fill="#d1fae5">${xmlEscape(desc)}</text>
  <text x="72" y="540" font-family="Inter, system-ui, sans-serif" font-size="34" font-weight="900" fill="#ffffff">MOXT</text>
  <text x="180" y="540" font-family="Inter, system-ui, sans-serif" font-size="22" font-weight="600" fill="#a7f3d0">CONNECTER · ÉCHANGER · AVANCER</text>
</svg>`
}

function buildOgCardUrl(kind: string, entityId: string) {
  // Prefer share.moxtapp.ru once infra/share-html-proxy passes image/* for og-card.
  // Until that Cloud Function version is live, serve PNG from the Edge Function
  // so WhatsApp/Facebook get Content-Type: image/png (not text/html from the proxy).
  const viaShareHost = (Deno.env.get('MOXT_OG_CARD_VIA_SHARE_HOST') || '') === '1'
  const path = `og-card/${encodeURIComponent(kind)}/${encodeURIComponent(entityId)}`
  if (viaShareHost) {
    return `${SHARE_PUBLIC_ORIGIN}/share/${path}`
  }
  const supabaseUrl = (Deno.env.get('SUPABASE_URL') || '').replace(/\/$/, '')
  if (supabaseUrl) {
    return `${supabaseUrl}/functions/v1/share-preview/${path}`
  }
  return `${SHARE_PUBLIC_ORIGIN}/share/${path}`
}

/**
 * Render OG card as PNG for WhatsApp/Facebook (they ignore SVG og:image).
 * Uses @resvg/resvg-wasm from esm.sh + Inter Variable fontBuffers (Edge has no
 * system fonts; loadSystemFonts:false alone produced blank gradient cards).
 * Falls back to SVG if wasm/font/render fails.
 * NOTE: If the HTML proxy on share.moxtapp.ru still forces text/html, redeploy
 * infra/share-html-proxy so /share/og-card/* passes through image/* + base64.
 */
let resvgReady: Promise<any> | null = null
let ogCardFontReady: Promise<Uint8Array | null> | null = null

/** Inter Variable — needed because Edge has no system fonts; without this PNG is gradient-only. */
const OG_CARD_FONT_URL =
  Deno.env.get('MOXT_OG_CARD_FONT_URL') ||
  'https://cdn.jsdelivr.net/gh/rsms/inter@v4.1/docs/font-files/InterVariable.ttf'

async function getResvg() {
  if (!resvgReady) {
    resvgReady = (async () => {
      const mod = await import('https://esm.sh/@resvg/resvg-wasm@2.6.2')
      const wasmUrl = 'https://esm.sh/@resvg/resvg-wasm@2.6.2/index_bg.wasm'
      await mod.initWasm(fetch(wasmUrl))
      return mod
    })()
  }
  return resvgReady
}

async function getOgCardFontBuffer(): Promise<Uint8Array | null> {
  if (!ogCardFontReady) {
    ogCardFontReady = (async () => {
      try {
        const res = await fetch(OG_CARD_FONT_URL)
        if (!res.ok) {
          console.error('[share-preview] font fetch failed', res.status, OG_CARD_FONT_URL)
          return null
        }
        return new Uint8Array(await res.arrayBuffer())
      } catch (err) {
        console.error('[share-preview] font fetch error', err)
        return null
      }
    })()
  }
  return ogCardFontReady
}

async function renderOgCardPng(svg: string): Promise<Uint8Array | null> {
  try {
    const [mod, fontBuffer] = await Promise.all([getResvg(), getOgCardFontBuffer()])
    if (!fontBuffer?.length) {
      console.error('[share-preview] png render skipped: no font buffer')
      return null
    }
    const resvg = new mod.Resvg(svg, {
      fitTo: { mode: 'width', value: 1200 },
      font: {
        fontBuffers: [fontBuffer],
        defaultFontFamily: 'Inter',
      },
    })
    const rendered = resvg.render()
    const png = rendered.asPng()
    rendered.free()
    resvg.free()
    return png
  } catch (err) {
    console.error('[share-preview] png render failed, falling back to SVG', err)
    return null
  }
}

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
    image: image === DEFAULT_OG_IMAGE ? buildOgCardUrl(kind, entityId) : image,
    targetUrl: `${SITE_URL}${targetPath}`,
    kind,
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


function parseOgCardPath(pathname: string) {
  const parts = pathname.split('/').filter(Boolean)
  const fnIndex = parts.indexOf('share-preview')
  const slice = fnIndex >= 0 ? parts.slice(fnIndex + 1) : parts
  const shareIndex = slice.indexOf('share')
  const path = shareIndex >= 0 ? slice.slice(shareIndex + 1) : slice
  if (path[0] !== 'og-card' || path.length < 3) return null
  const kind = normalizeShareKind(decodeURIComponent(path[1] || ''))
  const entityId = decodeURIComponent(path.slice(2).join('/'))
  if (!SHARE_KINDS.has(kind) || !entityId) return null
  return { kind, entityId }
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
    const ogParsed = parseOgCardPath(url.pathname)
    if (ogParsed) {
      const meta = await resolveShareMeta(ogParsed.kind, ogParsed.entityId)
      const title = meta?.title || 'MOXT'
      const description = meta?.description || ''
      const svg = buildOgCardSvg({ title, description, kind: ogParsed.kind })
      const png = await renderOgCardPng(svg)
      if (png) {
        const headers = {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=300',
          'Access-Control-Allow-Origin': '*',
        }
        if (req.method === 'HEAD') return new Response(null, { status: 200, headers })
        return new Response(png, { headers })
      }
      // Fallback SVG — WhatsApp/Facebook often skip SVG og:image; prefer PNG path above.
      const headers = {
        'Content-Type': 'image/svg+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=300',
        'Access-Control-Allow-Origin': '*',
        'X-MOXT-OG-Fallback': 'svg',
      }
      if (req.method === 'HEAD') return new Response(null, { status: 200, headers })
      return new Response(svg, { headers })
    }

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
