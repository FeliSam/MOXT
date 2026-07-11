export const quickActions = [
  {
    label: 'Créer un transfert',
    description: 'Envoyer de l’argent en quelques étapes',
    path: '/transfers',
    image: '/assets/services/3d/service-transfer.png',
    imageLogo: '/assets/services/service-transfer.png',
  },
  {
    label: 'Publier une annonce',
    description: 'Produit, service ou location',
    path: '/marketplace/publish',
    image: '/assets/services/3d/quick-marketplace.png',
    imageLogo: '/assets/services/quick-marketplace.png',
  },
  {
    label: 'Envoyer un colis',
    description: 'Trouver ou proposer un trajet',
    path: '/parcels/publish',
    image: '/assets/services/3d/quick-parcel.png',
    imageLogo: '/assets/services/quick-parcel.png',
  },
  {
    label: 'Publier un job',
    description: 'Mission ou opportunité',
    path: '/jobs/publish',
    image: '/assets/services/3d/quick-job.png',
    imageLogo: '/assets/services/quick-job.png',
  },
  {
    label: 'Créer un événement',
    description: 'Rencontre, atelier ou formation',
    path: '/events/publish',
    image: '/assets/services/3d/quick-event.png',
    imageLogo: '/assets/services/quick-event.png',
  },
]

export const coreServices = [
  {
    title: 'Transferts',
    description: 'Envoyez, suivez et gérez vos opérations simplement.',
    path: '/transfers',
    image: '/assets/services/3d/service-transfer.png',
    imageLogo: '/assets/services/service-transfer.png',
    tag: 'Essentiel',
  },
  {
    title: 'Marketplace',
    description: 'Achetez et vendez entre particuliers et entreprises.',
    path: '/marketplace',
    image: '/assets/services/3d/service-marketplace.png',
    imageLogo: '/assets/services/service-marketplace.png',
    tag: 'Découvrir',
  },
  {
    title: 'Colis',
    description: 'Publiez, trouvez et réservez des kilos disponibles.',
    path: '/parcels',
    image: '/assets/services/3d/service-parcel.png',
    imageLogo: '/assets/services/service-parcel.png',
    tag: 'Voyages',
  },
  {
    title: 'Jobs',
    description: 'Découvrez des missions, jobs et opportunités professionnelles.',
    path: '/jobs',
    image: '/assets/services/3d/service-job.png',
    imageLogo: '/assets/services/quick-job.png',
    tag: 'Carrière',
  },
  {
    title: 'Échangeurs',
    description: 'Trouvez des partenaires fiables et vérifiés.',
    path: '/exchangers',
    image: '/assets/services/3d/service-exchangers.png',
    imageLogo: '/assets/services/service-exchangers.png',
    tag: 'Vérifiés',
  },
  {
    title: 'P2P',
    description: 'Publiez et trouvez des offres entre utilisateurs vérifiés.',
    path: '/p2p',
    image: '/assets/services/3d/service-p2p.png',
    imageLogo: '/assets/services/service-p2p.png',
    tag: 'Échanges',
  },
  {
    title: 'Entreprises',
    description: 'Explorez les services des professionnels MOXT.',
    path: '/businesses',
    image: '/assets/services/3d/service-businesses.png',
    imageLogo: '/assets/services/service-businesses.png',
    tag: 'Professionnel',
  },
  {
    title: 'Événements',
    description: 'Participez aux rencontres, ateliers et activités de la communauté.',
    path: '/events',
    image: '/assets/services/3d/service-events.png',
    imageLogo: '/assets/services/quick-event.png',
    tag: 'Agenda',
  },
  {
    title: 'Actualité',
    description: 'Jobs, événements, actualités et opportunités.',
    path: '/news',
    image: '/assets/services/3d/service-news.png',
    imageLogo: '/assets/services/service-community.png',
    tag: 'En direct',
  },
]

export const quickActionAccents = [
  'from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/30',
  'from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/30',
  'from-blue-50 to-cyan-50 dark:from-blue-950/40 dark:to-cyan-950/30',
  'from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/30',
  'from-violet-50 to-fuchsia-50 dark:from-violet-950/40 dark:to-fuchsia-950/30',
]

export const serviceTones = [
  'success',
  'info',
  'warning',
  'success',
  'violet',
  'rose',
  'info',
  'warning',
  'violet',
]

export const trustHighlights = [
  ['Profils vérifiés', 'Identifiez plus facilement les utilisateurs et entreprises contrôlés.'],
  ['Contexte centralisé', 'Messages, reçus et réclamations restent liés à chaque opération.'],
  ['Services locaux', 'Des outils pensés pour les échanges entre l’Afrique et la Russie.'],
  ['Données maîtrisées', 'Vos préférences et brouillons restent accessibles sur cet appareil.'],
]

/** Base commune des pistes horizontales dashboard. */
export const dashboardTrackBase =
  'horizontal-track scrollbar-hidden flex gap-3 px-4 py-2 sm:gap-4'

/** Carrousel horizontal — mobile & tablette (< lg), débordement bord à bord. */
export const dashboardCarouselTrackClass = `${dashboardTrackBase} -mx-4`

/** Grille 4 colonnes à partir de lg — actions rapides, cartes confiance. */
export const dashboardFourUpTrackClass =
  `${dashboardTrackBase} horizontal-track--lg-grid -mx-4 lg:mx-0 lg:grid lg:grid-cols-4 lg:gap-4 lg:px-0`

export const dashboardFourUpItemClass =
  'w-[clamp(10.5rem,22vw,14rem)] shrink-0 lg:w-auto lg:min-w-0 lg:shrink'

/** Annonces — carrousel puis grille 4 colonnes (lg). */
export const dashboardListingTrackClass =
  `${dashboardTrackBase} horizontal-track--lg-grid -mx-4 lg:mx-0 lg:grid lg:grid-cols-4 lg:gap-4 lg:px-0`

export const dashboardListingItemClass =
  'w-[clamp(12rem,25vw,16rem)] shrink-0 overflow-visible lg:w-auto lg:min-w-0 lg:shrink'

/** Services essentiels — carrousel horizontal sur tous les écrans. */
export const dashboardServicesTrackClass = `${dashboardTrackBase} -mx-4`

export const dashboardServiceItemClass =
  'w-[clamp(13.5rem,62vw,17.5rem)] shrink-0 sm:w-[clamp(12.5rem,44vw,16rem)] lg:w-[clamp(14rem,20vw,18rem)]'

/** Tuiles live — largeur fixe, toujours en carrousel scrollable. */
export const dashboardLiveItemClass =
  'w-[clamp(12rem,55vw,15.5rem)] shrink-0 sm:w-[clamp(11.75rem,39vw,15rem)] md:w-[clamp(11.5rem,25vw,14.5rem)] lg:w-[clamp(12.5rem,21vw,15rem)]'

/** Liste live — scroll horizontal, largeur bornée (scroll fiable dans une Card). */
export const dashboardLiveTrackClass =
  'horizontal-track scrollbar-hidden flex w-full max-w-full min-w-0 gap-3 py-1 sm:gap-4'

export const dashboardLiveCardClass = 'min-w-0 overflow-hidden !p-0'

/** Accents visuels par type de liste live. */
export const dashboardLiveAccents = {
  parcels: {
    stripe: 'from-emerald-500 to-teal-500',
    icon: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/45 dark:text-emerald-300',
    chip: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200',
  },
  jobs: {
    stripe: 'from-violet-500 to-indigo-500',
    icon: 'bg-violet-100 text-violet-700 dark:bg-violet-950/45 dark:text-violet-300',
    chip: 'bg-violet-50 text-violet-800 dark:bg-violet-950/40 dark:text-violet-200',
  },
  events: {
    stripe: 'from-amber-500 to-orange-500',
    icon: 'bg-amber-100 text-amber-800 dark:bg-amber-950/45 dark:text-amber-300',
    chip: 'bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200',
  },
}
