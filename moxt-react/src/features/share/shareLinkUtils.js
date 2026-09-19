import {
  buildSharePreviewUrl as buildSharedSharePreviewUrl,
  resolvePublicShareTarget,
} from '@moxt/shared/share/shareLinkUtils.js'
import { getSiteUrl } from '../../utils/siteUrl'

/** Prefere www.moxtapp.ru pour les liens Partager / OG. */
function shareSiteUrl() {
  const site = getSiteUrl()
  if (/^https?:\/\/(www\.)?moxtapp\.ru$/i.test(site)) return 'https://www.moxtapp.ru'
  return site
}

/** URL de preview OG (proxy Netlify /share → Edge Function). */
export function buildEntitySharePreviewUrl({ kind, entityId } = {}) {
  return buildSharedSharePreviewUrl({
    kind,
    entityId,
    siteUrl: shareSiteUrl(),
  })
}

/**
 * URL absolue partagee (WhatsApp / copier / share natif).
 * Domaine www.moxtapp.ru/share/... ; Netlify proxy vers share-preview pour les crawlers.
 */
export function buildEntityShareUrl(item = {}) {
  const preview = buildEntitySharePreviewUrl({
    kind: item.kind,
    entityId: item.entityId,
  })
  if (preview) return preview

  const target = resolvePublicShareTarget({
    kind: item.kind,
    entityId: item.entityId,
    href: item.href,
    feedHref: item.feedHref,
  })
  return `${shareSiteUrl()}${target.startsWith('/') ? target : `/${target}`}`
}

export { resolvePublicShareTarget }
