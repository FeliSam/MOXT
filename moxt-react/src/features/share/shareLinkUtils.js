import {
  buildSharePreviewUrl as buildSharedSharePreviewUrl,
  resolvePublicShareTarget,
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

/**
 * URL absolue partagée (WhatsApp / copier / share natif).
 * Préfère l'Edge Function share-preview pour que les crawlers reçoivent
 * le bon Open Graph ; les humains sont redirigés vers la cible in-app.
 * Sinon, retombe sur le deep link public moxtapp.ru.
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
