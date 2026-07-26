/**
 * Sessions « Comment utiliser Moxt » — contenu local (i18n).
 * Les articles admin/DB du même groupe remplacent le texte local s’ils existent.
 */
export const PRODUCT_HELP_SESSIONS = [
  {
    id: 'product-getting-started',
    category: 'getting_started',
    sortOrder: 10,
    pinned: true,
    titleKey: 'productHelp.sessions.gettingStarted.title',
    summaryKey: 'productHelp.sessions.gettingStarted.summary',
    contentKey: 'productHelp.sessions.gettingStarted.content',
  },
  {
    id: 'product-transfers',
    category: 'transfers',
    sortOrder: 20,
    titleKey: 'productHelp.sessions.transfers.title',
    summaryKey: 'productHelp.sessions.transfers.summary',
    contentKey: 'productHelp.sessions.transfers.content',
  },
  {
    id: 'product-marketplace',
    category: 'marketplace',
    sortOrder: 30,
    titleKey: 'productHelp.sessions.marketplace.title',
    summaryKey: 'productHelp.sessions.marketplace.summary',
    contentKey: 'productHelp.sessions.marketplace.content',
  },
  {
    id: 'product-parcels',
    category: 'parcels',
    sortOrder: 40,
    titleKey: 'productHelp.sessions.parcels.title',
    summaryKey: 'productHelp.sessions.parcels.summary',
    contentKey: 'productHelp.sessions.parcels.content',
  },
  {
    id: 'product-messages',
    category: 'messages',
    sortOrder: 50,
    titleKey: 'productHelp.sessions.messages.title',
    summaryKey: 'productHelp.sessions.messages.summary',
    contentKey: 'productHelp.sessions.messages.content',
  },
  {
    id: 'product-account',
    category: 'account',
    sortOrder: 60,
    titleKey: 'productHelp.sessions.account.title',
    summaryKey: 'productHelp.sessions.account.summary',
    contentKey: 'productHelp.sessions.account.content',
  },
]

function matchesSessionDef(article, def) {
  const groupId = article.translationGroupId || article.id
  if (groupId === def.id) return true
  if (article.id === def.id || article.id === `${def.id}-fr`) return true
  if (article.category === def.category && String(groupId).startsWith('product-')) return true
  return false
}

export function resolveProductSessions({ articles = [], language, t }) {
  const remote = articles.filter(
    (article) => article.status === 'published' && article.category,
  )

  return PRODUCT_HELP_SESSIONS.map((def) => {
    const localized =
      remote.find(
        (article) => matchesSessionDef(article, def) && article.language === language,
      ) ||
      remote.find((article) => matchesSessionDef(article, def) && article.language === 'fr')

    if (localized) {
      return {
        ...localized,
        sortOrder: Number.isFinite(localized.sortOrder) ? localized.sortOrder : def.sortOrder,
        pinned: localized.pinned === true || def.pinned === true,
      }
    }

    return {
      id: def.id,
      translationGroupId: def.id,
      category: def.category,
      language,
      title: t(def.titleKey),
      summary: t(def.summaryKey),
      content: t(def.contentKey),
      status: 'published',
      sortOrder: def.sortOrder,
      pinned: def.pinned === true,
      source: 'local',
    }
  }).sort((a, b) => {
    const orderA = Number.isFinite(a.sortOrder) ? a.sortOrder : 0
    const orderB = Number.isFinite(b.sortOrder) ? b.sortOrder : 0
    if (orderA !== orderB) return orderA - orderB
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
    return 0
  })
}

export function findProductSession({ articles = [], sessionId, language, t }) {
  const sessions = resolveProductSessions({ articles, language, t })
  return (
    sessions.find((session) => session.id === sessionId) ||
    sessions.find((session) => (session.translationGroupId || session.id) === sessionId) ||
    null
  )
}
