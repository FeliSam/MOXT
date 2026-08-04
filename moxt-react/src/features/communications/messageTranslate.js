import { LANGUAGE_LABELS, SUPPORTED_LANGUAGES } from '../../config/uiTranslations'
import { supabase } from '../../services/supabaseClient'

const translationCache = new Map()
const MAX_AUTO_CHARS = 2000

export function translationCacheKey(messageId, targetLang) {
  return `${messageId}::${targetLang}`
}

export function getCachedTranslation(messageId, targetLang) {
  return translationCache.get(translationCacheKey(messageId, targetLang)) || null
}

export function setCachedTranslation(messageId, targetLang, translatedText) {
  const entry = { translatedText, targetLang, cachedAt: Date.now() }
  translationCache.set(translationCacheKey(messageId, targetLang), entry)
  return entry
}

export function clearTranslationCache() {
  translationCache.clear()
}

const WORD_MARKERS = {
  fr: /\b(le|la|les|un|une|des|je|tu|il|elle|nous|vous|ils|elles|est|sont|pas|pour|avec|dans|sur|merci|bonjour|salut|chez|très|bien|oui|non|c'est|qu'il|qu'elle)\b/gi,
  en: /\b(the|and|you|are|is|was|were|have|has|with|this|that|hello|thanks|thank|please|from|your|our|they|them|what|when|where|how|not|but|for)\b/gi,
  es: /\b(el|la|los|las|un|una|que|por|para|con|como|hola|gracias|está|están|qué|cómo|dónde|cuando|pero|muy|bien|sí|no|también)\b/gi,
  pt: /\b(o|a|os|as|um|uma|que|por|para|com|como|olá|obrigado|obrigada|está|estão|não|você|voce|muito|bem|sim|também|tambem)\b/gi,
}

function countMatches(pattern, text) {
  const matches = text.match(pattern)
  return matches ? matches.length : 0
}

export function detectMessageLanguage(text) {
  const sample = String(text || '').trim()
  if (sample.length < 3) return null

  const cleaned = sample
    .replace(/https?:\/\/\S+/gi, ' ')
    .replace(/@\w+/g, ' ')
    .replace(/\d+/g, ' ')

  if (/[\u0400-\u04FF]/.test(cleaned)) return 'ru'

  const lower = cleaned.toLowerCase()
  const scores = { fr: 0, en: 0, es: 0, pt: 0 }

  for (const [lang, pattern] of Object.entries(WORD_MARKERS)) {
    scores[lang] += countMatches(pattern, lower) * 2
  }

  scores.fr += countMatches(/[àâæçèéêëîïôùûü]/gi, lower) * 3
  scores.es += countMatches(/[ñ¿¡]/g, lower) * 4
  scores.pt += countMatches(/[ãõ]/g, lower) * 4
  if (/ção|ções|não|você|voce/.test(lower)) scores.pt += 5
  if (/ñ|ción|gracias|estás/.test(lower)) scores.es += 5

  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1])
  const [topLang, topScore] = ranked[0]
  const [, secondScore] = ranked[1] || ['', 0]

  if (topScore < 2) return null
  if (topScore === secondScore) return null
  if (secondScore >= 2 && topScore < secondScore * 1.35) return null

  return SUPPORTED_LANGUAGES.includes(topLang) ? topLang : null
}

/** Traduction auto si langue message ≠ langue UI i18n du lecteur. */
export function shouldAutoTranslate(text, readerLanguage) {
  const trimmed = String(text || '').trim()
  if (trimmed.length < 3 || trimmed.length > MAX_AUTO_CHARS) return false
  const reader = String(readerLanguage || '').toLowerCase()
  if (!SUPPORTED_LANGUAGES.includes(reader)) return false
  const detected = detectMessageLanguage(trimmed)
  if (!detected) return false
  return detected !== reader
}

export function languageLabel(code) {
  return LANGUAGE_LABELS[code]?.label || code
}

export function otherTranslateLanguages(currentLanguage) {
  const current = String(currentLanguage || '').toLowerCase()
  return SUPPORTED_LANGUAGES.filter((code) => code !== current)
}

/** Langues proposées dans le menu admin (toutes les langues MOXT). */
export function adminTranslateLanguageOptions() {
  return SUPPORTED_LANGUAGES
}

async function edgeFunctionErrorDetail(error) {
  let detail = error?.message || 'Erreur de traduction'
  if (error?.context && typeof error.context.json === 'function') {
    try {
      const body = await error.context.json()
      if (body?.error) return String(body.error)
    } catch {
      // keep generic detail
    }
  }
  return detail
}

export async function translateToLanguage({ messageId, text, targetLang }) {
  const trimmed = String(text || '').trim()
  const lang = String(targetLang || '').trim().toLowerCase()
  if (!trimmed || !messageId) throw new Error('empty')
  if (!SUPPORTED_LANGUAGES.includes(lang)) throw new Error('unsupported_lang')
  if (!supabase) throw new Error('supabase_unavailable')

  const cached = getCachedTranslation(messageId, lang)
  if (cached?.translatedText) return cached

  const { data, error } = await supabase.functions.invoke('translate-message', {
    body: { messageId, text: trimmed, targetLang: lang },
  })
  if (data?.error) throw new Error(String(data.error))
  if (error) throw new Error(await edgeFunctionErrorDetail(error))

  const translatedText = String(data?.translatedText || '').trim()
  if (!translatedText) throw new Error('empty_translation')

  const result = { translatedText, targetLang: lang }
  setCachedTranslation(messageId, lang, translatedText)
  return result
}

export async function translateToReaderLanguage({ messageId, text, readerLanguage }) {
  return translateToLanguage({ messageId, text, targetLang: readerLanguage })
}

/** @internal test helper */
export function pickTranslatedTextForTest(data) {
  return String(data?.translatedText || data?.text || '').trim()
}
