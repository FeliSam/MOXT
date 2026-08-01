import { supabase } from '../../services/supabaseClient'

/** Endpoint public documenté (dev). Préférer le proxy Edge Function en prod (CORS / IAP). */
export const MOXTI_API_URL =
  import.meta.env.VITE_MOXTI_API_URL ||
  'https://ais-dev-tgfremvnud2wr2o2uhhzod-716871433275.europe-west2.run.app/api/messages/incoming'

const DIRECT = String(import.meta.env.VITE_MOXTI_DIRECT || '').toLowerCase() === 'true'

function inferChannel(question = '') {
  const q = question.toLowerCase()
  if (/\bp2p\b|peer[\s-]?to[\s-]?peer|séquestre|sequestre|escrow|usdt/.test(q)) {
    return 'p2p_chat'
  }
  if (/\bemail\b|e-mail|courriel/.test(q)) return 'email'
  if (/formulaire|contact/.test(q)) return 'contact_form'
  return 'website_chat'
}

function inferSubject(question = '') {
  const trimmed = String(question || '').trim().replace(/\s+/g, ' ')
  if (!trimmed) return 'Question MOXT'
  return trimmed.length > 80 ? `${trimmed.slice(0, 77)}…` : trimmed
}

function senderFromUser(user) {
  const name = [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim()
  return {
    senderName: name || user?.displayName || 'Utilisateur MOXT',
    senderContact: user?.email || user?.phone || user?.id || 'user@moxt.io',
  }
}

function normalizeReply(data) {
  const text =
    data?.generatedReply ||
    data?.reply ||
    data?.message ||
    data?.text ||
    ''
  if (!String(text).trim()) {
    throw new Error('Réponse Moxti vide')
  }
  const confidence = Number(data?.aiAnalysis?.confidenceScore)
  const sources = []
  if (Number.isFinite(confidence)) {
    sources.push(`Moxti · confiance ${Math.round(confidence)} %`)
  } else {
    sources.push('Moxti')
  }
  return {
    text: String(text).trim(),
    actions: [],
    sources,
    confidence: Number.isFinite(confidence) ? confidence : null,
    provider: 'moxti',
  }
}

async function respondViaEdge({ question, user }) {
  if (!supabase) throw new Error('Supabase non configuré')
  const { senderName, senderContact } = senderFromUser(user)
  const { data, error } = await supabase.functions.invoke('moxti-assistant', {
    body: {
      content: question,
      question,
      senderName,
      senderContact,
      channel: inferChannel(question),
      subject: inferSubject(question),
    },
  })
  if (error) throw error
  if (data?.error) throw new Error(data.error)
  return normalizeReply(data)
}

async function respondDirect({ question, user }) {
  const { senderName, senderContact } = senderFromUser(user)
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 110_000)
  try {
    const response = await fetch(MOXTI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        senderName,
        senderContact,
        channel: inferChannel(question),
        subject: inferSubject(question),
        content: question,
      }),
      signal: controller.signal,
    })
    const raw = await response.text()
    let data = {}
    try {
      data = raw ? JSON.parse(raw) : {}
    } catch {
      throw new Error(
        response.ok
          ? 'Réponse Moxti non JSON (CORS / protection réseau).'
          : `Moxti HTTP ${response.status}`,
      )
    }
    if (!response.ok) {
      throw new Error(
        typeof data.error === 'string' ? data.error : `Moxti HTTP ${response.status}`,
      )
    }
    return normalizeReply(data)
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Assistant Moxti (Gemini via API REST AIS).
 * Par défaut : Edge Function `moxti-assistant` (évite CORS / IAP navigateur).
 * `VITE_MOXTI_DIRECT=true` : appel direct à l’URL documentée.
 */
export const moxtiAssistantProvider = {
  async respond({ question, user }) {
    const text = String(question || '').trim()
    if (!text) throw new Error('Question vide')

    if (DIRECT) {
      try {
        return await respondDirect({ question: text, user })
      } catch (directError) {
        // Si le direct échoue (CORS), tenter le proxy
        try {
          return await respondViaEdge({ question: text, user })
        } catch {
          throw directError
        }
      }
    }

    try {
      return await respondViaEdge({ question: text, user })
    } catch (edgeError) {
      // Dev / edge pas déployée : tentative directe
      try {
        return await respondDirect({ question: text, user })
      } catch {
        throw edgeError
      }
    }
  },
}
