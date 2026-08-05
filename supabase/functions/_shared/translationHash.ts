const SUPPORTED = new Set(['fr', 'en', 'ru', 'pt', 'es'])

export function normalizeTranslationText(text: string) {
  return String(text || '')
    .trim()
    .replace(/\s+/g, ' ')
}

export function isSupportedTranslationLang(lang: string) {
  return SUPPORTED.has(String(lang || '').toLowerCase())
}

export async function translationContentHash(text: string, targetLang: string) {
  const normalized = normalizeTranslationText(text)
  const payload = `${String(targetLang).toLowerCase()}:${normalized}`
  const data = new TextEncoder().encode(payload)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}
