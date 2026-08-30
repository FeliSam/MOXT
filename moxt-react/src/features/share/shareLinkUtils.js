import {
  buildSharePreviewUrl as buildSharedSharePreviewUrl,
  resolveInAppShareTarget,
} from '@moxt/shared/share/shareLinkUtils.js'
import { getSiteUrl } from '../../utils/siteUrl'

function supabaseProjectUrl() {
  return import.meta.env.VITE_SUPABASE_URL || ''
}

/** URL de preview OG (Edge Function) — utilisée par les apps de messagerie. */
export function buildEntitySharePreviewUrl({ kind, entityId } = {}) {
  return buildSharedSharePreviewUrl({
    kind,
    entityId,
    supabaseUrl: supabaseProjectUrl(),
  })
}

/** URL absolue partagée avec les humains (copier / partager natif). */
export function buildEntityShareUrl(item = {}) {
  const target = resolveInAppShareTarget({
    kind: item.kind,
    entityId: item.entityId,
    href: item.href,
    feedHref: item.feedHref,
  })
  return `${getSiteUrl()}${target.startsWith('/') ? target : `/${target}`}`
}

export { resolveInAppShareTarget }
