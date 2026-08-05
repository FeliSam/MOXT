const SUPPORTED = new Set(['fr', 'en', 'ru', 'pt', 'es'])

export type LibreTranslateResult = {
  text: string
  error?: string
  status?: number
}

export type LibreDetectResult = {
  language: string | null
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
  sourceLang?: string | null,
): Promise<LibreTranslateResult> {
  const target = String(targetLang || '').toLowerCase()
  if (!isSupportedTargetLang(target)) {
    return { text: '', error: 'Langue cible non supportée', status: 400 }
  }

  const source =
    sourceLang && isSupportedTargetLang(sourceLang) && sourceLang !== target
      ? sourceLang
      : 'auto'

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
        source,
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

/** Détection automatique via LibreTranslate (/detect). */
export async function detectViaLibreTranslate(text: string): Promise<LibreDetectResult> {
  const sample = String(text || '').trim()
  if (sample.length < 2) {
    return { language: null, error: 'Texte trop court', status: 400 }
  }

  const endpoint = baseUrl()
  if (!endpoint) {
    return { language: null, error: 'Détection indisponible', status: 503 }
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 12_000)

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    }
    const key = apiKey()
    if (key) headers['X-API-Key'] = key

    const response = await fetch(`${endpoint}/detect`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ q: sample }),
      signal: controller.signal,
    })

    const raw = await response.text()
    let data: unknown = []
    try {
      data = raw ? JSON.parse(raw) : []
    } catch {
      return {
        language: null,
        error: response.ok ? 'Réponse détection invalide.' : `Détecteur HTTP ${response.status}`,
        status: 502,
      }
    }

    if (!response.ok) {
      const detail =
        typeof data === 'object' &&
        data !== null &&
        'error' in data &&
        typeof (data as { error?: unknown }).error === 'string'
          ? String((data as { error: string }).error)
          : `Détecteur HTTP ${response.status}`
      return { language: null, error: detail, status: 502 }
    }

    const first = Array.isArray(data) ? data[0] : null
    const language =
      first && typeof first === 'object' && first !== null && 'language' in first
        ? String((first as { language?: unknown }).language || '').toLowerCase()
        : ''

    if (!language || !isSupportedTargetLang(language)) {
      return { language: null }
    }

    return { language }
  } catch (err) {
    const aborted = err instanceof Error && err.name === 'AbortError'
    return {
      language: null,
      error: aborted ? 'La détection met trop longtemps.' : 'Erreur de détection',
      status: aborted ? 504 : 500,
    }
  } finally {
    clearTimeout(timer)
  }
}
