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
    image: '/assets/help/getting_started.svg',
    titleKey: 'productHelp.sessions.gettingStarted.title',
    summaryKey: 'productHelp.sessions.gettingStarted.summary',
    contentKey: 'productHelp.sessions.gettingStarted.content',
  },
  {
    id: 'product-transfers',
    category: 'transfers',
    sortOrder: 20,
    image: '/assets/help/transfers.svg',
    titleKey: 'productHelp.sessions.transfers.title',
    summaryKey: 'productHelp.sessions.transfers.summary',
    contentKey: 'productHelp.sessions.transfers.content',
  },
  {
    id: 'product-marketplace',
    category: 'marketplace',
    sortOrder: 30,
    image: '/assets/help/marketplace.svg',
    titleKey: 'productHelp.sessions.marketplace.title',
    summaryKey: 'productHelp.sessions.marketplace.summary',
    contentKey: 'productHelp.sessions.marketplace.content',
  },
  {
    id: 'product-parcels',
    category: 'parcels',
    sortOrder: 40,
    image: '/assets/help/parcels.svg',
    titleKey: 'productHelp.sessions.parcels.title',
    summaryKey: 'productHelp.sessions.parcels.summary',
    contentKey: 'productHelp.sessions.parcels.content',
  },
  {
    id: 'product-messages',
    category: 'messages',
    sortOrder: 50,
    image: '/assets/help/messages.svg',
    titleKey: 'productHelp.sessions.messages.title',
    summaryKey: 'productHelp.sessions.messages.summary',
    contentKey: 'productHelp.sessions.messages.content',
  },
  {
    id: 'product-account',
    category: 'account',
    sortOrder: 60,
    image: '/assets/help/account.svg',
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
  const matchedGroupIds = new Set()

  const defBased = PRODUCT_HELP_SESSIONS.map((def) => {
    const matchingRemote = remote.filter((article) => matchesSessionDef(article, def))
    for (const article of matchingRemote) {
      matchedGroupIds.add(article.translationGroupId || article.id)
    }
    // Le contenu local (config/productHelpSessions.js + i18n) est déjà traduit
    // dans les 5 langues : on ne le remplace que si un article distant existe
    // EXACTEMENT dans la langue demandée, pour ne jamais afficher un texte
    // français incomplet à un lecteur non francophone.
    const localized = matchingRemote.find((article) => article.language === language)
    // Les images, elles, restent utiles même si le texte reste local (illustration
    // partagée entre toutes les langues).
    const fallbackImages = matchingRemote.find((article) => article.images?.length)?.images

    if (localized) {
      return {
        ...localized,
        images: localized.images?.length ? localized.images : def.image ? [def.image] : [],
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
      images: fallbackImages?.length ? fallbackImages : def.image ? [def.image] : [],
      status: 'published',
      sortOrder: def.sortOrder,
      pinned: def.pinned === true,
      source: 'local',
    }
  })

  // Sujets 100% pilotés depuis la base (aucune définition locale) : ex. P2P,
  // entreprises, jobs, événements... — n'importe quel article "produit" publié
  // dont le groupe n'a pas déjà été consommé ci-dessus.
  const extraGroups = new Map()
  for (const article of remote) {
    const groupId = article.translationGroupId || article.id
    if (matchedGroupIds.has(groupId)) continue
    if (!String(groupId).startsWith('product-')) continue
    if (!extraGroups.has(groupId)) extraGroups.set(groupId, [])
    extraGroups.get(groupId).push(article)
  }
  const dbOnly = [...extraGroups.values()].map((rows) => {
    const localized = rows.find((row) => row.language === language) || rows.find((row) => row.language === 'fr') || rows[0]
    return { ...localized, images: localized.images || [] }
  })

  return [...defBased, ...dbOnly].sort((a, b) => {
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
