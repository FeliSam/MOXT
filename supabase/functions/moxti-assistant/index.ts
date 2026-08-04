import { corsHeadersFor, corsPreflight } from '../_shared/cors.ts'
import { extractMoxtiText, parseMoxtiResponse } from '../_shared/moxtiResponse.ts'

const DEFAULT_MOXTI_URL =
  'https://ais-dev-tgfremvnud2wr2o2uhhzod-716871433275.europe-west2.run.app/api/messages/incoming'

function json(body: Record<string, unknown>, status: number, req: Request) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeadersFor(req),
      'Content-Type': 'application/json',
    },
  })
}

/** Headers d’auth selon le format AIS (Bearer et/ou X-Api-Key). */
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return corsPreflight(req)
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405, req)
  }

  try {
    const apiKey = (Deno.env.get('MOXTI_API_KEY') || '').trim()
    if (!apiKey) {
      return json(
        {
          error:
            'MOXTI_API_KEY manquante. Définis le secret Supabase puis redéploie moxti-assistant.',
        },
        503,
        req,
      )
    }

    const body = await req.json().catch(() => ({}))
    const content = String(body.content || body.question || '').trim()
    if (!content) {
      return json({ error: 'Message vide' }, 400, req)
    }

    const endpoint = Deno.env.get('MOXTI_API_URL') || DEFAULT_MOXTI_URL
    const payload = {
      senderName: String(body.senderName || 'Utilisateur MOXT').slice(0, 120),
      senderContact: String(body.senderContact || 'user@moxt.io').slice(0, 200),
      channel: String(body.channel || 'website_chat').slice(0, 64),
      subject: String(body.subject || 'Question MOXT').slice(0, 200),
      content: content.slice(0, 4000),
    }

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 110_000)

    let upstream: Response
    try {
      upstream = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json, text/plain',
          ...moxtiAuthHeaders(),
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      })
    } finally {
      clearTimeout(timer)
    }

    const raw = await upstream.text()
    const { data, plainText } = parseMoxtiResponse(raw, upstream.ok)

    if (!upstream.ok) {
      const errorMessage =
        typeof data.error === 'string'
          ? data.error
          : plainText || `Moxti HTTP ${upstream.status}`
      return json(
        {
          error: errorMessage,
          detail: data,
        },
        upstream.status >= 400 && upstream.status < 600 ? upstream.status : 502,
        req,
      )
    }

    const generatedReply = extractMoxtiText(data, plainText)

    return json(
      {
        generatedReply,
        aiAnalysis: data.aiAnalysis || null,
        raw: data,
      },
      200,
      req,
    )
  } catch (err) {
    const aborted = err instanceof Error && err.name === 'AbortError'
    return json(
      {
        error: aborted
          ? 'Moxti met trop longtemps à répondre. Réessayez.'
          : err instanceof Error
            ? err.message
            : 'Erreur Moxti',
      },
      aborted ? 504 : 500,
      req,
    )
  }
})
