import {
  buildShareOgUrl,
  buildSharePreviewUrl as buildSharedSharePreviewUrl,
  resolvePublicShareTarget,
} from '@moxt/shared/share/shareLinkUtils.js'
import { getSiteUrl } from '../../utils/siteUrl'

function supabaseProjectUrl() {
  return import.meta.env.VITE_SUPABASE_URL || ''
}

/**
 * URL de preview OG pour crawlers (WhatsApp / Facebook / Telegram).
 * Prefers CANONICAL_SHARE_SITE `/share/{kind}/{id}` (API Gateway) so entity
 * og:title / og:image are returned. Falls back to the Supabase Edge Function
 * path when an override host is needed for local debugging.
 */
export function buildEntitySharePreviewUrl({ kind, entityId } = {}) {
  const og = buildShareOgUrl({ kind, entityId })
  if (og) return og
  return buildSharedSharePreviewUrl({
    kind,
    entityId,
    supabaseUrl: supabaseProjectUrl(),
  })
}

/**
 * URL absolue partagée (WhatsApp / copier / share natif).
 * Prefers the OG gateway so crawlers get entity Open Graph; humans follow the
 * meta refresh / redirect to the in-app public target. Falls back to a
 * moxtapp.ru deep link only when kind/id cannot build a share path.
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
  return `${getSiteUrl()}${target.startsWith('/') ? target : `/${target}`}`
}

export { resolvePublicShareTarget }
