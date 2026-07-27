/**
 * Regroupe les statuts actifs (non expirés) par auteur, triés :
 * - les groupes "officiels MOXT" en premier (même avant mon propre statut)
 * - puis mon propre groupe (si j'ai publié)
 * - puis les auteurs ayant des statuts non vus par moi
 * - puis les auteurs déjà entièrement vus
 * Dans chaque groupe, les statuts sont triés du plus ancien au plus récent
 * (ordre de lecture façon story).
 */
export function groupActiveStatusesByAuthor(statuses, viewerId) {
  const now = Date.now()
  const active = statuses.filter((s) => new Date(s.expiresAt).getTime() > now)

  // Une entreprise publie sous sa propre identité : un même auteur (personne
  // réelle) peut donc avoir un groupe personnel ET un groupe entreprise
  // distincts — d'où une clé composée plutôt que le seul authorId.
  const byAuthor = new Map()
  for (const status of active) {
    const key = `${status.authorId}:${status.businessId || ''}`
    if (!byAuthor.has(key)) {
      byAuthor.set(key, {
        authorId: status.authorId,
        authorName: status.authorName,
        authorAvatarUrl: status.authorAvatarUrl,
        businessId: status.businessId || null,
        items: [],
      })
    }
    byAuthor.get(key).items.push(status)
  }

  const groups = Array.from(byAuthor.values()).map((group) => {
    const items = [...group.items].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    )
    const hasUnseen = items.some((s) => !(s.viewedBy || []).includes(viewerId))
    const isOfficial = items.some((s) => s.isOfficial === true)
    const latestCreatedAt = items[items.length - 1]?.createdAt
    return { ...group, items, hasUnseen, isOfficial, latestCreatedAt }
  })

  groups.sort((a, b) => {
    if (a.isOfficial !== b.isOfficial) return a.isOfficial ? -1 : 1
    const aMine = a.authorId === viewerId && !a.businessId
    const bMine = b.authorId === viewerId && !b.businessId
    if (aMine !== bMine) return aMine ? -1 : 1
    if (a.hasUnseen !== b.hasUnseen) return a.hasUnseen ? -1 : 1
    return new Date(b.latestCreatedAt).getTime() - new Date(a.latestCreatedAt).getTime()
  })

  return groups
}
