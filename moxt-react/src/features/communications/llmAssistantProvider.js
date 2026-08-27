import { searchablePages } from '../../config/searchablePages'
import { supabase } from '../../services/supabaseClient'
import { filterSearchIndex } from '../searchSelectors'
import { buildAssistantContextPack, buildTransferCandidates } from './assistantContext'

function buildCandidates(question, searchIndex, contextPack = null) {
  const entityMatches = filterSearchIndex(searchIndex, question)
    .slice(0, 6)
    .map((item) => ({
      id: `entity-${item.type}-${item.id}`,
      label: item.title,
      path: item.path,
      typeLabel: item.typeLabel,
    }))
  const pageCandidates = searchablePages.map((page) => ({
    id: page.id,
    label: page.title,
    path: page.path,
  }))
  const dynamic = buildTransferCandidates(contextPack)
  const seen = new Set()
  const merged = []
  for (const item of [...dynamic, ...entityMatches, ...pageCandidates]) {
    if (!item?.id || seen.has(item.id)) continue
    seen.add(item.id)
    merged.push(item)
  }
  return merged
}

export const llmAssistantProvider = {
  async respond({
    question,
    searchIndex,
    history = [],
    language = 'fr',
    draft = null,
    state = null,
    user = null,
  }) {
    if (!supabase) throw new Error('Supabase non configuré')

    let contextPack = {
      toolsUsed: [],
      searchHits: [],
      transfers: [],
      focusedTransfer: null,
      exchangers: [],
    }
    try {
      if (state) {
        contextPack = buildAssistantContextPack({ state, question, user, searchIndex })
      }
    } catch (err) {
      console.warn('[Moxti] context pack failed', err)
    }

    const candidates = buildCandidates(question, searchIndex, contextPack)

    const recentHistory = history
      .filter((m) => m?.text)
      .slice(-8)
      .map((m) => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        text: String(m.text).slice(0, 1200),
      }))

    const { data, error } = await supabase.functions.invoke('ai-assistant', {
      body: {
        question,
        candidates,
        history: recentHistory,
        language,
        context: contextPack,
        draft: draft
          ? {
              text: draft.text,
              actions: draft.actions,
              sources: draft.sources,
              suggestions: draft.suggestions,
            }
          : null,
      },
    })

    // supabase-js peut renseigner error même si le body JSON est utilisable
    if (data?.error) throw new Error(data.error)
    if (!data?.text) {
      const detail =
        error?.message ||
        (typeof error === 'string' ? error : null) ||
        'Réponse ai-assistant vide'
      throw new Error(detail)
    }
    if (error) {
      console.warn('[Moxti] invoke warning (body OK)', error.message || error)
    }

    const selected = (data.actionIds || [])
      .map((id) => candidates.find((item) => item.id === id))
      .filter(Boolean)

    const fallbackActions = (draft?.actions || []).filter((item) => item?.path && item?.label)
    const actions = (selected.length ? selected : fallbackActions).map((item) => ({
      label: item.label,
      path: item.path,
    }))

    const sources = selected.length
      ? selected.filter((item) => item.typeLabel).map((item) => `${item.typeLabel}: ${item.label}`)
      : draft?.sources || []

    const citations = Array.isArray(data.citations) ? data.citations.filter(Boolean) : []
    const followUps = Array.isArray(data.followUps) ? data.followUps.filter(Boolean) : []

    return {
      text: data.text,
      actions,
      sources: [...sources, ...citations.filter((c) => !sources.includes(c))].slice(0, 8),
      suggestions: followUps.length ? followUps : draft?.suggestions,
      toolsUsed: data.toolsUsed || contextPack.toolsUsed,
      provider: data.provider || 'yandex-ai',
    }
  },
}
