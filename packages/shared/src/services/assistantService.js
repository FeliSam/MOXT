/**
 * Moxti : même fonction Edge `ai-assistant` que llmAssistantProvider.js.
 * Le contexte riche (transferts, index de recherche) reste optionnel : le corps
 * de la requête a la même forme (question, candidates, history, language, context, draft).
 */

export const MOXTI_PAGE_CANDIDATES = [
  { id: 'transfers', label: 'Transferts', path: '/transfers' },
  { id: 'p2p', label: 'Échange P2P', path: '/p2p' },
  { id: 'marketplace', label: 'Marketplace', path: '/marketplace' },
  { id: 'parcels', label: 'Colis', path: '/parcels' },
  { id: 'jobs', label: 'Emplois', path: '/jobs' },
  { id: 'events', label: 'Événements', path: '/events' },
  { id: 'verification', label: 'Vérification', path: '/verification' },
  { id: 'messages', label: 'Messages', path: '/messages' },
  { id: 'settings', label: 'Paramètres', path: '/settings' },
]

export function recentAssistantHistory(history = []) {
  return history
    .filter((entry) => entry?.text)
    .slice(-8)
    .map((entry) => ({
      role: entry.role === 'user' ? 'user' : 'assistant',
      text: String(entry.text).slice(0, 1200),
    }))
}

/**
 * @returns {Promise<{ text: string, actions: {label: string, path: string}[], suggestions: string[], provider: string }>}
 */
export async function askMoxti(client, { question, history = [], language = 'fr', candidates, context, draft } = {}) {
  if (!client?.functions?.invoke) throw new Error('Supabase non configuré')
  const pages = candidates?.length ? candidates : MOXTI_PAGE_CANDIDATES
  const { data, error } = await client.functions.invoke('ai-assistant', {
    body: {
      question,
      candidates: pages,
      history: recentAssistantHistory(history),
      language,
      context: context || { toolsUsed: [], searchHits: [], transfers: [], focusedTransfer: null, exchangers: [] },
      draft: draft
        ? { text: draft.text, actions: draft.actions, sources: draft.sources, suggestions: draft.suggestions }
        : null,
    },
  })
  if (data?.error) throw new Error(data.error)
  if (!data?.text) {
    throw new Error(error?.message || 'Réponse ai-assistant vide')
  }
  const selected = (data.actionIds || []).map((id) => pages.find((item) => item.id === id)).filter(Boolean)
  return {
    text: data.text,
    actions: selected.map((item) => ({ label: item.label, path: item.path })),
    suggestions: Array.isArray(data.followUps) ? data.followUps.filter(Boolean) : [],
    provider: data.provider || 'ai-assistant',
  }
}
