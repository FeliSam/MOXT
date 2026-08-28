/** Origines autorisées pour les Edge Functions appelées depuis le navigateur. */
export const MOXT_ALLOWED_ORIGINS = new Set([
  'https://moxtapp.ru',
  'https://www.moxtapp.ru',
  'https://moxtapp-web.website.yandexcloud.net',
  'https://localhost',
  'capacitor://localhost',
  'http://localhost',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
])

/** Vite `--host` et prévisualisation LAN (ex. http://192.168.0.103:5173). */
export function isAllowedBrowserOrigin(origin: string) {
  if (!origin) return false
  if (MOXT_ALLOWED_ORIGINS.has(origin)) return true
  try {
    const url = new URL(origin)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return false
    const host = url.hostname.replace(/^\[|\]$/g, '')
    if (host === 'localhost' || host === '127.0.0.1' || host === '::1') return true
    if (/^192\.168(?:\.\d{1,3}){2}$/.test(host)) return true
    if (/^10(?:\.\d{1,3}){3}$/.test(host)) return true
    if (/^172\.(1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2}$/.test(host)) return true
    return false
  } catch {
    return false
  }
}

export function corsHeadersFor(
  req: Request,
  extraAllowHeaders = 'authorization, x-client-info, apikey, content-type',
) {
  const origin = req.headers.get('origin') || ''
  const allow = isAllowedBrowserOrigin(origin) ? origin : 'https://moxtapp.ru'
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Headers': extraAllowHeaders,
    Vary: 'Origin',
  }
}

export function corsPreflight(req: Request, extraAllowHeaders?: string) {
  return new Response('ok', {
    headers: corsHeadersFor(req, extraAllowHeaders),
  })
}
