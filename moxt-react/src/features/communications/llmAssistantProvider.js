import { searchablePages } from '../../config/searchablePages'
import { supabase } from '../../services/supabaseClient'
import { filterSearchIndex } from '../searchSelectors'

function buildCandidates(question, searchIndex) {
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
  return [...entityMatches, ...pageCandidates]
}

export const llmAssistantProvider = {
  async respond({ question, searchIndex, history = [], language = 'fr', draft = null }) {
    if (!supabase) throw new Error('Supabase non configuré')

    const candidates = buildCandidates(question, searchIndex)

    // Les 6 derniers échanges (3 paires) pour le contexte
    const recentHistory = history.slice(-6).map((m) => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      text: m.text,
    }))

    const { data, error } = await supabase.functions.invoke('ai-assistant', {
      body: {
        question,
        candidates,
        history: recentHistory,
        language,
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
    if (error) throw error
    if (data?.error) throw new Error(data.error)

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

    return {
      text: data.text || draft?.text || "Je n'ai pas pu formuler de réponse.",
      actions,
      sources,
      suggestions: draft?.suggestions,
    }
  },
}
