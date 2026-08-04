import { LANGUAGE_LABELS, SUPPORTED_LANGUAGES } from '../../config/uiTranslations'
import { supabase } from '../../services/supabaseClient'

const translationCache = new Map()

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

export function otherTranslateLanguages(currentLanguage) {
  const current = String(currentLanguage || '').toLowerCase()
  return SUPPORTED_LANGUAGES.filter((code) => code !== current)
}

export function languageLabel(code) {
  return LANGUAGE_LABELS[code]?.label || code
}

/**
 * Translate a chat message via the translate-message edge function.
 * Returns { translatedText, targetLang }.
 */
export async function translateMessageText({ text, targetLang }) {
  const trimmed = String(text || '').trim()
  const lang = String(targetLang || '').trim().toLowerCase()
  if (!trimmed) throw new Error('empty')
  if (!SUPPORTED_LANGUAGES.includes(lang)) throw new Error('unsupported_lang')
  if (!supabase) throw new Error('supabase_unavailable')

  const { data, error } = await supabase.functions.invoke('translate-message', {
    body: { text: trimmed, targetLang: lang },
  })
  if (error) {
    const detail = error.message || String(error)
    throw new Error(detail)
  }
  if (data?.error) throw new Error(String(data.error))
  const translatedText = String(data?.translatedText || '').trim()
  if (!translatedText) throw new Error('empty_translation')
  return { translatedText, targetLang: lang }
}

export async function translateMessageCached({ messageId, text, targetLang }) {
  const cached = messageId ? getCachedTranslation(messageId, targetLang) : null
  if (cached?.translatedText) return cached
  const result = await translateMessageText({ text, targetLang })
  if (messageId) setCachedTranslation(messageId, targetLang, result.translatedText)
  return result
}
