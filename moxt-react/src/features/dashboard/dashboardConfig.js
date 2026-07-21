/**
 * Actions rapides — disposition bento (même modèle que Services essentiels).
 * size: hero | featured | medium | compact
 */
export const quickActions = [
  {
    id: 'qa-transfer',
    labelKey: 'dashboard.config.quickActions.transfer.label',
    descriptionKey: 'dashboard.config.quickActions.transfer.description',
    path: '/transfers',
    image: '/assets/services/3d/service-transfer.png',
    imageLogo: '/assets/services/service-transfer.png',
    size: 'hero',
    iconPos: 'br',
    surface:
      'bg-[linear-gradient(135deg,color-mix(in_srgb,var(--app-teal)_15.4%,var(--app-surface))_0%,var(--app-surface-muted)_100%)] dark:bg-[linear-gradient(135deg,rgba(8,112,95,0.308)_0%,var(--app-surface-muted)_100%)]',
  },
  {
    id: 'qa-listing',
    labelKey: 'dashboard.config.quickActions.listing.label',
    descriptionKey: 'dashboard.config.quickActions.listing.description',
    path: '/marketplace/publish',
    image: '/assets/services/3d/quick-marketplace.png',
    imageLogo: '/assets/services/quick-marketplace.png',
    size: 'featured',
    iconPos: 'tr',
    surface:
      'bg-[linear-gradient(160deg,color-mix(in_srgb,#0891b2_13.2%,var(--app-surface))_0%,var(--app-surface-muted)_100%)] dark:bg-[linear-gradient(160deg,rgba(8,145,178,0.242)_0%,var(--app-surface-muted)_100%)]',
  },
  {
    id: 'qa-parcel',
    labelKey: 'dashboard.config.quickActions.parcel.label',
    descriptionKey: 'dashboard.config.quickActions.parcel.description',
    path: '/parcels/publish',
    image: '/assets/services/3d/quick-parcel.png',
    imageLogo: '/assets/services/quick-parcel.png',
    size: 'medium',
    iconPos: 'br',
    surface:
      'bg-[linear-gradient(145deg,color-mix(in_srgb,#245de8_9.9%,var(--app-surface))_0%,var(--app-surface-muted)_100%)] dark:bg-[linear-gradient(145deg,rgba(36,93,232,0.198)_0%,var(--app-surface-muted)_100%)]',
  },
  {
    id: 'qa-job',
    labelKey: 'dashboard.config.quickActions.job.label',
    descriptionKey: 'dashboard.config.quickActions.job.description',
    path: '/jobs/publish',
    image: '/assets/services/3d/quick-job.png',
    imageLogo: '/assets/services/quick-job.png',
    size: 'medium',
    iconPos: 'bl',
    surface:
      'bg-[linear-gradient(145deg,color-mix(in_srgb,#b45309_9.9%,var(--app-surface))_0%,var(--app-surface-muted)_100%)] dark:bg-[linear-gradient(145deg,rgba(180,83,9,0.198)_0%,var(--app-surface-muted)_100%)]',
  },
  {
    id: 'qa-event',
    labelKey: 'dashboard.config.quickActions.event.label',
    descriptionKey: 'dashboard.config.quickActions.event.description',
    path: '/events/publish',
    image: '/assets/services/3d/quick-event.png',
    imageLogo: '/assets/services/quick-event.png',
    size: 'compact',
    iconPos: 'tr',
    surface:
      'bg-[linear-gradient(145deg,color-mix(in_srgb,#7c3aed_8.8%,var(--app-surface))_0%,var(--app-surface-muted)_100%)] dark:bg-[linear-gradient(145deg,rgba(124,58,237,0.176)_0%,var(--app-surface-muted)_100%)]',
  },
]

/**
 * Services essentiels — disposition bento (hiérarchie UX).
 * size: hero | featured | medium | compact
 * iconPos: coin de débordement de l’illustration 3D
 */
export const coreServices = [
  {
    id: 'transfers',
    titleKey: 'dashboard.config.services.transfers.title',
    descriptionKey: 'dashboard.config.services.transfers.description',
    path: '/transfers',
    image: '/assets/services/3d/service-transfer.png',
    imageLogo: '/assets/services/service-transfer.png',
    tagKey: 'dashboard.config.services.transfers.tag',
    size: 'hero',
    iconPos: 'br',
    surface:
      'bg-[linear-gradient(135deg,color-mix(in_srgb,var(--app-teal)_15.4%,var(--app-surface))_0%,var(--app-surface-muted)_100%)] dark:bg-[linear-gradient(135deg,rgba(8,112,95,0.308)_0%,var(--app-surface-muted)_100%)]',
  },
  {
    id: 'p2p',
    titleKey: 'dashboard.config.services.p2p.title',
    descriptionKey: 'dashboard.config.services.p2p.description',
    path: '/p2p',
    image: '/assets/services/3d/service-p2p.png',
    imageLogo: '/assets/services/service-p2p.png',
    tagKey: 'dashboard.config.services.p2p.tag',
    size: 'featured',
    iconPos: 'tr',
    surface:
      'bg-[linear-gradient(160deg,color-mix(in_srgb,#0891b2_13.2%,var(--app-surface))_0%,var(--app-surface-muted)_100%)] dark:bg-[linear-gradient(160deg,rgba(8,145,178,0.242)_0%,var(--app-surface-muted)_100%)]',
  },
  {
    id: 'marketplace',
    titleKey: 'dashboard.config.services.marketplace.title',
    descriptionKey: 'dashboard.config.services.marketplace.description',
    path: '/marketplace',
    image: '/assets/services/3d/service-marketplace.png',
    imageLogo: '/assets/services/service-marketplace.png',
    tagKey: 'dashboard.config.services.marketplace.tag',
    size: 'medium',
    iconPos: 'br',
    surface:
      'bg-[linear-gradient(145deg,color-mix(in_srgb,#0ea5e9_9.9%,var(--app-surface))_0%,var(--app-surface-muted)_100%)] dark:bg-[linear-gradient(145deg,rgba(14,165,233,0.198)_0%,var(--app-surface-muted)_100%)]',
  },
  {
    id: 'parcels',
    titleKey: 'dashboard.config.services.parcels.title',
    descriptionKey: 'dashboard.config.services.parcels.description',
    path: '/parcels',
    image: '/assets/services/3d/service-parcel.png',
    imageLogo: '/assets/services/service-parcel.png',
    tagKey: 'dashboard.config.services.parcels.tag',
    size: 'medium',
    iconPos: 'bl',
    surface:
      'bg-[linear-gradient(145deg,color-mix(in_srgb,#d97706_9.9%,var(--app-surface))_0%,var(--app-surface-muted)_100%)] dark:bg-[linear-gradient(145deg,rgba(217,119,6,0.198)_0%,var(--app-surface-muted)_100%)]',
  },
  {
    id: 'jobs',
    titleKey: 'dashboard.config.services.jobs.title',
    descriptionKey: 'dashboard.config.services.jobs.description',
    path: '/jobs',
    image: '/assets/services/3d/service-job.png',
    imageLogo: '/assets/services/quick-job.png',
    tagKey: 'dashboard.config.services.jobs.tag',
    size: 'compact',
    iconPos: 'tr',
    surface:
      'bg-[linear-gradient(145deg,color-mix(in_srgb,#7c3aed_8.8%,var(--app-surface))_0%,var(--app-surface-muted)_100%)] dark:bg-[linear-gradient(145deg,rgba(124,58,237,0.176)_0%,var(--app-surface-muted)_100%)]',
  },
  {
    id: 'exchangers',
    titleKey: 'dashboard.config.services.exchangers.title',
    descriptionKey: 'dashboard.config.services.exchangers.description',
    path: '/exchangers',
    image: '/assets/services/3d/service-exchangers.png',
    imageLogo: '/assets/services/service-exchangers.png',
    tagKey: 'dashboard.config.services.exchangers.tag',
    size: 'compact',
    iconPos: 'br',
    surface:
      'bg-[linear-gradient(145deg,color-mix(in_srgb,#08705f_8.8%,var(--app-surface))_0%,var(--app-surface-muted)_100%)] dark:bg-[linear-gradient(145deg,rgba(8,112,95,0.176)_0%,var(--app-surface-muted)_100%)]',
  },
  {
    id: 'businesses',
    titleKey: 'dashboard.config.services.businesses.title',
    descriptionKey: 'dashboard.config.services.businesses.description',
    path: '/businesses',
    image: '/assets/services/3d/service-businesses.png',
    imageLogo: '/assets/services/service-businesses.png',
    tagKey: 'dashboard.config.services.businesses.tag',
    size: 'compact',
    iconPos: 'bl',
    surface:
      'bg-[linear-gradient(145deg,color-mix(in_srgb,#245de8_8.8%,var(--app-surface))_0%,var(--app-surface-muted)_100%)] dark:bg-[linear-gradient(145deg,rgba(36,93,232,0.176)_0%,var(--app-surface-muted)_100%)]',
  },
  {
    id: 'events',
    titleKey: 'dashboard.config.services.events.title',
    descriptionKey: 'dashboard.config.services.events.description',
    path: '/events',
    image: '/assets/services/3d/service-events.png',
    imageLogo: '/assets/services/quick-event.png',
    tagKey: 'dashboard.config.services.events.tag',
    size: 'compact',
    iconPos: 'tr',
    surface:
      'bg-[linear-gradient(145deg,color-mix(in_srgb,#ea580c_8.8%,var(--app-surface))_0%,var(--app-surface-muted)_100%)] dark:bg-[linear-gradient(145deg,rgba(234,88,12,0.176)_0%,var(--app-surface-muted)_100%)]',
  },
  {
    id: 'news',
    titleKey: 'dashboard.config.services.news.title',
    descriptionKey: 'dashboard.config.services.news.description',
    path: '/news',
    image: '/assets/services/3d/service-news.png',
    imageLogo: '/assets/services/service-community.png',
    tagKey: 'dashboard.config.services.news.tag',
    size: 'compact',
    iconPos: 'br',
    surface:
      'bg-[linear-gradient(145deg,color-mix(in_srgb,#db2777_8.8%,var(--app-surface))_0%,var(--app-surface-muted)_100%)] dark:bg-[linear-gradient(145deg,rgba(219,39,119,0.176)_0%,var(--app-surface-muted)_100%)]',
  },
]

export const quickActionAccents = [
  'from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/30',
  'from-sky-50 to-blue-50 dark:from-sky-950/40 dark:to-blue-950/30',
  'from-cyan-50 to-blue-50 dark:from-cyan-950/40 dark:to-blue-950/30',
  'from-violet-50 to-indigo-50 dark:from-violet-950/40 dark:to-indigo-950/30',
  'from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/30',
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
  {
    titleKey: 'dashboard.config.trust.verifiedProfiles.title',
    descriptionKey: 'dashboard.config.trust.verifiedProfiles.description',
  },
  {
    titleKey: 'dashboard.config.trust.centralizedContext.title',
    descriptionKey: 'dashboard.config.trust.centralizedContext.description',
  },
  {
    titleKey: 'dashboard.config.trust.localServices.title',
    descriptionKey: 'dashboard.config.trust.localServices.description',
  },
  {
    titleKey: 'dashboard.config.trust.controlledData.title',
    descriptionKey: 'dashboard.config.trust.controlledData.description',
  },
]

/** Base commune des pistes horizontales dashboard. */
export const dashboardTrackBase =
  'horizontal-track scrollbar-hidden flex gap-3 px-4 py-2 sm:gap-4'

/** Carrousel horizontal — mobile & tablette (< lg), débordement bord à bord. */
export const dashboardCarouselTrackClass = `${dashboardTrackBase} dashboard-h-bleed`

/** Actions rapides — carrousel horizontal sur tous les écrans. */
export const dashboardQuickActionsTrackClass = `${dashboardTrackBase} dashboard-h-bleed lg:mx-0`

export const dashboardQuickActionsItemClass =
  'w-[clamp(12rem,68vw,16rem)] shrink-0 sm:w-[clamp(11rem,28vw,15rem)] lg:w-[clamp(13rem,18vw,16.5rem)]'

/** Grille 4 colonnes à partir de lg — cartes confiance, annonces. */
export const dashboardFourUpTrackClass =
  `${dashboardTrackBase} horizontal-track--lg-grid dashboard-h-bleed lg:mx-0 lg:grid lg:grid-cols-4 lg:gap-4 lg:px-0`

export const dashboardFourUpItemClass =
  'w-[clamp(10.5rem,22vw,14rem)] shrink-0 lg:w-auto lg:min-w-0 lg:shrink'

/** Annonces — carrousel puis grille 4 colonnes (lg). */
export const dashboardListingTrackClass =
  `${dashboardTrackBase} horizontal-track--lg-grid dashboard-h-bleed lg:mx-0 lg:grid lg:grid-cols-4 lg:gap-4 lg:px-0`

export const dashboardListingItemClass =
  'w-[clamp(12rem,25vw,16rem)] shrink-0 overflow-hidden lg:w-auto lg:min-w-0 lg:shrink'

/** Services essentiels — carrousel horizontal sur tous les écrans. */
export const dashboardServicesTrackClass = `${dashboardTrackBase} dashboard-h-bleed`

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
