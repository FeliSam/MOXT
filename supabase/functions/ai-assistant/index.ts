import { corsHeadersFor, corsPreflight } from '../_shared/cors.ts'
import {
  createYandexResponse,
  parseAssistantJson,
  readYandexAiConfig,
} from '../_shared/yandexAi.ts'

const ALLOW_HEADERS = 'authorization, x-client-info, apikey, content-type, x-supabase-api-version'

function json(body: Record<string, unknown>, status = 200, req?: Request) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeadersFor(req || new Request('https://moxtapp.ru'), ALLOW_HEADERS),
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Content-Type': 'application/json',
    },
  })
}

type Candidate = { id: string; label: string; path?: string; typeLabel?: string }
type HistoryItem = { role: string; text: string }
type LocalDraft = {
  text?: string
  actions?: Array<{ label?: string; path?: string }>
  sources?: string[]
  suggestions?: string[]
}

function buildAssistantInput(
  question: string,
  candidates: Candidate[],
  history: HistoryItem[],
  language: string,
  draft: LocalDraft | null,
) {
  const candidateLines = candidates
    .slice(0, 12)
    .map((item) => `- ${item.id}: ${item.label}${item.path ? ` → ${item.path}` : ''}`)
    .join('\n')

  const historyLines = history
    .slice(-6)
    .map((item) => `${item.role === 'assistant' ? 'Assistant' : 'Utilisateur'}: ${item.text}`)
    .join('\n')

  const draftLines = draft?.text
    ? [
        '',
        'Brouillon local MOXT (source de vérité — reformule sans inventer de faits):',
        `Texte: ${draft.text}`,
        draft.actions?.length
          ? `Liens suggérés: ${draft.actions.map((a) => `${a.label} → ${a.path}`).join(' · ')}`
          : '',
        draft.sources?.length ? `Sources: ${draft.sources.join(' · ')}` : '',
      ]
        .filter(Boolean)
        .join('\n')
    : ''

  return [
    `Langue de réponse: ${language || 'fr'}`,
    '',
    'Historique récent:',
    historyLines || '(aucun)',
    draftLines,
    '',
    'Pages / entités candidates (utilise leurs ids dans actionIds si pertinent):',
    candidateLines || '(aucune)',
    '',
    `Question utilisateur: ${question}`,
    '',
    'Reformule le brouillon local en réponse naturelle, concise et utile.',
    'Ne contredis pas le brouillon ; ne promets rien qui n’y figure pas.',
    'Réponds UNIQUEMENT avec un JSON valide:',
    '{"text":"ta réponse","actionIds":["id-candidat-optionnel"]}',
  ].join('\n')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        ...corsHeadersFor(req, ALLOW_HEADERS),
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
    })
  }

  if (req.method !== 'POST') {
    return json({ error: 'method_not_allowed' }, 405, req)
  }

  const config = readYandexAiConfig()
  if (!config) {
    return json(
      {
        error:
          'YANDEX_AI_API_KEY manquante. Définis le secret Supabase puis redéploie ai-assistant.',
      },
      503,
      req,
    )
  }

  try {
    const body = await req.json().catch(() => ({}))
    const question = String(body.question || '').trim()
    if (!question) return json({ error: 'question_required' }, 400, req)

    const candidates = Array.isArray(body.candidates) ? body.candidates : []
    const history = Array.isArray(body.history) ? body.history : []
    const language = String(body.language || 'fr')
    const draft =
      body.draft && typeof body.draft === 'object' ? (body.draft as LocalDraft) : null

    const input = buildAssistantInput(question, candidates, history, language, draft)
    const { outputText } = await createYandexResponse(config, input)
    const parsed = parseAssistantJson(outputText)

    const allowedIds = new Set(
      candidates.map((item: Candidate) => String(item?.id || '')).filter(Boolean),
    )
    const actionIds = parsed.actionIds.filter((id) => allowedIds.has(id))

    return json(
      {
        text: parsed.text,
        actionIds,
        provider: 'yandex-ai',
      },
      200,
      req,
    )
  } catch (error) {
    const aborted = error instanceof Error && error.name === 'AbortError'
    return json(
      {
        error: aborted
          ? 'Yandex AI met trop longtemps à répondre.'
          : error instanceof Error
            ? error.message
            : 'yandex_ai_error',
      },
      aborted ? 504 : 502,
      req,
    )
  }
})
