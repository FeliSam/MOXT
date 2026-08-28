/**
 * Image feed plein écran — conteneur hauteur complète, image entière en contain (letterbox si besoin).
 */
export function FeedMediaImage({
  src,
  alt = '',
  loading = 'lazy',
  onError,
  className = '',
}) {
  if (!src) return null

  return (
    <div className={`absolute inset-0 overflow-hidden bg-black ${className}`}>
      <div className="absolute inset-0 flex items-center justify-center p-2">
        <img
          src={src}
          alt={alt}
          className="max-h-full max-w-full rounded-2xl object-contain object-center"
          loading={loading}
          draggable={false}
          onError={onError}
        />
      </div>
    </div>
  )
}
