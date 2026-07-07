import { FiHeart } from 'react-icons/fi'
import { useDispatch, useSelector } from 'react-redux'
import { Button } from '../../components/ui/Button'
import { toggleAccountFavorite } from './accountSlice'
import { buildFavoriteSnapshot } from './favoriteUtils'

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
    <Button
      variant={favorite ? 'primary' : 'secondary'}
      icon={FiHeart}
      onClick={() =>
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
    >
      {favorite ? 'Enregistré' : 'Ajouter aux favoris'}
    </Button>
  )
}
