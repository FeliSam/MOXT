import { FiStar } from 'react-icons/fi'
import { useSelector } from 'react-redux'
import { selectBusinessReviewsBundle } from './reviewSelectors'

/**
 * Note compacte d'une entreprise, à poser à côté de son nom (annuaire,
 * échangeurs, choix du partenaire…). La note agrège l'avis sur le profil
 * entreprise ET les avis sur ses publications — même règle que la fiche
 * détail, pour qu'un utilisateur voie partout le même chiffre.
 *
 * N'affiche rien tant qu'aucun avis n'existe : un « 0 » serait lu comme une
 * mauvaise note alors qu'il s'agit d'une absence d'avis.
 */
/** Note seule (sans étoile ni pastille), pour une grille de statistiques. */
export function BusinessRatingValue({ business }) {
  const bundle = useSelector((state) =>
    business ? selectBusinessReviewsBundle(state, business) : null,
  )
  const count = bundle?.rating?.count || 0
  if (!count) return <>—</>
  return <>{(bundle.rating.average || 0).toFixed(1)}</>
}

export function BusinessRatingBadge({ business, className = '', showCount = true }) {
  const bundle = useSelector((state) =>
    business ? selectBusinessReviewsBundle(state, business) : null,
  )
  const average = bundle?.rating?.average || 0
  const count = bundle?.rating?.count || 0

  if (!count) return null

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-black text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 ${className}`}
      title={`${average.toFixed(1)} / 5 · ${count}`}
    >
      <FiStar className="shrink-0 fill-current" />
      {average.toFixed(1)}
      {showCount ? <span className="font-semibold opacity-70">({count})</span> : null}
    </span>
  )
}
