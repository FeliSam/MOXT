/**
 * Yandex Cloud Function: proxy Supabase share-preview.
 * - HTML share pages: force text/html (Supabase Edge often emits text/plain + nosniff).
 * - /share/og-card/* image cards: pass through image/png (or svg) as base64 so
 *   WhatsApp/Facebook can use og:image. Gateway path /share/{proxy+} already
 *   covers og-card the same as /share/{kind}/{id}.
 */
const UPSTREAM =
  process.env.SHARE_PREVIEW_UPSTREAM ||
  'https://rbvqfkccbkwjxkvpnwqn.supabase.co/functions/v1/share-preview'

function pickRest(event) {
  const params = event.params || event.pathParameters || {}
  let rest = params.proxy || params['proxy+'] || ''
  if (!rest) {
    const candidates = [
      event.path,
      event.url,
      event.requestContext && event.requestContext.path,
      event.headers && event.headers['x-yc-apigateway-path'],
    ]
    for (const c of candidates) {
      if (!c) continue
      const s = String(c)
      let m = s.match(/\/share\/(.+?)(?:\?|$)/)
      if (m) return m[1]
      m = s.match(/share-preview\/(.+)$/)
      if (m) return m[1]
    }
  }
  return String(rest || '').replace(/^\/+/, '')
}

exports.handler = async function (event) {
  try {
    const method = String(
      event.httpMethod || (event.requestContext && event.requestContext.httpMethod) || 'GET',
    ).toUpperCase()
    if (method !== 'GET' && method !== 'HEAD') {
      return { statusCode: 405, headers: { 'Content-Type': 'text/plain' }, body: 'Method not allowed' }
    }

    const rest = pickRest(event)
    if (!rest) {
      return { statusCode: 404, headers: { 'Content-Type': 'text/plain' }, body: 'Not found' }
    }

    const headersIn = event.headers || {}
    const ua = headersIn['User-Agent'] || headersIn['user-agent'] || 'MOXT-ShareProxy/1.0'
    const upstreamUrl = `${UPSTREAM.replace(/\/$/, '')}/${rest}`
    const upstream = await fetch(upstreamUrl, {
      method: 'GET',
      headers: { 'User-Agent': ua, Accept: 'image/*,text/html,*/*' },
      redirect: 'manual',
    })

    if (upstream.status >= 300 && upstream.status < 400) {
      return {
        statusCode: upstream.status,
        headers: {
          Location: upstream.headers.get('location') || 'https://moxtapp.ru',
          'Cache-Control': 'public, max-age=60',
        },
        body: '',
      }
    }

    const isOgCard = rest.startsWith('og-card/')
    if (isOgCard) {
      const buf = Buffer.from(await upstream.arrayBuffer())
      const isPng = buf.length >= 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47
      const upstreamCt = (upstream.headers.get('content-type') || '').toLowerCase()
      let contentType = 'image/png'
      if (isPng) contentType = 'image/png'
      else if (upstreamCt.includes('svg') || buf.slice(0, 200).toString('utf8').includes('<svg')) {
        contentType = 'image/svg+xml; charset=utf-8'
      } else if (upstreamCt.startsWith('image/')) {
        contentType = upstreamCt.split(';')[0]
      }
      const headers = {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=300',
        'Access-Control-Allow-Origin': '*',
      }
      if (method === 'HEAD') {
        return { statusCode: upstream.status || 200, headers, body: '' }
      }
      return {
        statusCode: upstream.status || 200,
        headers,
        isBase64Encoded: true,
        body: buf.toString('base64'),
      }
    }

    const html = await upstream.text()
    const headers = {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=60',
      'Access-Control-Allow-Origin': '*',
    }
    if (method === 'HEAD') {
      return { statusCode: upstream.status || 200, headers, body: '' }
    }
    return { statusCode: upstream.status || 200, headers, body: html }
  } catch (err) {
    console.error(err)
    return { statusCode: 500, headers: { 'Content-Type': 'text/plain' }, body: 'Internal error' }
  }
}
