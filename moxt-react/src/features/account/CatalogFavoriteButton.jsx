/**
 * Favori overlay pour les cards catalogue (jobs / colis / événements).
 * Hors du Link parent — à placer en sibling avec `relative` sur le wrapper.
 */
import { useDispatch, useSelector } from 'react-redux'
import { FavoriteButton as AnimatedFavoriteButton } from '../../components/ui/FavoriteButton'
import { toggleAccountFavorite } from './accountSlice'
import { buildFavoriteSnapshot } from './favoriteUtils'

export function CatalogFavoriteButton({
  relatedId,
  relatedType,
  title,
  path,
  entity,
  className = '!absolute !right-2.5 !top-2.5 z-30 shadow-sm',
  variant = 'solid',
  size = 'sm',
}) {
  const dispatch = useDispatch()
  const user = useSelector((state) => state.auth.user)
  const liked = useSelector((state) =>
    state.account.favorites.some(
      (item) =>
        item.userId === user?.id &&
        item.relatedType === relatedType &&
        item.relatedId === relatedId,
    ),
  )

  if (!user || !relatedId) return null

  function handleToggle(event) {
    event.preventDefault()
    event.stopPropagation()
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

  return (
    <AnimatedFavoriteButton
      active={liked}
      onToggle={handleToggle}
      variant={variant}
      size={size}
      className={className}
    />
  )
}
