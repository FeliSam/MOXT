import { useState } from 'react'
import { FiEdit3, FiExternalLink, FiTrash2 } from 'react-icons/fi'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { deleteBusinessByUser } from '../../features/businesses/businessSlice'
import { addToast } from '../../features/ui/uiSlice'

export function ActionsPanel({ business }) {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const user = useSelector((state) => state.auth.user)
  const [confirmOpen, setConfirmOpen] = useState(false)

  function handleDelete() {
    dispatch(deleteBusinessByUser({ id: business.id, ownerId: user.id }))
    dispatch(
      addToast({
        title: 'Entreprise supprimée',
        message:
          'Votre fiche n’est plus visible pour vous. Vous pouvez en créer une nouvelle à tout moment.',
        tone: 'success',
      }),
    )
    navigate('/businesses/setup')
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
      <Card className="grid gap-4">
        <h2 className="font-black">Gestion du profil</h2>
        <p className="text-sm leading-6 text-[var(--app-text-muted)]">
          Modifiez votre fiche, consultez la version publique ou préparez une nouvelle publication
          dans l’annuaire.
        </p>
        <div className="flex flex-wrap gap-2">
          <Link to="/businesses/setup">
            <Button variant="secondary" icon={FiEdit3}>
              Modifier mon entreprise
            </Button>
          </Link>
          <Link to={`/businesses/${business.id}`}>
            <Button variant="secondary" icon={FiExternalLink}>
              Voir la fiche publique
            </Button>
          </Link>
        </div>
      </Card>

      <Card className="border border-red-100 bg-red-50/40 dark:border-red-900/40 dark:bg-red-950/20">
        <h3 className="font-black text-red-800 dark:text-red-300">Zone sensible</h3>
        <p className="mt-2 text-sm leading-6 text-[var(--app-text-muted)]">
          La suppression retire définitivement votre entreprise de votre espace. Elle reste
          consultable par l’équipe MOXT. Vous pourrez ensuite en créer une nouvelle.
        </p>
        {!confirmOpen ? (
          <Button
            className="mt-4"
            variant="danger"
            icon={FiTrash2}
            onClick={() => setConfirmOpen(true)}
          >
            Supprimer mon entreprise
          </Button>
        ) : (
          <div className="mt-4 grid gap-2">
            <p className="text-sm font-semibold text-red-700 dark:text-red-300">
              Confirmer la suppression de « {business.name} » ?
            </p>
            <div className="flex flex-wrap gap-2">
              <Button variant="danger" icon={FiTrash2} onClick={handleDelete}>
                Oui, supprimer
              </Button>
              <Button variant="secondary" onClick={() => setConfirmOpen(false)}>
                Annuler
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
