import { useDispatch, useSelector } from 'react-redux'
import { FavoriteButton as AnimatedFavoriteButton } from '../../components/ui/FavoriteButton'
import { useLanguage } from '../../contexts/useLanguage'
import { phase3Text } from '../../i18n/phase3I18n'
import { toggleAccountFavorite } from './accountSlice'
import { buildFavoriteSnapshot } from './favoriteUtils'

/**
 * CTA favori pages détail — version animée (pop + burst).
 */
export function FavoriteButton({
  relatedId,
  relatedType,
  title,
  path,
  entity,
  variant = 'solid',
  className = 'w-full !shadow-none',
  showLabel = true,
}) {
  const dispatch = useDispatch()
  const { t } = useLanguage()
  const p3 = (key, vars) => phase3Text(t, key, vars)
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
      variant={variant}
      label={
        showLabel
          ? p3(favorite ? 'favorites.saved' : 'favorites.addToFavorites')
          : undefined
      }
      className={className}
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
