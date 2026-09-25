import { useState } from 'react'
import './avatarEditor.css'

/**
 * Aperçu circulaire premium de l’avatar : anneau de verre + liseré lumineux teal (sombre),
 * médaillon sur maillage flou teal/marine (clair). Accepte n’importe quelle source d’image :
 * data-URI SVG (DiceBear) aujourd’hui, JPEG portrait hébergé sur le CDN demain.
 */
export function AvatarPreviewRing({ src, alt, className = '', fit = 'cover', children }) {
  const [loadedSrc, setLoadedSrc] = useState(null)
  const isDataUri = typeof src === 'string' && src.startsWith('data:')
  const loading = Boolean(src) && !isDataUri && loadedSrc !== src
  return (
    <div className={`relative grid place-items-center ${className}`}>
      <div aria-hidden="true" className="ave-mesh" />
      <div className="ave-ring size-[12.75rem] sm:size-[14.5rem] lg:size-[18.5rem]">
        <div aria-hidden="true" className="ave-ring-glow" />
        <div className="ave-ring-media relative size-full overflow-hidden rounded-full">
          {src ? (
            <img
              src={src}
              alt={alt}
              onLoad={() => setLoadedSrc(src)}
              className={`size-full transition-opacity duration-300 ${
                fit === 'contain' ? 'object-contain' : 'object-cover'
              } ${loading ? 'opacity-0' : 'opacity-100'}`}
              draggable="false"
              decoding="async"
            />
          ) : null}
          {loading ? (
            <span aria-hidden="true" className="ave-shimmer absolute inset-0 rounded-full" />
          ) : null}
          {children}
        </div>
      </div>
    </div>
  )
}

export default AvatarPreviewRing
