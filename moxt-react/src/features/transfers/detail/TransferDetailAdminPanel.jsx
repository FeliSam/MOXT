import { FiShield } from 'react-icons/fi'
import { useDispatch } from 'react-redux'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'
import { TRANSFER_STATUS, TRANSFER_TRANSITIONS } from '../transferConfig'
import { moderateTransfer } from '../transferSlice'

export function TransferDetailAdminPanel({ transfer }) {
  const dispatch = useDispatch()

  return (
    <Card className="border border-brand-100 bg-brand-50/60 dark:border-brand-900/40 dark:bg-brand-950/20">
      <h2 className="flex items-center gap-2 font-black">
        <FiShield className="text-brand-700" />
        Actions administrateur
      </h2>
      <p className="mt-2 text-sm leading-6 text-[var(--app-text-muted)]">
        Intervention directe depuis la fiche transfert.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {TRANSFER_TRANSITIONS[transfer.status] ? (
          <Button
            onClick={() =>
              dispatch(
                moderateTransfer({
                  id: transfer.id,
                  status: TRANSFER_TRANSITIONS[transfer.status],
                }),
              )
            }
          >
            Passer à {TRANSFER_TRANSITIONS[transfer.status]}
          </Button>
        ) : null}
        {transfer.status !== TRANSFER_STATUS.CANCELLED ? (
          <Button
            variant="danger"
            onClick={() =>
              dispatch(moderateTransfer({ id: transfer.id, status: TRANSFER_STATUS.CANCELLED }))
            }
          >
            Forcer l’annulation
          </Button>
        ) : null}
      </div>
    </Card>
  )
}
