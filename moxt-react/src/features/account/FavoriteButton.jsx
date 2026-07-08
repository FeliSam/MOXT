import { useDispatch, useSelector } from 'react-redux'
import { FavoriteButton as AnimatedFavoriteButton } from '../../components/ui/FavoriteButton'
import { toggleAccountFavorite } from './accountSlice'
import { buildFavoriteSnapshot } from './favoriteUtils'

/**
 * CTA favori pages détail — version animée (pop + burst).
 */
export function FavoriteButton({ relatedId, relatedType, title, path, entity }) {
  const dispatch = useDispatch()
  const user = useSelector((state) => state.auth.user)
  const favorite = useSelector((state) =>
    state.account.favorites.some(
      (item) =>
        item.userId === user.id && item.relatedType === relatedType && item.relatedId === relatedId,
    ),
  )

  return (
    <AnimatedFavoriteButton
      active={favorite}
      variant="solid"
      label={favorite ? 'Enregistré' : 'Ajouter aux favoris'}
      className="w-full !shadow-none"
      onToggle={() =>
        dispatch(
          toggleAccountFavorite({
            userId: user.id,
            relatedType,
            relatedId,
            title,
            path,
            snapshot: entity ? buildFavoriteSnapshot(relatedType, entity) : undefined,
          }),
        )
      }
    />
  )
}
