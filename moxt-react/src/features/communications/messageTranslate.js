import { LANGUAGE_LABELS, SUPPORTED_LANGUAGES } from '../../config/uiTranslations'
import { supabase } from '../../services/supabaseClient'

const translationCache = new Map()
const MAX_AUTO_CHARS = 2000
const BATCH_SIZE = 10
const TRANSLATE_CONCURRENCY = 3
const SESSION_STORAGE_KEY = 'moxt-msg-tr-cache-v1'
const SESSION_STORAGE_MAX = 400

export function translationCacheKey(messageId, targetLang) {
  return `${messageId}::${targetLang}`
}

export function getCachedTranslation(messageId, targetLang) {
  const memory = translationCache.get(translationCacheKey(messageId, targetLang))
  if (memory?.translatedText) return memory
  return readSessionTranslation(messageId, targetLang)
}

export function setCachedTranslation(messageId, targetLang, translatedText) {
  const entry = { translatedText, targetLang, cachedAt: Date.now() }
  translationCache.set(translationCacheKey(messageId, targetLang), entry)
  writeSessionTranslation(messageId, targetLang, translatedText)
  return entry
}

export function clearTranslationCache() {
  translationCache.clear()
  if (typeof sessionStorage === 'undefined') return
  try {
    sessionStorage.removeItem(SESSION_STORAGE_KEY)
  } catch {
    // ignore quota / privacy mode
  }
}

function readSessionStore() {
  if (typeof sessionStorage === 'undefined') return {}
  try {
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function writeSessionStore(store) {
  if (typeof sessionStorage === 'undefined') return
  try {
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(store))
  } catch {
    // ignore quota
  }
}

function readSessionTranslation(messageId, targetLang) {
  const store = readSessionStore()
  const entry = store[translationCacheKey(messageId, targetLang)]
  if (!entry?.translatedText) return null
  return entry
}

function writeSessionTranslation(messageId, targetLang, translatedText) {
  const store = readSessionStore()
  store[translationCacheKey(messageId, targetLang)] = {
    translatedText,
    targetLang,
    cachedAt: Date.now(),
  }
  const keys = Object.keys(store)
  if (keys.length > SESSION_STORAGE_MAX) {
    keys
      .sort((a, b) => (store[a]?.cachedAt || 0) - (store[b]?.cachedAt || 0))
      .slice(0, keys.length - SESSION_STORAGE_MAX)
      .forEach((key) => delete store[key])
  }
  writeSessionStore(store)
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

export function normalizeLanguage(code) {
  const lang = String(code || '').toLowerCase()
  return SUPPORTED_LANGUAGES.includes(lang) ? lang : null
}

export function shouldOfferMessageTranslation({ text, readerLanguage, peerLanguage }) {
  const trimmed = String(text || '').trim()
  if (trimmed.length < 3 || trimmed.length > MAX_AUTO_CHARS) return false

  const reader = normalizeLanguage(readerLanguage)
  if (!reader) return false

  const detected = detectMessageLanguage(trimmed)
  if (!detected) return false
  if (detected === reader) return false

  const peer = normalizeLanguage(peerLanguage)
  if (peer && reader === peer && detected === peer) return false

  return true
}

export function shouldAutoTranslate(text, readerLanguage, peerLanguage) {
  return shouldOfferMessageTranslation({ text, readerLanguage, peerLanguage })
}

export function translateLanguageOptionsForUser({ readerLanguage, isAdmin }) {
  if (isAdmin) return adminTranslateLanguageOptions()

  const reader = normalizeLanguage(readerLanguage)
  const options = []
  if (reader) options.push(reader)
  if (reader !== 'ru') options.push('ru')
  return [...new Set(options)]
}

export function languageLabel(code) {
  return LANGUAGE_LABELS[code]?.label || code
}

export function otherTranslateLanguages(currentLanguage) {
  const current = String(currentLanguage || '').toLowerCase()
  return SUPPORTED_LANGUAGES.filter((code) => code !== current)
}

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

function buildTranslateItem({ messageId, text, targetLang, sourceLang }) {
  return {
    messageId,
    text: String(text || '').trim(),
    targetLang: String(targetLang || '').trim().toLowerCase(),
    sourceLang: sourceLang ? String(sourceLang).trim().toLowerCase() : null,
  }
}

function applyTranslateResults(results) {
  const applied = []
  for (const row of results) {
    if (!row?.messageId || !row?.translatedText) continue
    setCachedTranslation(row.messageId, row.targetLang, row.translatedText)
    applied.push({
      messageId: row.messageId,
      targetLang: row.targetLang,
      translatedText: row.translatedText,
      cached: Boolean(row.cached),
    })
  }
  return applied
}

export async function prefetchMessageTranslations({ messageIds, targetLang }) {
  const lang = normalizeLanguage(targetLang)
  if (!lang || !supabase || !messageIds?.length) return {}

  const uniqueIds = [...new Set(messageIds.map(String))].slice(0, 200)
  const { data, error } = await supabase
    .from('message_translations')
    .select('message_id, target_lang, translated_text')
    .in('message_id', uniqueIds)
    .eq('target_lang', lang)

  if (error || !data?.length) return {}

  const map = {}
  for (const row of data) {
    const translatedText = String(row.translated_text || '').trim()
    if (!translatedText) continue
    setCachedTranslation(row.message_id, row.target_lang, translatedText)
    map[row.message_id] = {
      targetLang: row.target_lang,
      translatedText,
      showOriginal: false,
    }
  }
  return map
}

async function invokeTranslateBatch(items) {
  if (!supabase) throw new Error('supabase_unavailable')
  const { data, error } = await supabase.functions.invoke('translate-message', {
    body: { items },
  })
  if (data?.error) throw new Error(String(data.error))
  if (error) throw new Error(await edgeFunctionErrorDetail(error))
  if (Array.isArray(data?.results)) return data.results
  if (data?.translatedText) {
    const item = items[0]
    return [
      {
        messageId: item.messageId,
        targetLang: item.targetLang,
        translatedText: data.translatedText,
        cached: data.cached,
      },
    ]
  }
  return []
}

export async function translateMessagesBatch(entries, { concurrency = TRANSLATE_CONCURRENCY } = {}) {
  const queue = entries
    .map((entry) => buildTranslateItem(entry))
    .filter((item) => {
      if (!item.messageId || !item.text || item.text.length < 3) return false
      if (!SUPPORTED_LANGUAGES.includes(item.targetLang)) return false
      if (getCachedTranslation(item.messageId, item.targetLang)?.translatedText) return false
      return true
    })

  if (!queue.length) return []

  const chunks = []
  for (let i = 0; i < queue.length; i += BATCH_SIZE) {
    chunks.push(queue.slice(i, i + BATCH_SIZE))
  }

  const results = []
  let cursor = 0

  async function worker() {
    while (cursor < chunks.length) {
      const index = cursor
      cursor += 1
      const batch = chunks[index]
      const batchResults = await invokeTranslateBatch(batch)
      results.push(...applyTranslateResults(batchResults))
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, chunks.length) }, () => worker())
  await Promise.all(workers)
  return results
}

export async function translateToLanguage({ messageId, text, targetLang, sourceLang = null }) {
  const trimmed = String(text || '').trim()
  const lang = String(targetLang || '').trim().toLowerCase()
  if (!trimmed || !messageId) throw new Error('empty')
  if (!SUPPORTED_LANGUAGES.includes(lang)) throw new Error('unsupported_lang')
  if (!supabase) throw new Error('supabase_unavailable')

  const cached = getCachedTranslation(messageId, lang)
  if (cached?.translatedText) {
    return { translatedText: cached.translatedText, targetLang: lang, cached: true }
  }

  const detected = sourceLang || detectMessageLanguage(trimmed)
  const [result] = await translateMessagesBatch([
    { messageId, text: trimmed, targetLang: lang, sourceLang: detected },
  ])
  if (!result?.translatedText) throw new Error('empty_translation')
  return result
}

export async function translateToReaderLanguage({ messageId, text, readerLanguage }) {
  return translateToLanguage({ messageId, text, targetLang: readerLanguage })
}

/** @internal test helper */
export function pickTranslatedTextForTest(data) {
  return String(data?.translatedText || data?.text || '').trim()
}

/** @internal test helper */
export const TRANSLATE_BATCH_SIZE = BATCH_SIZE
