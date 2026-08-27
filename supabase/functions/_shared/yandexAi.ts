export type YandexAiConfig = {
  apiKey: string
  folderId: string
  promptId: string
  baseUrl: string
}

export function readYandexAiConfig(): YandexAiConfig | null {
  const apiKey = (Deno.env.get('YANDEX_AI_API_KEY') || Deno.env.get('MOXT_YANDEX_AI_API_KEY') || '')
    .trim()
  if (!apiKey) return null
  return {
    apiKey,
    folderId: (Deno.env.get('YANDEX_AI_FOLDER_ID') || 'b1gmns3k9udjtgk89c9i').trim(),
    promptId: (Deno.env.get('YANDEX_AI_PROMPT_ID') || 'fvtkqqlnba09snlpt1k4').trim(),
    baseUrl: (Deno.env.get('YANDEX_AI_BASE_URL') || 'https://ai.api.cloud.yandex.net/v1').replace(
      /\/+$/,
      '',
    ),
  }
}

export type YandexResponsesResult = {
  outputText: string
  raw: Record<string, unknown>
}

function extractOutputText(payload: Record<string, unknown>) {
  if (typeof payload.output_text === 'string' && payload.output_text.trim()) {
    return payload.output_text.trim()
  }
  const output = payload.output
  if (!Array.isArray(output)) return ''
  const chunks: string[] = []
  for (const item of output) {
    if (!item || typeof item !== 'object') continue
    const block = item as Record<string, unknown>
    if (typeof block.text === 'string') chunks.push(block.text)
    const content = block.content
    if (Array.isArray(content)) {
      for (const part of content) {
        if (part && typeof part === 'object') {
          const text = (part as Record<string, unknown>).text
          if (typeof text === 'string') chunks.push(text)
        }
      }
    }
  }
  return chunks.join('\n').trim()
}

/** Appel Responses API Yandex (compatible OpenAI) — équivalent du SDK `openai`. */
export async function createYandexResponse(
  config: YandexAiConfig,
  input: string,
  options: { instructions?: string; temperature?: number; usePrompt?: boolean } = {},
): Promise<YandexResponsesResult> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 90_000)
  const usePrompt =
    options.usePrompt === true ||
    String(Deno.env.get('YANDEX_AI_USE_PROMPT') || '').toLowerCase() === 'true'

  try {
    const body: Record<string, unknown> = {
      input: input.slice(0, 12000),
      temperature: typeof options.temperature === 'number' ? options.temperature : 0.8,
    }
    if (usePrompt && config.promptId) {
      body.prompt = { id: config.promptId }
    } else {
      // Mode libre : pas de template AI Studio (évite les réponses checklist figées).
      body.model = `gpt://${config.folderId}/yandexgpt/latest`
    }
    if (options.instructions) body.instructions = options.instructions.slice(0, 4000)

    const response = await fetch(`${config.baseUrl}/responses`, {
      method: 'POST',
      headers: {
        Authorization: `Api-Key ${config.apiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Project': config.folderId,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
    const raw = (await response.json().catch(() => ({}))) as Record<string, unknown>
    if (!response.ok) {
      const message =
        typeof raw.error === 'object' && raw.error && 'message' in (raw.error as object)
          ? String((raw.error as Record<string, unknown>).message)
          : typeof raw.error === 'string'
            ? raw.error
            : `Yandex AI HTTP ${response.status}`
      throw new Error(message)
    }
    const outputText = extractOutputText(raw)
    if (!outputText) throw new Error('Réponse Yandex AI vide')
    return { outputText, raw }
  } finally {
    clearTimeout(timer)
  }
}

export function parseAssistantJson(outputText: string) {
  const trimmed = outputText.trim()
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const candidate = fenced?.[1]?.trim() || trimmed
  try {
    const parsed = JSON.parse(candidate) as Record<string, unknown>
    const text = String(parsed.text || parsed.answer || parsed.reply || '').trim()
    const actionIds = Array.isArray(parsed.actionIds)
      ? parsed.actionIds.map((id) => String(id)).filter(Boolean)
      : []
    const followUps = Array.isArray(parsed.followUps)
      ? parsed.followUps.map((item) => String(item).trim()).filter(Boolean).slice(0, 4)
      : []
    const citations = Array.isArray(parsed.citations)
      ? parsed.citations.map((item) => String(item).trim()).filter(Boolean).slice(0, 6)
      : []
    if (text) return { text, actionIds, followUps, citations }
  } catch {
    // plain text fallback
  }
  return { text: trimmed, actionIds: [] as string[], followUps: [] as string[], citations: [] as string[] }
}
