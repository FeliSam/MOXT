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

export function corsHeadersFor(
  req: Request,
  extraAllowHeaders = 'authorization, x-client-info, apikey, content-type',
) {
  const origin = req.headers.get('origin') || ''
  const allow = MOXT_ALLOWED_ORIGINS.has(origin) ? origin : 'https://moxtapp.ru'
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
