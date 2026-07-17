import { useState } from 'react'
import { FiEdit3, FiExternalLink, FiTrash2 } from 'react-icons/fi'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { useLanguage } from '../../contexts/useLanguage'
import { deleteBusinessByUser } from '../../features/businesses/businessSlice'
import { professionalText } from '../../features/businesses/professionalI18n'
import { addToast } from '../../features/ui/uiSlice'

export function ActionsPanel({ business }) {
  const { t } = useLanguage()
  const pt = (key, vars) => professionalText(t, key, vars)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const user = useSelector((state) => state.auth.user)
  const [confirmOpen, setConfirmOpen] = useState(false)

  function handleDelete() {
    dispatch(deleteBusinessByUser({ id: business.id, ownerId: user.id }))
    dispatch(
      addToast({
        title: pt('professional.actions.toast.deletedTitle'),
        message: pt('professional.actions.toast.deletedBody'),
        tone: 'success',
      }),
    )
    navigate('/businesses/setup')
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
      <Card className="grid gap-4">
        <h2 className="font-black">{pt('professional.actions.manageTitle')}</h2>
        <p className="text-sm leading-6 text-[var(--app-text-muted)]">
          {pt('professional.actions.manageBody')}
        </p>
        <div className="flex flex-wrap gap-2">
          <Link to="/businesses/setup">
            <Button variant="secondary" icon={FiEdit3}>
              {pt('professional.actions.editBusiness')}
            </Button>
          </Link>
          <Link to={`/businesses/${business.id}`}>
            <Button variant="secondary" icon={FiExternalLink}>
              {pt('professional.actions.viewPublic')}
            </Button>
          </Link>
        </div>
      </Card>

      <Card className="border border-red-100 bg-red-50/40 dark:border-red-900/40 dark:bg-red-950/20">
        <h3 className="font-black text-red-800 dark:text-red-300">
          {pt('professional.actions.dangerTitle')}
        </h3>
        <p className="mt-2 text-sm leading-6 text-[var(--app-text-muted)]">
          {pt('professional.actions.dangerBody')}
        </p>
        {!confirmOpen ? (
          <Button
            className="mt-4"
            variant="danger"
            icon={FiTrash2}
            onClick={() => setConfirmOpen(true)}
          >
            {pt('professional.actions.deleteBusiness')}
          </Button>
        ) : (
          <div className="mt-4 grid gap-2">
            <p className="text-sm font-semibold text-red-700 dark:text-red-300">
              {pt('professional.actions.confirmDelete', { name: business.name })}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button variant="danger" icon={FiTrash2} onClick={handleDelete}>
                {pt('professional.actions.yesDelete')}
              </Button>
              <Button variant="secondary" onClick={() => setConfirmOpen(false)}>
                {pt('professional.actions.cancel')}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
