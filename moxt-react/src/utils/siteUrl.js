export function getSiteUrl() {
  const configured = import.meta.env.VITE_SITE_URL
  if (configured) return String(configured).replace(/\/$/, '')
  if (typeof window !== 'undefined') return window.location.origin
  return 'https://moxt.app'
}

export function buildAbsoluteUrl(path = '/') {
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${getSiteUrl()}${normalized}`
}
