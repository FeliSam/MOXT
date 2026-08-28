import { useEffect, useState } from 'react'
import { isNative } from '../platform/capacitor.js'
import { resolveCachedMediaUrl } from '../services/media/cachedMediaResolver.js'

/**
 * Sur native, remplace progressivement l’URL réseau par l’URI disque si cache hit/miss+download.
 * Sur web, renvoie l’URL telle quelle.
 */
export function useCachedMediaUrl(
  remoteUrl,
  {
    kind,
    mediaId,
    objectKey,
    legacyBucket,
    legacyPath,
    entityType,
    entityId,
  } = {},
) {
  const [src, setSrc] = useState(remoteUrl || null)

  useEffect(() => {
    let cancelled = false
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync hook output with remote URL
    setSrc(remoteUrl || null)
    if (!remoteUrl || !isNative) return undefined

    void resolveCachedMediaUrl({
      url: remoteUrl,
      remoteUrl,
      kind,
      mediaId,
      objectKey,
      legacyBucket,
      legacyPath,
      entityType,
      entityId,
    }).then((next) => {
      if (!cancelled && next) setSrc(next)
    })

    return () => {
      cancelled = true
    }
  }, [remoteUrl, kind, mediaId, objectKey, legacyBucket, legacyPath, entityType, entityId])

  return src
}
