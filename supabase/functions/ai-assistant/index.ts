import { corsHeadersFor } from '../_shared/cors.ts'
import {
  createYandexResponse,
  parseAssistantJson,
  readYandexAiConfig,
} from '../_shared/yandexAi.ts'
import { formatPlaybooksForPrompt, resolvePlaybooks } from './playbooks.ts'
import {
  buildDynamicCandidates,
  formatToolContextForPrompt,
  gatherToolContext,
  type ToolContextPack,
} from './tools.ts'

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

function languageLabel(code: string) {
  const map: Record<string, string> = {
    fr: 'français',
    en: 'English',
    ru: 'русский',
    pt: 'português',
    es: 'español',
  }
  return map[code] || code || 'français'
}

function mergeCandidates(base: Candidate[], extra: Candidate[]) {
  const seen = new Set<string>()
  const out: Candidate[] = []
  for (const item of [...extra, ...base]) {
    const id = String(item?.id || '')
    if (!id || seen.has(id)) continue
    seen.add(id)
    out.push(item)
  }
  return out.slice(0, 24)
}

function buildAssistantInput(
  question: string,
  candidates: Candidate[],
  history: HistoryItem[],
  language: string,
  draft: LocalDraft | null,
  toolPack: ToolContextPack,
  playbookText: string,
) {
  const candidateLines = candidates
    .slice(0, 16)
    .map((item) => `- ${item.id}: ${item.label}${item.path ? ` → ${item.path}` : ''}`)
    .join('\n')

  const historyLines = history
    .slice(-8)
    .map((item) => `${item.role === 'assistant' ? 'Moxti' : 'Utilisateur'}: ${item.text}`)
    .join('\n')

  const draftLines = draft?.text
    ? [
        '',
        '=== BROUILLON LOCAL (faits autorisés) ===',
        draft.text,
        draft.actions?.length
          ? `Actions brouillon: ${draft.actions.map((a) => `${a.label} (${a.path})`).join(' · ')}`
          : '',
        draft.suggestions?.length
          ? `Suggestions brouillon: ${draft.suggestions.slice(0, 4).join(' · ')}`
          : '',
      ]
        .filter(Boolean)
        .join('\n')
    : ''

  const toolBlock = formatToolContextForPrompt(toolPack)
  const playbookBlock = playbookText
    ? `\n=== PLAYBOOKS MÉTIER ===\n${playbookText}`
    : ''

  return [
    'Tu es Moxti (jamais « Moxi »), assistante autonome de la plateforme MOXT.',
    'Tu combines recherche app, dossiers utilisateur et playbooks pour répondre précisément.',
    '',
    `Réponds uniquement en ${languageLabel(language)}.`,
    '',
    'Règles:',
    '- Utilise les FAITS des tools / playbooks / brouillon. N’invente jamais tarifs, délais, plafonds.',
    '- Si un transfert ou échangeur est listé, cite son id/statut et propose le bon bouton d’action.',
    '- INTERDIT de recopier un playbook mot à mot ou de coller une checklist robotique à chaque fois.',
    '- Parle comme une conseillère : phrases naturelles, 1 idée claire, puis 2–4 puces max seulement si utile.',
    '- Varie fortement la structure selon la question (pas le même plan « 1. 2. 3. 4. »).',
    '- Si tu n’as pas les données user (ex. aucun transfert chargé), dis-le franchement et oriente vers Mes transferts.',
    '- Markdown léger OK. 60–180 mots en général.',
    '- Remplis followUps (2–3 questions de suite) et citations (tools/playbooks utilisés).',
    '',
    'Historique récent:',
    historyLines || '(aucun)',
    draftLines,
    toolBlock ? `\n=== CONTEXTE TOOLS ===\n${toolBlock}` : '',
    playbookBlock,
    '',
    'Pages / entités candidates (ids pour actionIds):',
    candidateLines || '(aucune)',
    '',
    `Question utilisateur: ${question}`,
    '',
    'Réponds UNIQUEMENT avec un JSON valide:',
    '{"text":"...","actionIds":["id"],"followUps":["..."],"citations":["list_my_transfers","playbook:transfert"]}',
  ]
    .filter(Boolean)
    .join('\n')
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

    const baseCandidates = Array.isArray(body.candidates) ? body.candidates : []
    const history = Array.isArray(body.history) ? body.history : []
    const language = String(body.language || 'fr')
    const draft =
      body.draft && typeof body.draft === 'object' ? (body.draft as LocalDraft) : null
    const clientPack =
      body.context && typeof body.context === 'object'
        ? (body.context as Partial<ToolContextPack>)
        : null

    const playbooks = resolvePlaybooks(question)
    if (playbooks.length) {
      // tagged in toolsUsed for citations
    }

    const toolPack = await gatherToolContext({ req, question, clientPack })
    if (playbooks.length) {
      toolPack.toolsUsed = [...new Set([...toolPack.toolsUsed, 'get_faq_playbook'])]
      toolPack.playbookIds = playbooks.map((p) => p.id)
    }

    const dynamicCandidates = buildDynamicCandidates(toolPack)
    const candidates = mergeCandidates(baseCandidates, dynamicCandidates)

    const input = buildAssistantInput(
      question,
      candidates,
      history,
      language,
      draft,
      toolPack,
      formatPlaybooksForPrompt(playbooks),
    )
    const { outputText } = await createYandexResponse(config, input, {
      temperature: 0.85,
      instructions: [
        'Tu es Moxti, assistante MOXT. Réponses naturelles, variées, non robotiques.',
        'Ne recopie jamais un brouillon ou un playbook mot à mot.',
        'Évite les checklists 1.2.3.4 systématiques.',
        'Réponds UNIQUEMENT en JSON: {"text","actionIds","followUps","citations"}.',
      ].join(' '),
    })
    const parsed = parseAssistantJson(outputText)

    const allowedIds = new Set(
      candidates.map((item: Candidate) => String(item?.id || '')).filter(Boolean),
    )
    const actionIds = parsed.actionIds.filter((id) => allowedIds.has(id))

    let text = parsed.text.trim()
    text = text.replace(/\bMoxi\b/g, 'Moxti').replace(/\bМокси\b/g, 'Моксти')

    const followUps =
      parsed.followUps?.length
        ? parsed.followUps
        : (draft?.suggestions || []).slice(0, 3)

    const citations =
      parsed.citations?.length
        ? parsed.citations
        : [
            ...toolPack.toolsUsed,
            ...(toolPack.playbookIds || []).map((id) => `playbook:${id}`),
          ].slice(0, 6)

    return json(
      {
        text,
        actionIds,
        followUps,
        citations,
        toolsUsed: toolPack.toolsUsed,
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
