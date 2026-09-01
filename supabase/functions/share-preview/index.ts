import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SITE_URL = (Deno.env.get('MOXT_SITE_URL') || 'https://moxtapp.ru').replace(/\/$/, '')
const DEFAULT_OG_IMAGE = 'https://moxtapp.ru/assets/logos/X.png'
const SHARE_KINDS = new Set(['listing', 'parcel', 'job', 'event', 'post', 'video', 'p2p'])

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

function pickShareImage(candidates: unknown[]) {
  for (const value of candidates) {
    const url = String(value || '').trim()
    if (url.startsWith('https://') || url.startsWith('http://')) return url
  }
  return DEFAULT_OG_IMAGE
}

function firstImage(row: Record<string, unknown>, keys = ['images', 'image_url', 'thumbnail_url']) {
  for (const key of keys) {
    const raw = row?.[key]
    if (Array.isArray(raw)) {
      const hit = raw.map((item) => String(item || '').trim()).find(Boolean)
      if (hit) return hit
    }
    if (typeof raw === 'string' && raw.trim()) return raw.trim()
  }
  return ''
}

function resolveTargetPath(kind: string, entityId: string) {
  if (kind === 'listing') return `/marketplace/${entityId}`
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
  }
  const table = tableByKind[kind]
  if (!table) return null

  const { data, error } = await client.from(table).select('*').eq('id', entityId).maybeSingle()
  if (error || !data) return null

  if (kind === 'listing' && data.status !== 'active') return null
  if (kind === 'parcel' && !['active', 'full'].includes(String(data.status || ''))) return null
  if (kind === 'job' && data.status !== 'active') return null
  if (kind === 'event' && data.status !== 'published') return null
  if (kind === 'post' && data.status !== 'published') return null
  if (kind === 'video' && data.status !== 'active') return null
  if (kind === 'p2p' && !['active', 'open'].includes(String(data.status || ''))) return null

  const title =
    String(data.title || data.name || data.route || data.company_name || '').trim() || 'MOXT'
  const description = truncateShareText(
    data.description || data.caption || data.notes || data.conditions || data.summary || title,
  )
  const image = pickShareImage([firstImage(data), firstImage(data, ['thumbnail_url']), firstImage(data, ['image_url'])])
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
  <meta property="og:url" content="${targetUrl}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${image}" />
  <meta http-equiv="refresh" content="0;url=${targetUrl}" />
  <link rel="canonical" href="${targetUrl}" />
</head>
<body>
  <p><a href="${targetUrl}">Ouvrir sur MOXT</a></p>
  <script>window.location.replace(${JSON.stringify(meta.targetUrl)})</script>
</body>
</html>`
}

function parseSharePath(pathname: string) {
  const parts = pathname.split('/').filter(Boolean)
  const fnIndex = parts.indexOf('share-preview')
  const slice = fnIndex >= 0 ? parts.slice(fnIndex + 1) : parts
  if (slice.length < 2) return null
  const kind = decodeURIComponent(slice[0] || '')
  const entityId = decodeURIComponent(slice.slice(1).join('/'))
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

  if (req.method !== 'GET') {
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

    return new Response(renderPreviewHtml(payload), {
      headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=300' },
    })
  } catch (error) {
    console.error('[share-preview]', error)
    return new Response('Internal error', { status: 500 })
  }
})
