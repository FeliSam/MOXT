/**
 * Anneau autour d'un avatar signalant des statuts actifs.
 * - dégradé coloré (brand → cobalt) si au moins un statut n'a pas encore été vu
 * - gris si tous les statuts de cet auteur ont déjà été vus
 * - pas d'anneau si l'auteur n'a aucun statut actif (rend juste `children`)
 */
export function StatusRing({ children, hasStatus = false, hasUnseen = false, size = 10, className = '' }) {
  if (!hasStatus) return children

  return (
    <span
      className={`inline-grid shrink-0 place-items-center rounded-full p-[2px] ${
        hasUnseen
          ? 'bg-gradient-to-tr from-brand-500 via-brand-600 to-[var(--app-cobalt)]'
          : 'bg-[var(--app-border)]'
      } ${className}`}
      style={{ width: `calc(${size / 4}rem + 4px)`, height: `calc(${size / 4}rem + 4px)` }}
    >
      <span className="grid size-full place-items-center rounded-full bg-[var(--app-surface)] p-[2px]">
        {children}
      </span>
    </span>
  )
}
