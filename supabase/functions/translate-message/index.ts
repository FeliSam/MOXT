import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeadersFor, corsPreflight } from '../_shared/cors.ts'

const DEFAULT_MOXTI_URL =
  'https://ais-dev-tgfremvnud2wr2o2uhhzod-716871433275.europe-west2.run.app/api/messages/incoming'

const MAX_CHARS = 4000

const LANGUAGE_NAMES: Record<string, string> = {
  fr: 'French',
  en: 'English',
  ru: 'Russian',
  pt: 'Portuguese',
  es: 'Spanish',
}

function json(body: Record<string, unknown>, status: number, req: Request) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeadersFor(req),
      'Content-Type': 'application/json',
    },
  })
}

function moxtiAuthHeaders() {
  const key = (Deno.env.get('MOXTI_API_KEY') || '').trim()
  if (!key) return {} as Record<string, string>

  const mode = (Deno.env.get('MOXTI_API_KEY_HEADER') || 'both').toLowerCase()
  const rawKey = key.replace(/^bearer\s+/i, '')
  const headers: Record<string, string> = {}

  if (mode === 'bearer' || mode === 'both') {
    headers.Authorization = `Bearer ${rawKey}`
  }
  if (mode === 'x-api-key' || mode === 'both') {
    headers['X-Api-Key'] = rawKey
  }
  if (mode === 'api-key') {
    headers['Api-Key'] = rawKey
  }

  return headers
}

function buildTranslatorPrompt(text: string, targetLang: string) {
  const targetName = LANGUAGE_NAMES[targetLang] || targetLang
  return [
    'You are a professional translator for the MOXT messaging app.',
    `Translate the following message into ${targetName} (${targetLang}).`,
    'Rules:',
    '- Output ONLY the translated text, nothing else.',
    '- Do not add greetings, explanations, quotes, or labels.',
    '- Preserve emojis, @mentions, URLs, phone numbers, amounts, currencies, and line breaks.',
    '- Keep proper names unchanged when they are names of people or brands.',
    '- If the text is already in the target language, return it unchanged.',
    '',
    'Message:',
    text,
  ].join('\n')
}

function extractTranslation(data: Record<string, unknown>, raw: string) {
  const candidates = [
    data.translatedText,
    data.translation,
    data.generatedReply,
    data.reply,
    data.message,
    data.text,
  ]
  for (const value of candidates) {
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  const stripped = raw.trim()
  return stripped.startsWith('{') ? '' : stripped
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return corsPreflight(req)
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405, req)
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
    if (!supabaseUrl || !anonKey) {
      return json({ error: 'Configuration Supabase incomplète.' }, 503, req)
    }

    const authHeader = req.headers.get('authorization') || ''
    const token = authHeader.replace(/^Bearer\s+/i, '').trim()
    if (!token) {
      return json({ error: 'Session expirée.' }, 401, req)
    }

    const supabase = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    })
    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError || !userData?.user) {
      return json({ error: 'Session expirée.' }, 401, req)
    }

    const apiKey = (Deno.env.get('MOXTI_API_KEY') || '').trim()
    if (!apiKey) {
      return json(
        {
          error:
            'MOXTI_API_KEY manquante. Définis le secret Supabase puis redéploie translate-message.',
        },
        503,
        req,
      )
    }

    const body = await req.json().catch(() => ({}))
    const text = String(body.text || body.content || '').trim()
    const targetLang = String(body.targetLang || body.language || '').trim().toLowerCase()

    if (!text) return json({ error: 'Message vide' }, 400, req)
    if (!LANGUAGE_NAMES[targetLang]) {
      return json({ error: 'Langue cible non supportée' }, 400, req)
    }
    if (text.length > MAX_CHARS) {
      return json({ error: `Texte trop long (max ${MAX_CHARS} caractères)` }, 400, req)
    }

    const endpoint = Deno.env.get('MOXTI_API_URL') || DEFAULT_MOXTI_URL
    const payload = {
      senderName: 'MOXT Translator',
      senderContact: userData.user.email || userData.user.id,
      channel: 'message_translate',
      subject: `Translate to ${LANGUAGE_NAMES[targetLang]}`,
      content: buildTranslatorPrompt(text, targetLang).slice(0, MAX_CHARS),
    }

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 60_000)

    let upstream: Response
    try {
      upstream = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...moxtiAuthHeaders(),
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      })
    } finally {
      clearTimeout(timer)
    }

    const raw = await upstream.text()
    let data: Record<string, unknown> = {}
    try {
      data = raw ? JSON.parse(raw) : {}
    } catch {
      return json(
        {
          error: upstream.ok
            ? 'Réponse traducteur non JSON.'
            : `Traducteur HTTP ${upstream.status}`,
          detail: raw.slice(0, 240),
        },
        upstream.ok ? 502 : upstream.status,
        req,
      )
    }

    if (!upstream.ok) {
      return json(
        {
          error: typeof data.error === 'string' ? data.error : `Traducteur HTTP ${upstream.status}`,
        },
        upstream.status >= 400 && upstream.status < 600 ? upstream.status : 502,
        req,
      )
    }

    const translatedText = extractTranslation(data, raw)
    if (!translatedText) {
      return json({ error: 'Traduction vide' }, 502, req)
    }

    return json(
      {
        translatedText,
        targetLang,
        sourceLength: text.length,
      },
      200,
      req,
    )
  } catch (err) {
    const aborted = err instanceof Error && err.name === 'AbortError'
    return json(
      {
        error: aborted
          ? 'La traduction met trop longtemps. Réessayez.'
          : err instanceof Error
            ? err.message
            : 'Erreur de traduction',
      },
      aborted ? 504 : 500,
      req,
    )
  }
})
