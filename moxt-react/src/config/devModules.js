/** Modules pilotés par l’admin — défaut false = beta off ; true = actif pour tous. */
export const DEV_MODULE_IDS = ['stars', 'feed', 'videos', 'events', 'jobs', 'parcels']

export const DEFAULT_DEV_MODULE_FLAGS = Object.freeze({
  stars: false,
  feed: false,
  videos: false,
  events: true,
  jobs: true,
  parcels: true,
})

export const DEV_MODULE_META = {
  stars: {
    labelKey: 'admin.modules.stars',
    hintKey: 'admin.modules.starsHint',
    paths: ['/stars'],
  },
  feed: {
    labelKey: 'admin.modules.feed',
    hintKey: 'admin.modules.feedHint',
    paths: ['/feed'],
  },
  videos: {
    labelKey: 'admin.modules.videos',
    hintKey: 'admin.modules.videosHint',
    paths: ['/videos'],
  },
  events: {
    labelKey: 'admin.modules.events',
    hintKey: 'admin.modules.eventsHint',
    paths: ['/events'],
  },
  jobs: {
    labelKey: 'admin.modules.jobs',
    hintKey: 'admin.modules.jobsHint',
    paths: ['/jobs'],
  },
  parcels: {
    labelKey: 'admin.modules.parcels',
    hintKey: 'admin.modules.parcelsHint',
    paths: ['/parcels'],
  },
}

export function normalizeDevModuleFlags(raw = {}) {
  return DEV_MODULE_IDS.reduce((acc, id) => {
    if (raw != null && Object.prototype.hasOwnProperty.call(raw, id)) {
      acc[id] = Boolean(raw[id])
    } else {
      acc[id] = Boolean(DEFAULT_DEV_MODULE_FLAGS[id])
    }
    return acc
  }, {})
}

export function devModuleForPath(pathname = '') {
  if (!pathname) return null
  if (pathname === '/feed' || pathname.startsWith('/feed/')) return 'feed'
  if (pathname === '/videos' || pathname.startsWith('/videos/')) return 'videos'
  if (pathname === '/stars' || pathname.startsWith('/stars/')) return 'stars'
  if (pathname === '/events' || pathname.startsWith('/events/')) return 'events'
  if (pathname === '/jobs' || pathname.startsWith('/jobs/')) return 'jobs'
  if (pathname === '/parcels' || pathname.startsWith('/parcels/')) return 'parcels'
  return null
}
