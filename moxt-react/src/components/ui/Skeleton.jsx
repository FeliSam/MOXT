/*
  Skeleton — placeholders de chargement avec animation shimmer

  Composants :
    Skeleton          → bloc generique (remplace l'ancien)
    SkeletonText      → ligne(s) de texte
    SkeletonAvatar    → cercle ou carre avatar
    SkeletonCard      → carte complete (remplace l'ancien)
    SkeletonRow       → ligne de liste (remplace l'ancien)
    SkeletonGrid      → grille de cartes
    SkeletonList      → liste de lignes
    SkeletonStat      → bloc KPI
    SkeletonBadge     → badge inline
*/

/* ─── Bloc generique ─────────────────────────────────────────────────────── */
export function Skeleton({ className = '', rounded = 'rounded-xl', style }) {
  return (
    <div
      aria-hidden="true"
      className={`skeleton-shimmer ${rounded} ${className}`}
      style={style}
    />
  )
}

/* ─── Lignes de texte ────────────────────────────────────────────────────── */
/*
  lines  : nombre de lignes (defaut 3)
  widths : tableau de largeurs Tailwind par ligne
           ex. ['w-3/4', 'w-full', 'w-1/2']
           Si non fourni, variation automatique
*/
export function SkeletonText({ lines = 3, widths, className = '' }) {
  const defaultWidths = ['w-3/4', 'w-full', 'w-full', 'w-5/6', 'w-2/3', 'w-4/5']
  return (
    <div className={`grid gap-2 ${className}`} aria-hidden="true">
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton
          key={i}
          className={`h-3.5 ${widths ? (widths[i] ?? 'w-full') : defaultWidths[i % defaultWidths.length]}`}
        />
      ))}
    </div>
  )
}

/* ─── Avatar ─────────────────────────────────────────────────────────────── */
export function SkeletonAvatar({ size = 40, square = false, className = '' }) {
  return (
    <Skeleton
      rounded={square ? 'rounded-xl' : 'rounded-full'}
      className={className}
      style={{ width: size, height: size, flexShrink: 0 }}
    />
  )
}

/* ─── Badge inline ───────────────────────────────────────────────────────── */
export function SkeletonBadge({ className = '' }) {
  return <Skeleton rounded="rounded-full" className={`h-5 w-16 ${className}`} aria-hidden="true" />
}

/* ─── Stat / KPI ─────────────────────────────────────────────────────────── */
export function SkeletonStat({ className = '' }) {
  return (
    <div
      aria-busy="true"
      className={`rounded-[var(--radius-card)] border border-[var(--app-border)] bg-[var(--app-surface)] p-4 ${className}`}
    >
      <Skeleton className="h-3 w-1/2" />
      <Skeleton className="mt-3 h-7 w-2/5" />
      <Skeleton className="mt-2 h-2.5 w-3/5" />
    </div>
  )
}

/* ─── Carte complete ─────────────────────────────────────────────────────── */
export function SkeletonCard({ className = '', hasImage = true }) {
  return (
    <div
      aria-busy="true"
      className={`rounded-[var(--radius-card-lg)] border border-[var(--app-border)] bg-[var(--app-surface)] p-5 sm:p-6 ${className}`}
    >
      {hasImage && <Skeleton rounded="rounded-xl" className="aspect-[16/9] w-full" />}
      <Skeleton className={`h-4 w-3/4 ${hasImage ? 'mt-5' : ''}`} />
      <Skeleton className="mt-3 h-3 w-1/2" />
      <div className="mt-4 flex items-center justify-between">
        <Skeleton className="h-4 w-1/4" />
        <SkeletonBadge />
      </div>
    </div>
  )
}

/* ─── Ligne de liste ─────────────────────────────────────────────────────── */
export function SkeletonRow({ className = '', hasAvatar = true }) {
  return (
    <div
      aria-busy="true"
      className={`flex items-center gap-3 rounded-[var(--radius-card)] bg-[var(--app-surface-muted)] p-4 ${className}`}
    >
      {hasAvatar && <SkeletonAvatar size={40} square />}
      <div className="min-w-0 flex-1">
        <Skeleton className="h-3.5 w-2/5" />
        <Skeleton className="mt-2 h-3 w-3/5" />
      </div>
      <SkeletonBadge />
    </div>
  )
}

/* ─── Liste de lignes ────────────────────────────────────────────────────── */
export function SkeletonList({ count = 4, hasAvatar = true, className = '' }) {
  return (
    <div className={`grid gap-2 ${className}`} aria-busy="true" aria-label="Chargement...">
      {Array.from({ length: count }, (_, i) => (
        <SkeletonRow key={i} hasAvatar={hasAvatar} />
      ))}
    </div>
  )
}

/* ─── Grille de cartes ───────────────────────────────────────────────────── */
export function SkeletonGrid({ count = 6, cols = 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3', hasImage = true, className = '' }) {
  return (
    <div className={`grid gap-4 ${cols} ${className}`} aria-busy="true" aria-label="Chargement...">
      {Array.from({ length: count }, (_, i) => (
        <SkeletonCard key={i} hasImage={hasImage} />
      ))}
    </div>
  )
}

/* ─── Message de conversation ────────────────────────────────────────────── */
export function SkeletonMessage({ align = 'left', className = '' }) {
  const isRight = align === 'right'
  return (
    <div
      aria-hidden="true"
      className={`flex items-end gap-2 ${isRight ? 'flex-row-reverse' : ''} ${className}`}
    >
      {!isRight && <SkeletonAvatar size={32} />}
      <div className={`grid gap-1 ${isRight ? 'items-end' : ''}`} style={{ maxWidth: '70%' }}>
        <Skeleton rounded="rounded-2xl" className={`h-10 ${isRight ? 'w-48' : 'w-56'}`} />
        <Skeleton className="h-2.5 w-16" />
      </div>
    </div>
  )
}
