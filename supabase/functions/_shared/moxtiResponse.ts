export function normalizeTranslatedText(value: string) {
  let text = value.trim()
  if (!text) return ''
  if (
    (text.startsWith('"') && text.endsWith('"')) ||
    (text.startsWith("'") && text.endsWith("'"))
  ) {
    text = text.slice(1, -1).trim()
  }
  return text
}

export function isBlockedMoxtiResponse(raw: string) {
  const sample = raw.trim().slice(0, 1200).toLowerCase()
  return (
    sample.includes('cookie check') ||
    sample.includes('google.com/recaptcha') ||
    /^<!doctype html|^<html[\s>]/i.test(raw.trim())
  )
}

function looksLikeHtml(value: string) {
  return isBlockedMoxtiResponse(value)
}

function collectStringCandidates(
  value: unknown,
  out: string[],
  depth = 0,
) {
  if (depth > 6 || value == null) return
  if (typeof value === 'string') {
    const normalized = normalizeTranslatedText(value)
    if (normalized.length >= 1) out.push(normalized)
    return
  }
  if (Array.isArray(value)) {
    for (const item of value) collectStringCandidates(item, out, depth + 1)
    return
  }
  if (typeof value === 'object') {
    for (const nested of Object.values(value as Record<string, unknown>)) {
      collectStringCandidates(nested, out, depth + 1)
    }
  }
}

const PREFERRED_KEYS = [
  'translatedText',
  'translation',
  'generatedReply',
  'reply',
  'message',
  'text',
  'content',
  'output',
  'result',
  'answer',
  'suggestedReply',
]

export function parseMoxtiResponse(raw: string, ok: boolean) {
  const trimmed = raw.trim()
  if (!trimmed) return { data: {} as Record<string, unknown>, plainText: '' }

  if (isBlockedMoxtiResponse(trimmed)) {
    return { data: {}, plainText: '' }
  }

  try {
    return {
      data: JSON.parse(trimmed) as Record<string, unknown>,
      plainText: '',
    }
  } catch {
    if (ok && !looksLikeHtml(trimmed)) {
      return { data: {}, plainText: normalizeTranslatedText(trimmed) }
    }
    return { data: {}, plainText: '' }
  }
}

export function extractMoxtiText(
  data: Record<string, unknown>,
  fallbackPlain = '',
) {
  for (const key of PREFERRED_KEYS) {
    const value = data[key]
    if (typeof value === 'string') {
      const normalized = normalizeTranslatedText(value)
      if (normalized) return normalized
    }
  }

  const nestedRaw = data.raw
  const nestedAnalysis = data.aiAnalysis
  if (nestedRaw && typeof nestedRaw === 'object') {
    for (const key of PREFERRED_KEYS) {
      const value = (nestedRaw as Record<string, unknown>)[key]
      if (typeof value === 'string') {
        const normalized = normalizeTranslatedText(value)
        if (normalized) return normalized
      }
    }
  }
  if (nestedAnalysis && typeof nestedAnalysis === 'object') {
    for (const key of PREFERRED_KEYS) {
      const value = (nestedAnalysis as Record<string, unknown>)[key]
      if (typeof value === 'string') {
        const normalized = normalizeTranslatedText(value)
        if (normalized) return normalized
      }
    }
  }

  if (fallbackPlain) return fallbackPlain

  const collected: string[] = []
  collectStringCandidates(data, collected)
  return collected.sort((a, b) => b.length - a.length)[0] || ''
}
