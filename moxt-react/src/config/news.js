export const NEWS_CATEGORIES = [
  { value: 'all', label: 'Toutes' },
  { value: 'platform', label: 'Plateforme' },
  { value: 'community', label: 'Communauté' },
  { value: 'security', label: 'Sécurité' },
  { value: 'business', label: 'Entreprises' },
]

export const NEWS_ITEMS = [
  {
    id: 'NEWS-SECURITY',
    category: 'security',
    title: 'Les bons réflexes avant un paiement',
    summary:
      'Vérifiez le profil, conservez les échanges dans MOXT et ne transmettez jamais votre code secret.',
    publishedAt: '2026-06-01T08:00:00.000Z',
  },
  {
    id: 'NEWS-BUSINESS',
    category: 'business',
    title: 'Un espace professionnel plus complet',
    summary:
      'Les entreprises peuvent désormais relier leurs annonces, jobs, événements et services.',
    publishedAt: '2026-05-28T08:00:00.000Z',
  },
  {
    id: 'NEWS-SPA',
    category: 'platform',
    title: 'Navigation plus rapide dans toute l’application',
    summary:
      'Les pages changent sans rechargement complet et conservent le menu, le thème et l’état.',
    publishedAt: '2026-05-20T08:00:00.000Z',
  },
]
