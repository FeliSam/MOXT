const SUPPORTED = new Set(['fr', 'en', 'ru', 'pt', 'es'])

export type LibreTranslateResult = {
  text: string
  error?: string
  status?: number
}

function baseUrl() {
  return (Deno.env.get('LIBRETRANSLATE_URL') || '').trim().replace(/\/+$/, '')
}

function apiKey() {
  return (Deno.env.get('LIBRETRANSLATE_API_KEY') || '').trim()
}

export function isSupportedTargetLang(lang: string) {
  return SUPPORTED.has(String(lang || '').toLowerCase())
}

/** Traduction via instance LibreTranslate self-hosted (budget zéro API). */
export async function translateViaLibreTranslate(
  text: string,
  targetLang: string,
): Promise<LibreTranslateResult> {
  const target = String(targetLang || '').toLowerCase()
  if (!isSupportedTargetLang(target)) {
    return { text: '', error: 'Langue cible non supportée', status: 400 }
  }

  const endpoint = baseUrl()
  if (!endpoint) {
    return {
      text: '',
      error: 'Traduction indisponible (LIBRETRANSLATE_URL non configurée).',
      status: 503,
    }
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 45_000)

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    }
    const key = apiKey()
    if (key) headers['X-API-Key'] = key

    const response = await fetch(`${endpoint}/translate`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        q: text,
        source: 'auto',
        target,
        format: 'text',
      }),
      signal: controller.signal,
    })

    const raw = await response.text()
    let data: Record<string, unknown> = {}
    try {
      data = raw ? JSON.parse(raw) : {}
    } catch {
      return {
        text: '',
        error: response.ok ? 'Réponse traducteur invalide.' : `Traducteur HTTP ${response.status}`,
        status: 502,
      }
    }

    if (!response.ok) {
      let detail =
        typeof data.error === 'string' ? data.error : `Traducteur HTTP ${response.status}`
      if (/api key/i.test(detail)) {
        detail =
          'Traducteur indisponible — configurez LIBRETRANSLATE_URL (instance self-hosted Yandex).'
      }
      return { text: '', error: detail, status: 502 }
    }

    const translated =
      typeof data.translatedText === 'string'
        ? data.translatedText.trim()
        : typeof data.translation === 'string'
          ? data.translation.trim()
          : ''

    if (!translated) {
      return { text: '', error: 'Traduction vide', status: 502 }
    }

    return { text: translated }
  } catch (err) {
    const aborted = err instanceof Error && err.name === 'AbortError'
    return {
      text: '',
      error: aborted ? 'La traduction met trop longtemps.' : 'Erreur de traduction',
      status: aborted ? 504 : 500,
    }
  } finally {
    clearTimeout(timer)
  }
}
