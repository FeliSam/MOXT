import { useDispatch, useSelector } from 'react-redux'
import { useLocation, useNavigate } from 'react-router-dom'
import { FavoriteButton as AnimatedFavoriteButton } from '../../components/ui/FavoriteButton'
import { useLanguage } from '../../contexts/useLanguage'
import { phase3Text } from '../../i18n/phase3I18n'
import { addToast } from '../ui/uiSlice'
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
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useLanguage()
  const p3 = (key, vars) => phase3Text(t, key, vars)
  const user = useSelector((state) => state.auth.user)
  const favorite = useSelector((state) =>
    state.account.favorites.some(
      (item) =>
        item.userId === user?.id &&
        item.relatedType === relatedType &&
        item.relatedId === relatedId,
    ),
  )

  function handleToggle(event) {
    if (!user?.id) {
      event?.preventDefault?.()
      event?.stopPropagation?.()
      const returnTo = encodeURIComponent(`${location.pathname}${location.search}`)
      dispatch(
        addToast({
          title: 'Connexion requise',
          message: 'Connectez-vous pour enregistrer ce favori.',
          tone: 'info',
        }),
      )
      navigate(`/login?returnTo=${returnTo}`)
      return
    }
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
      active={favorite}
      variant={variant}
      label={
        showLabel
          ? p3(favorite ? 'favorites.saved' : 'favorites.addToFavorites')
          : undefined
      }
      className={
        showLabel ? className : className.replace(/\bw-full\b/g, '').trim() || 'shrink-0 !shadow-none'
      }
      onToggle={handleToggle}
    />
  )
}
